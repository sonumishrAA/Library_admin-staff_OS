import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await login({ identifier, password });
      const firstLibrary = response.libraries?.[0];
      if (response.libraries?.length > 1) {
        navigate('/libraries', { replace: true });
      } else if (response.direct_open_library_id) {
        const onlyLibrary = firstLibrary;
        const route = onlyLibrary?.subscription?.is_locked && onlyLibrary?.role === 'owner' ? 'subscription' : 'dashboard';
        navigate(`/app/${response.direct_open_library_id}/${route}`, { replace: true });
      } else {
        navigate('/libraries', { replace: true });
      }
      toast.success('Portal login successful');
    } catch (err) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <section className="auth-layout__panel auth-layout__panel--brand">
        <p className="page-header__eyebrow">LibraryOS Control Center</p>
        <h1>Operate admissions, renewals, seats, lockers, and staff from one focused workspace.</h1>
        <div className="auth-layout__features">
          <div>
            <strong>Owner visibility</strong>
            <span>Staff actions generate alerts and stay in the audit trail.</span>
          </div>
          <div>
            <strong>Seat-safe admissions</strong>
            <span>Only vacant seats can be assigned for the selected shift combination.</span>
          </div>
          <div>
            <strong>Subscription gate</strong>
            <span>Expired libraries stay paused until cash renewal is approved.</span>
          </div>
        </div>
      </section>

      <section className="auth-layout__panel auth-layout__panel--form">
        <div className="auth-card">
          <p className="page-header__eyebrow">Owner or Staff Login</p>
          <h2>Sign in</h2>
          <p>Use owner email or login ID, staff email, or linked phone number.</p>
          <form className="stack-form" onSubmit={handleSubmit}>
            <label>
              <span>Email, login ID, or phone</span>
              <input value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder="owner@library.com, login ID, or 98xxxxxx" />
            </label>
            <label>
              <span>Password</span>
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter password" />
            </label>
            <button type="submit" className="primary-button" disabled={loading}>
              {loading ? 'Signing in...' : 'Open portal'}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
