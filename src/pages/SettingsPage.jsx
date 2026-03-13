import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import FeePlansEditor from '../components/FeePlansEditor';
import PageHeader from '../components/PageHeader';
import { useShellContext } from '../components/useShellContext';
import { useAuth } from '../context/AuthContext';
import { portalApi } from '../lib/api';

export default function SettingsPage() {
  const { contextData, refreshContext } = useShellContext();
  const { token } = useAuth();
  const [shifts, setShifts] = useState([]);
  const [combos, setCombos] = useState([]);
  const [lockerPolicies, setLockerPolicies] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setShifts(contextData.shifts || []);
    setCombos(contextData.combined_shift_pricing || []);
    setLockerPolicies(contextData.locker_policies || []);
  }, [contextData]);

  if (contextData.user.role !== 'owner') {
    return (
      <div className="stack-page">
        <PageHeader eyebrow="Settings" title="Only owners can change pricing, combos, and locker policies." description="Staff users can operate daily tasks but cannot touch branch pricing or rules." />
        <div className="panel">Owner-only workspace.</div>
      </div>
    );
  }

  const submitSettings = async () => {
    setSaving(true);
    try {
      await portalApi.updatePricing(token, {
        library_id: contextData.library.id,
        shifts,
        combined_shift_pricing: combos,
        locker_policies: lockerPolicies,
      });
      toast.success('Pricing and policy settings saved');
      refreshContext();
    } catch (err) {
      toast.error(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="stack-page">
      <PageHeader
        eyebrow="Settings"
        title="Adjust shift pricing, combo pricing, and locker rules from the owner workspace."
        description="Only backend-validated values are saved. Staff never gets write access here."
        actions={<button type="button" className="primary-button" onClick={submitSettings} disabled={saving}>{saving ? 'Saving...' : 'Save settings'}</button>}
      />

      <section className="stack-page">
        <article className="panel stack-form">
          <h3>Shift pricing</h3>
          {shifts.map((shift, index) => (
            <div className="config-card" key={shift.id}>
              <div className="config-card__title-row">
                <div>
                  <strong>{shift.label}</strong>
                  <span>{shift.start_time} - {shift.end_time}</span>
                </div>
                <span>{shift.duration_hours}h</span>
              </div>
              <FeePlansEditor
                value={shift.fee_plans || { 1: Number(shift.monthly_fee || 0) }}
                onChange={(nextValue) => setShifts((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, fee_plans: nextValue, monthly_fee: Number(nextValue['1'] || item.monthly_fee || 0) } : item))}
              />
            </div>
          ))}
        </article>

        <article className="panel stack-form">
          <h3>Combo pricing</h3>
          {combos.length ? combos.map((combo, index) => (
            <div className="config-card" key={combo.id || combo.label || index}>
              <div className="config-card__title-row">
                <div>
                  <strong>{combo.label}</strong>
                  <span>{(combo.shift_ids || []).length} shifts in combo</span>
                </div>
              </div>
              <FeePlansEditor
                value={combo.fee_plans || { 1: Number(combo.combined_fee || 0) }}
                onChange={(nextValue) => setCombos((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, fee_plans: nextValue, combined_fee: Number(nextValue['1'] || item.combined_fee || 0) } : item))}
              />
            </div>
          )) : <p className="muted-copy">No combined shift pricing configured yet.</p>}
        </article>

        <article className="panel stack-form">
          <h3>Locker policies</h3>
          {lockerPolicies.map((policy, index) => (
            <div className="config-card" key={policy.id || index}>
              <div className="form-grid form-grid--three">
                <label>
                  <span>Category</span>
                  <select value={policy.gender || 'any'} onChange={(event) => setLockerPolicies((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, gender: event.target.value } : item))}>
                    <option value="any">Any</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </label>
                <label>
                  <span>Eligible shift type</span>
                  <select value={policy.eligible_shift_type || 'any'} onChange={(event) => setLockerPolicies((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, eligible_shift_type: event.target.value } : item))}>
                    <option value="any">Any shift</option>
                    <option value="12h_plus">12h or longer</option>
                    <option value="24h_only">24h only</option>
                    <option value="single_shift">Single shift</option>
                  </select>
                </label>
                <label>
                  <span>Monthly fee</span>
                  <input type="number" min="0" value={policy.monthly_fee || 0} onChange={(event) => setLockerPolicies((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, monthly_fee: Number(event.target.value || 0) } : item))} />
                </label>
              </div>
              <label>
                <span>Description</span>
                <input value={policy.description || ''} onChange={(event) => setLockerPolicies((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, description: event.target.value } : item))} />
              </label>
            </div>
          ))}
        </article>
      </section>
    </div>
  );
}
