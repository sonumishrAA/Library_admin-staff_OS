import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import DashboardSkeleton from '../components/DashboardSkeleton';
import MetricCard from '../components/MetricCard';
import PageHeader from '../components/PageHeader';
import { useShellContext } from '../components/useShellContext';
import { useAuth } from '../context/AuthContext';
import { portalApi } from '../lib/api';
import { formatCurrency, formatDate } from '../lib/portal';

export default function DashboardPage() {
  const { token } = useAuth();
  const { contextData } = useShellContext();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const response = await portalApi.getDashboard(token, contextData.library.id);
        setDashboard(response);
      } catch (err) {
        toast.error(err.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [contextData.library.id, token]);

  return (
    <div className="stack-page">
      <PageHeader
        eyebrow="Library pulse"
        title="See renewals, vacancies, collections, and staff movement without leaving one screen."
        description="This dashboard stays tuned to daily operations: dues, empty seats, expiring memberships, lockers, and owner visibility."
      />

      {loading || !dashboard ? <DashboardSkeleton /> : (
        <>
          <section className="metrics-grid">
            <MetricCard label="Active students" value={dashboard.metrics.active_students} hint="Currently live memberships" tone="success" />
            <MetricCard label="Expired" value={dashboard.metrics.expired_students} hint="Need renewal action" tone="danger" />
            <MetricCard label="Due in 7 days" value={dashboard.metrics.renewals_due_7_days} hint={`Till ${formatDate(dashboard.due_window_end)}`} tone="warning" />
            <MetricCard label="Vacant seats" value={dashboard.metrics.vacant_seats} hint="Immediately sellable" to={`/app/${contextData.library.id}/vacancies`} />
            <MetricCard label="Vacant lockers" value={dashboard.metrics.vacant_lockers} hint="Assignable now" to={`/app/${contextData.library.id}/vacancies`} />
            <MetricCard label="MRR" value={formatCurrency(dashboard.metrics.mrr)} hint="Monthly recurring revenue view" />
            <MetricCard label="Today cash" value={formatCurrency(dashboard.metrics.today_cash_collected)} hint="Collected today" />
            <MetricCard label="Unread owner alerts" value={dashboard.metrics.unread_notifications} hint="Owner inbox" />
          </section>

          <section className="dashboard-grid">
            <article className="panel">
              <h3>Action required</h3>
              <div className="scrollable-list">
                <div className="list-stack">
                  {dashboard.action_required.length ? dashboard.action_required.map((item) => (
                    <div className="list-row" key={`${item.type}-${item.student_id}`}>
                      <div>
                        <strong>{item.title}</strong>
                        <span>{formatDate(item.due_on)}</span>
                      </div>
                      <span className="list-row__pill">{item.type.replace(/_/g, ' ')}</span>
                    </div>
                  )) : <p className="muted-copy">No pending urgent action.</p>}
                </div>
              </div>
            </article>

            <article className="panel">
              <h3>Renewals due soon</h3>
              <div className="scrollable-list">
                <div className="list-stack">
                  {dashboard.renewals_due.length ? dashboard.renewals_due.map((student) => (
                    <div className="list-row" key={student.id}>
                      <div>
                        <strong>{student.full_name}</strong>
                        <span>{student.shift_labels.join(' + ')} · Seat {student.seat_number || 'Auto'}</span>
                      </div>
                      <span>{formatDate(student.end_date)}</span>
                    </div>
                  )) : <p className="muted-copy">Nothing due in the next 7 days.</p>}
                </div>
              </div>
            </article>

            <article className="panel">
              <h3>Shift vacancy map</h3>
              <div className="scrollable-list">
                <div className="list-stack">
                  {dashboard.vacancy_by_shift.map((row) => (
                    <div className="list-row" key={row.shift_id}>
                      <div>
                        <strong>{row.shift_label}</strong>
                        <span>Vacant seats</span>
                      </div>
                      <span className="list-row__pill">{row.vacant_count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </article>

            <article className="panel">
              <h3>Recent activity</h3>
              <div className="scrollable-list">
                <div className="list-stack">
                  {dashboard.recent_activity.length ? dashboard.recent_activity.map((event) => (
                    <div className="list-row" key={event.id}>
                      <div>
                        <strong>{event.summary}</strong>
                        <span>{event.actor_role || 'system'}</span>
                      </div>
                      <span>{new Date(event.created_at).toLocaleString('en-IN')}</span>
                    </div>
                  )) : <p className="muted-copy">No activity recorded yet.</p>}
                </div>
              </div>
            </article>
          </section>
        </>
      )}
    </div>
  );
}
