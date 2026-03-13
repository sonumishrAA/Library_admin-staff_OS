// ─────────────────────────────────────────────────────────────
// AdmissionPage.jsx — New student admission form
//
// Flow:
// 1. User fills student details (name, phone, gender, address)
// 2. User picks a shift or combo from the dropdown
//    (buildPricingOptions creates the list from context)
// 3. User picks plan duration (1 month, 3 months, etc.)
// 4. Optionally assigns a locker
// 5. Submits → calls create-admission edge function
//
// SEAT LOGIC:
// - No seat dropdown exists — seat is auto-assigned by backend
// - Backend's ensureSeatSelection() finds the first available seat
//   that matches the student's gender and isn't occupied for
//   any of the BASE shifts in the selected combo
// - Example: Student picks "Morning+Afternoon" combo
//   → Backend expands to [morning_uuid, afternoon_uuid]
//   → Finds a seat where BOTH morning AND afternoon are free
//   → Creates 2 seat_occupancy rows (one per base shift)
// ─────────────────────────────────────────────────────────────
import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader';
import { useShellContext } from '../components/useShellContext';
import { useAuth } from '../context/AuthContext';
import { portalApi } from '../lib/api';
import { buildPricingOptions, calculateAdmissionAmount, formatCurrency, getLockerOptions, monthsFromPlan, todayDate, uniqueMonthOptions, getPredictedSeat, checkLockerEligibility } from '../lib/portal';

const initialForm = {
  full_name: '',
  father_name: '',
  phone: '',
  gender: 'male',
  address: '',
  selection_key: '',
  plan_duration: '1',
  start_date: todayDate(),
  assign_locker: false,
  locker_number: '',
  payment_note: '',
};

