import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import { formatDate } from '../lib/portal';

const toneFor = (status) => {
  if (status === 'active') return 'success';
  if (status === 'pending_approval') return 'warning';
  return 'danger';
};

export default function LibrarySelectPage() {
  const { libraries, selectLibrary, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (libraries.length === 1) {
      const library = libraries[0];
      const route = library.subscription?.is_locked && library.role === 'owner' ? 'subscription' : 'dashboard';
      navigate(`/app/${library.id}/${route}`, { replace: true });
    }
  }, [libraries]);

  return (
    <div className="select-layout">
      <div className="page-header">
        <div>
          <p className="page-header__eyebrow">Choose library</p>
          <h1>Open the branch you want to operate</h1>
          <p className="page-header__description">Owners with multiple libraries land here first. Staff can only open assigned libraries.</p>
        </div>
        <button type="button" className="ghost-button" onClick={logout}>Logout</button>
      </div>

      <div className="library-grid">
        {libraries.map((library) => {
          const isStaffBlocked = library.role === 'staff' && library.subscription?.is_locked;
          const route = library.subscription?.is_locked && library.role === 'owner' ? 'subscription' : 'dashboard';
          return (
            <article className="library-card" key={library.id}>
              <div className="library-card__top">
                <div>
                  <h2>{library.name}</h2>
                  <p>{[library.city, library.state].filter(Boolean).join(', ') || 'City not set'}</p>
                </div>
                <StatusBadge label={library.subscription?.label || 'Active'} tone={toneFor(library.subscription?.status)} />
              </div>
              <div className="library-card__meta">
                <span>{library.role === 'owner' ? 'Owner access' : 'Staff access'}</span>
                <span>Expiry: {formatDate(library.subscription?.ends_on)}</span>
              </div>
              <button
                type="button"
                className="primary-button"
                disabled={isStaffBlocked}
                onClick={() => {
                  selectLibrary(library.id);
                  navigate(`/app/${library.id}/${route}`);
                }}
              >
                {isStaffBlocked ? 'Subscription locked' : library.subscription?.is_locked ? 'Open renewal' : 'Open library'}
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}
