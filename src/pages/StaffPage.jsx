import { useState } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader';
import { useShellContext } from '../components/useShellContext';
import { useAuth } from '../context/AuthContext';
import { portalApi } from '../lib/api';

export default function StaffPage() {
  const { contextData, refreshContext } = useShellContext();
  const { token } = useAuth();
  const [form, setForm] = useState({ email: '', phone: '', password: '' });
  const [loading, setLoading] = useState(false);

  if (contextData.user.role !== 'owner') {
    return (
      <div className="stack-page">
        <PageHeader eyebrow="Staff" title="Only owners can manage staff accounts." description="Staff members can view this page but cannot change credentials or access." />
        <div className="panel">Owner-only workspace.</div>
      </div>
    );
  }

  const runAction = async (body, successMessage) => {
    setLoading(true);
    try {
      const response = await portalApi.manageStaff(token, { library_id: contextData.library.id, ...body });
      toast.success(successMessage);
      if (response?.plain_password) {
        toast.success(`Generated password: ${response.plain_password}`);
      }
      refreshContext();
    } catch (err) {
      toast.error(err.message || 'Staff action failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stack-page">
      <PageHeader
        eyebrow="Staff control"
        title="Owners can keep up to two active staff accounts per library."
        description="Staff can operate admissions and cash renewals, but cannot delete records or renew the library subscription."
      />

      <section className="dashboard-grid">
        <article className="panel panel--table">
          <h3>Current staff</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {contextData.staff.map((staff) => (
                <tr key={staff.id}>
                  <td>{staff.email}</td>
                  <td>{staff.phone || '—'}</td>
                  <td>{staff.status}</td>
                  <td>
                    <div className="button-row button-row--tight">
                      <button type="button" className="ghost-button" onClick={() => runAction({ action: 'reset_password', staff_user_id: staff.id }, 'Password reset')} disabled={loading}>Reset password</button>
                      <button type="button" className="ghost-button" onClick={() => runAction({ action: 'deactivate', staff_user_id: staff.id }, 'Staff deactivated')} disabled={loading}>Deactivate</button>
                      <button type="button" className="ghost-button danger-button" onClick={() => runAction({ action: 'remove', staff_user_id: staff.id }, 'Staff removed')} disabled={loading}>Remove</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>

        <form className="panel stack-form" onSubmit={(event) => {
          event.preventDefault();
          runAction({ action: 'create', ...form }, 'Staff created');
          setForm({ email: '', phone: '', password: '' });
        }}>
          <h3>Add staff account</h3>
          <label>
            <span>Email</span>
            <input value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required />
          </label>
          <label>
            <span>Phone</span>
            <input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
          </label>
          <label>
            <span>Password</span>
            <input type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} placeholder="Leave blank to auto-generate" />
          </label>
          <button type="submit" className="primary-button" disabled={loading}>Create staff</button>
        </form>
      </section>
    </div>
  );
}
