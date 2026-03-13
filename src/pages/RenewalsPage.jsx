import { useState } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import { useShellContext } from '../components/useShellContext';
import { useAuth } from '../context/AuthContext';
import { portalApi } from '../lib/api';
import { calculateAdmissionAmount, formatCurrency, formatDate, monthsFromPlan, resolvePricingOption, uniqueMonthOptions } from '../lib/portal';

export default function RenewalsPage() {
  const { contextData, refreshContext } = useShellContext();
  const { token } = useAuth();
  const [activeStudentId, setActiveStudentId] = useState('');
  const [duration, setDuration] = useState('1');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const dueStudents = contextData.students.filter((student) => student.is_expired || student.due_soon);

  const getActiveShiftIds = (student) => {
    if (!student) return [];
    // Safety check: Only identify shifts that belong to their current active bundle
    // rather than all historical shifts they may have ever had.
    const activeMemberships = student.memberships.filter((m) => m.end_date === student.current_end_date);
    return [...new Set(activeMemberships.map((m) => m.shift_id))];
  };

  const activeStudent = dueStudents.find((student) => student.id === activeStudentId) || null;
  const activeShiftIds = getActiveShiftIds(activeStudent);
  const durationOptions = uniqueMonthOptions(contextData, activeShiftIds);
  const pricing = calculateAdmissionAmount(contextData, activeShiftIds, monthsFromPlan(duration), Boolean(activeStudent?.locker_number), activeStudent?.gender);

  const submitRenewal = async (event) => {
    event.preventDefault();
    if (!activeStudent) {
      toast.error('Select a student to renew');
      return;
    }

    setSaving(true);
    try {
      await portalApi.renewMembershipCash(token, {
        library_id: contextData.library.id,
        student_id: activeStudent.id,
        plan_duration: duration,
        payment_note: note,
        studentName: activeStudent.full_name,
        shiftIds: activeShiftIds,
        durationMonths: parseInt(duration, 10),
      });
      toast.success('Membership renewed');
      setActiveStudentId('');
      setDuration('1');
      setNote('');
      refreshContext();
    } catch (err) {
      toast.error(err.message || 'Failed to renew membership');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="stack-page">
      <PageHeader
        eyebrow="Renewals"
        title="Keep expired and soon-to-expire students visible until cash is collected and access is extended."
        description="Staff can collect cash renewals, but only owners can request subscription renewal for the library itself."
      />

      <section className="dashboard-grid">
        <article className="panel">
          <h3>Due or expired students</h3>
          <div className="scrollable-list" style={{ maxHeight: '600px' }}>
            <div className="list-stack">
              {dueStudents.length ? dueStudents.map((student) => (
                <button type="button" className={`list-row list-row--button ${activeStudentId === student.id ? 'is-active' : ''}`} key={student.id} onClick={() => { setActiveStudentId(student.id); setDuration(String(uniqueMonthOptions(contextData, student.memberships.map((membership) => membership.shift_id))[0] || 1)); }}>
                  <div>
                    <strong>{student.full_name}</strong>
                    <span>{student.shift_labels.join(' + ')} · Seat {student.seat_number || 'Auto'}</span>
                  </div>
                  <StatusBadge label={student.is_expired ? 'Expired' : 'Due soon'} tone={student.is_expired ? 'danger' : 'warning'} />
                </button>
              )) : <p className="muted-copy">No renewals are due right now.</p>}
            </div>
          </div>
        </article>

        <form className="panel stack-form" onSubmit={submitRenewal}>
          <h3>Collect renewal cash</h3>
          {activeStudent ? (
            <>
              <div className="summary-strip summary-strip--compact">
                <div>
                  <span>Student</span>
                  <strong>{activeStudent.full_name}</strong>
                </div>
                <div>
                  <span>Current expiry</span>
                  <strong>{formatDate(activeStudent.current_end_date)}</strong>
                </div>
                <div>
                  <span>Locker</span>
                  <strong>{activeStudent.locker_number || 'No locker'}</strong>
                </div>
              </div>
              <label>
                <span>Plan duration</span>
                <select value={duration} onChange={(event) => setDuration(event.target.value)}>
                  {durationOptions.map((month) => <option key={month} value={month}>{month} Month{month > 1 ? 's' : ''}</option>)}
                </select>
              </label>
              <label>
                <span>Cash note</span>
                <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Optional note for renewal record" />
              </label>
              <div className="summary-strip summary-strip--compact">
                <div>
                  <span>Renewal amount</span>
                  <strong>{formatCurrency(pricing.total)}</strong>
                </div>
                <div>
                  <span>Shift plan</span>
                  <strong>{resolvePricingOption(contextData, shiftIds)?.label || 'Configured shift'}</strong>
                </div>
              </div>
              <button type="submit" className="primary-button" disabled={saving}>
                {saving ? 'Recording renewal...' : 'Record cash renewal'}
              </button>
            </>
          ) : <p className="muted-copy">Select a student from the list to renew membership.</p>}
        </form>
      </section>
    </div>
  );
}