export default function AdmissionPage() {
  const { contextData, refreshContext } = useShellContext();
  const { token } = useAuth();
  const [form, setForm] = useState(() => ({
    ...initialForm,
    selection_key: buildPricingOptions(contextData)[0]?.key || '',
  }));
  const [saving, setSaving] = useState(false);

  const pricingOptions = useMemo(() => buildPricingOptions(contextData), [contextData]);
  const activeOption = pricingOptions.find((item) => item.key === form.selection_key) || null;
  const durationOptions = uniqueMonthOptions(contextData, activeOption?.shift_ids || []);
  const computedAmount = calculateAdmissionAmount(contextData, activeOption?.shift_ids || [], monthsFromPlan(form.plan_duration), form.assign_locker, form.gender);
  const lockerOptions = getLockerOptions(contextData, form.gender);
  
  const predictedSeat = getPredictedSeat(contextData, activeOption?.shift_ids || [], form.gender);
  const lockerEligibility = checkLockerEligibility(contextData, activeOption?.shift_ids || [], form.gender);

  const updateField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submitAdmission = async (event) => {
    event.preventDefault();
    if (!activeOption) {
      toast.error('Select a shift or combo');
      return;
    }

    setSaving(true);
    try {
      await portalApi.createAdmission(token, {
        library_id: contextData.library.id,
        full_name: form.full_name,
        father_name: form.father_name,
        phone: form.phone,
        gender: form.gender,
        address: form.address,
        shift_ids: activeOption.shift_ids,
        plan_duration: form.plan_duration,
        start_date: form.start_date,
        assign_locker: form.assign_locker,
        locker_number: form.assign_locker ? form.locker_number || null : null,
        payment_note: form.payment_note,
      });
      toast.success('Admission created');
      setForm({
        ...initialForm,
        selection_key: pricingOptions[0]?.key || '',
      });
      refreshContext();
    } catch (err) {
      toast.error(err.message || 'Failed to create admission');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="stack-page">
      <PageHeader
        eyebrow="Admission"
        title="Create a student, allocate a valid seat, optionally assign a locker, and record cash in one flow."
        description="The backend validates seat vacancy and locker eligibility before saving anything."
      />

      <form className="panel stack-form" onSubmit={submitAdmission}>
        <div className="form-grid form-grid--two">
          <label>
            <span>Student name</span>
            <input value={form.full_name} onChange={(event) => updateField('full_name', event.target.value)} required />
          </label>
          <label>
            <span>Father name</span>
            <input value={form.father_name} onChange={(event) => updateField('father_name', event.target.value)} />
          </label>
          <label>
            <span>Phone</span>
            <input value={form.phone} onChange={(event) => updateField('phone', event.target.value)} required />
          </label>
          <label>
            <span>Gender</span>
            <select value={form.gender} onChange={(event) => updateField('gender', event.target.value)}>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </label>
        </div>

        <label>
          <span>Address</span>
          <textarea rows="3" value={form.address} onChange={(event) => updateField('address', event.target.value)} />
        </label>

        <div className="form-grid form-grid--three">
          <label>
            <span>Shift or combo</span>
            <select value={form.selection_key} onChange={(event) => updateField('selection_key', event.target.value)}>
              {pricingOptions.map((option) => (
                <option key={option.key} value={option.key}>{option.label}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Plan duration</span>
            <select value={form.plan_duration} onChange={(event) => updateField('plan_duration', event.target.value)}>
              {durationOptions.map((month) => <option key={month} value={month}>{month} Month{month > 1 ? 's' : ''}</option>)}
            </select>
          </label>
          <label>
            <span>Admission date</span>
            <input type="date" value={form.start_date} onChange={(event) => updateField('start_date', event.target.value)} />
          </label>
        </div>

        <div className="form-grid form-grid--two">
          <label className="toggle-field">
            <span>Seat allocation</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 0' }}>
              <span className="material-symbols-rounded" style={{ color: predictedSeat ? 'var(--green)' : 'var(--red)', fontSize: '18px' }}>
                {predictedSeat ? 'auto_awesome' : 'error'}
              </span>
              <span style={{ fontSize: '0.85rem', color: predictedSeat ? 'var(--navy-soft)' : 'var(--red)', fontWeight: predictedSeat ? 400 : 500 }}>
                {predictedSeat ? `Seat ${predictedSeat} will be auto-assigned` : 'No seats available for this shift/gender'}
              </span>
            </div>
          </label>
          <label className={`toggle-field ${!lockerEligibility.eligible ? 'disabled' : ''}`} style={{ opacity: lockerEligibility.eligible ? 1 : 0.6 }}>
            <span>Locker</span>
            <div className="toggle-field__inline">
              <input 
                type="checkbox" 
                checked={form.assign_locker && lockerEligibility.eligible} 
                onChange={(event) => updateField('assign_locker', event.target.checked)}
                disabled={!lockerEligibility.eligible} 
              />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span>Assign locker now</span>
                {!lockerEligibility.eligible && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--red)' }}>Not eligible based on policy</span>
                )}
              </div>
            </div>
          </label>
        </div>

        {form.assign_locker ? (
          <label>
            <span>Locker number</span>
            <select value={form.locker_number} onChange={(event) => updateField('locker_number', event.target.value)}>
              <option value="">Auto assign first valid locker</option>
              {lockerOptions.map((locker) => <option key={locker} value={locker}>{locker}</option>)}
            </select>
          </label>
        ) : null}

        <label>
          <span>Cash note</span>
          <input value={form.payment_note} onChange={(event) => updateField('payment_note', event.target.value)} placeholder="Optional note for owner and cash ledger" />
        </label>

        <div className="summary-strip">
          <div>
            <span>Shift fee</span>
            <strong>{formatCurrency(computedAmount.amount)}</strong>
          </div>
          <div>
            <span>Locker fee</span>
            <strong>{formatCurrency(computedAmount.lockerAmount)}</strong>
          </div>
          <div>
            <span>Total cash</span>
            <strong>{formatCurrency(computedAmount.total)}</strong>
          </div>
        </div>

        <button type="submit" className="primary-button" disabled={saving}>
          {saving ? 'Saving admission...' : 'Create admission'}
        </button>
      </form>
    </div>
  );
}
