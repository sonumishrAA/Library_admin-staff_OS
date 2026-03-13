import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import { useShellContext } from '../components/useShellContext';
import { useAuth } from '../context/AuthContext';
import { portalApi } from '../lib/api';
import { formatCurrency, formatDate } from '../lib/portal';

const toneFor = (status) => {
  if (status === 'active') return 'success';
  if (status === 'pending_approval') return 'warning';
  return 'danger';
};

export default function SubscriptionPage() {
  const { contextData, refreshContext } = useShellContext();
  const { token } = useAuth();
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [cashNote, setCashNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const response = await portalApi.getPricingPlans();
        setPlans(response.plans || []);
        setSelectedPlanId(response.plans?.[0]?.id || '');
      } catch (err) {
        toast.error(err.message || 'Failed to load subscription plans');
      }
    };
    loadPlans();
  }, []);

  const submitRenewalRequest = async () => {
    if (contextData.user.role !== 'owner') return;
    setSaving(true);
    try {
      await portalApi.requestRenewal(token, {
        library_id: contextData.library.id,
        pricing_plan_id: selectedPlanId,
        cash_reference_note: cashNote,
      });
      toast.success('Renewal request sent for admin approval');
      setCashNote('');
      refreshContext();
    } catch (err) {
      toast.error(err.message || 'Failed to request renewal');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="stack-page">
      <PageHeader
        eyebrow="Subscription"
        title="Keep the branch unlocked only while the platform subscription stays active."
        description="Staff cannot request or approve renewal. Owners can only raise a cash renewal request here."
      />

      <section className="dashboard-grid">
        <article className="panel">
          <h3>Current status</h3>
          <div className="summary-strip summary-strip--compact">
            <div>
              <span>Status</span>
              <strong><StatusBadge label={contextData.subscription.label} tone={toneFor(contextData.subscription.status)} /></strong>
            </div>
            <div>
              <span>Starts on</span>
              <strong>{formatDate(contextData.subscription.starts_on)}</strong>
            </div>
            <div>
              <span>Ends on</span>
              <strong>{formatDate(contextData.subscription.ends_on)}</strong>
            </div>
          </div>
          <p className="muted-copy">When the subscription expires, owner access is restricted to this renewal screen and staff access is blocked.</p>
        </article>

        <article className="panel stack-form">
          <h3>Request cash renewal</h3>
          {contextData.user.role !== 'owner' ? (
            <p className="muted-copy">Only the owner account can request subscription renewal.</p>
          ) : (
            <>
              <div className="pricing-grid">
                {plans.map((plan) => (
                  <button key={plan.id} type="button" className={`plan-tile ${selectedPlanId === plan.id ? 'is-active' : ''}`} onClick={() => setSelectedPlanId(plan.id)}>
                    <strong>{plan.label || plan.name}</strong>
                    <span>{formatCurrency(plan.base_price)}</span>
                    <small>{plan.duration_days} days</small>
                  </button>
                ))}
              </div>
              <label>
                <span>Cash handover note</span>
                <textarea rows="3" value={cashNote} onChange={(event) => setCashNote(event.target.value)} placeholder="Optional note for the platform admin approval team" />
              </label>
              <button type="button" className="primary-button" disabled={saving || !selectedPlanId} onClick={submitRenewalRequest}>
                {saving ? 'Sending request...' : 'Request renewal approval'}
              </button>
            </>
          )}
        </article>
      </section>
    </div>
  );
}
