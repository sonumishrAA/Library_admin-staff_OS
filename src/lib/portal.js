export const formatCurrency = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;

export const formatDate = (value) => {
  if (!value) return 'Not set';
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(parsed);
};

export const todayDate = () => new Date().toISOString().split('T')[0];

export const addDays = (value, days) => {
  const parsed = new Date(`${value}T00:00:00`);
  parsed.setDate(parsed.getDate() + days);
  return parsed.toISOString().split('T')[0];
};

export const addMonths = (value, months) => {
  const parsed = new Date(`${value}T00:00:00`);
  parsed.setMonth(parsed.getMonth() + months);
  return parsed.toISOString().split('T')[0];
};

export const monthsFromPlan = (value) => {
  const numeric = Math.round(Number(value || 1));
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 1;
};

const normalizeShiftIds = (shiftIds) => {
  const list = Array.isArray(shiftIds) ? shiftIds : [shiftIds];
  return [...new Set(list.map((item) => String(item || '').trim()).filter(Boolean))].sort();
};

const sameSet = (left, right) => left.length === right.length && left.every((item, index) => item === right[index]);

const feeForDuration = (feePlans, durationMonths, fallbackMonthly = 0) => {
  const plans = feePlans && typeof feePlans === 'object' ? feePlans : {};
  const duration = monthsFromPlan(durationMonths);
  const exact = Number(plans[String(duration)]);
  if (Number.isFinite(exact)) return exact;
  const monthly = Number(plans['1']);
  if (Number.isFinite(monthly)) return monthly * duration;
  return Number.isFinite(Number(fallbackMonthly)) ? Number(fallbackMonthly) * duration : 0;
};

export const buildPricingOptions = (context) => {
  const shifts = context?.shifts || [];
  const combos = context?.combined_shift_pricing || [];
  return [
    ...shifts.map((shift) => ({
      type: 'shift',
      id: shift.id,
      key: `shift:${shift.id}`,
      label: shift.label,
      shift_ids: [shift.id],
      duration_hours: Number(shift.duration_hours || 0),
      fee_plans: shift.fee_plans || {},
      monthly_fee: Number(shift.monthly_fee || 0),
    })),
    ...combos.map((combo) => ({
      type: 'combo',
      id: combo.id,
      key: `combo:${combo.id}`,
      label: combo.label,
      shift_ids: normalizeShiftIds(combo.shift_ids || []),
      duration_hours: normalizeShiftIds(combo.shift_ids || []).reduce((sum, shiftId) => {
        const match = shifts.find((item) => item.id === shiftId);
        return sum + Number(match?.duration_hours || 0);
      }, 0),
      fee_plans: combo.fee_plans || {},
      monthly_fee: Number(combo.combined_fee || 0),
    })),
  ];
};

export const resolvePricingOption = (context, shiftIds) => {
  const normalized = normalizeShiftIds(shiftIds);
  const options = buildPricingOptions(context);
  return options.find((option) => sameSet(normalizeShiftIds(option.shift_ids), normalized)) || null;
};

export const calculateAdmissionAmount = (context, shiftIds, durationMonths, wantsLocker, gender) => {
  const option = resolvePricingOption(context, shiftIds);
  if (!option) {
    return { amount: 0, lockerAmount: 0, total: 0, durationHours: 0, option: null };
  }
  const amount = feeForDuration(option.fee_plans, durationMonths, option.monthly_fee);
  let lockerAmount = 0;
  if (wantsLocker) {
    const matchingPolicy = (context?.locker_policies || []).find((policy) => {
      const policyGender = String(policy.gender || 'any').toLowerCase();
      if (policyGender !== 'any' && policyGender !== String(gender || 'any').toLowerCase()) return false;
      const eligible = String(policy.eligible_shift_type || 'any');
      if (eligible === '24h_only') return Number(option.duration_hours || 0) >= 24;
      if (eligible === '12h_plus') return Number(option.duration_hours || 0) >= 12;
      if (eligible === 'single_shift') return Number(option.duration_hours || 0) < 12;
      return true;
    });
    lockerAmount = Number(matchingPolicy?.monthly_fee || 0) * monthsFromPlan(durationMonths);
  }
  return {
    amount,
    lockerAmount,
    total: amount + lockerAmount,
    durationHours: Number(option.duration_hours || 0),
    option,
  };
};



export const getLockerOptions = (context, gender) => {
  return (context?.lockers || [])
    .filter((locker) => !locker.is_occupied)
    .filter((locker) => {
      const lockerGender = String(locker.gender || 'any').toLowerCase();
      return lockerGender === 'any' || lockerGender === String(gender || 'any').toLowerCase();
    })
    .map((locker) => locker.locker_number);
};

export const uniqueMonthOptions = (context, shiftIds) => {
  const option = resolvePricingOption(context, shiftIds);
  if (!option) return [1];
  const entries = Object.keys(option.fee_plans || {})
    .map((key) => Number(key))
    .filter((value) => Number.isFinite(value) && value > 0)
    .sort((left, right) => left - right);
  return entries.length ? entries : [1];
};
