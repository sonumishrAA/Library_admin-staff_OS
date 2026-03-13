import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader';
import { useShellContext } from '../components/useShellContext';
import { useAuth } from '../context/AuthContext';
import { portalApi } from '../lib/api';
import { getLockerOptions } from '../lib/portal';

export default function LockersPage() {
  const { contextData, refreshContext } = useShellContext();
  const { token } = useAuth();
  const [studentId, setStudentId] = useState('');
  const [lockerNumber, setLockerNumber] = useState('');
  const [saving, setSaving] = useState(false);

  const selectedStudent = useMemo(() => contextData.students.find((student) => student.id === studentId) || null, [contextData, studentId]);
  const lockerOptions = useMemo(() => getLockerOptions(contextData, selectedStudent?.gender), [contextData, selectedStudent]);

  const submitLockerChange = async (assignLocker) => {
    if (!studentId) return;
    setSaving(true);
    try {
      await portalApi.assignLocker(token, {
        library_id: contextData.library.id,
        student_id: studentId,
        assign_locker: assignLocker,
        locker_number: assignLocker ? lockerNumber || null : null,
      });
      toast.success(assignLocker ? 'Locker updated' : 'Locker removed');
      setLockerNumber('');
      setStudentId('');
      refreshContext();
    } catch (err) {
      toast.error(err.message || 'Failed to update locker');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="stack-page">
      <PageHeader
        eyebrow="Lockers"
        title="See locker occupancy and move lockers without breaking eligibility rules."
        description="Locker assignment stays filtered by student category and configured policy."
      />

      <section className="dashboard-grid">
        <article className="panel panel--table">
          <h3>Locker inventory</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Locker</th>
                <th>Category</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {contextData.lockers.map((locker) => (
                <tr key={locker.id}>
                  <td>{locker.locker_number}</td>
                  <td>{locker.gender || 'any'}</td>
                  <td>{locker.is_occupied ? 'Occupied' : 'Vacant'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>

        <div className="panel stack-form">
          <h3>Assign or change locker</h3>
          <label>
            <span>Student</span>
            <select value={studentId} onChange={(event) => setStudentId(event.target.value)}>
              <option value="">Select student</option>
              {contextData.students.map((student) => (
                <option key={student.id} value={student.id}>{student.full_name} · {student.locker_number || 'No locker'}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Locker number</span>
            <select value={lockerNumber} onChange={(event) => setLockerNumber(event.target.value)}>
              <option value="">Auto assign first valid locker</option>
              {lockerOptions.map((locker) => <option key={locker} value={locker}>{locker}</option>)}
            </select>
          </label>
          <div className="button-row">
            <button type="button" className="primary-button" disabled={saving || !studentId} onClick={() => submitLockerChange(true)}>
              {saving ? 'Saving...' : 'Assign locker'}
            </button>
            <button type="button" className="ghost-button" disabled={saving || !studentId} onClick={() => submitLockerChange(false)}>
              Remove locker
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
