import { useEffect, useMemo, useState } from "react";
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { portalApi } from "../lib/api";
import { formatDate } from "../lib/portal";
import StatusBadge from "./StatusBadge";

const navItems = [
  { label: "Dashboard", path: "dashboard" },
  { label: "Students", path: "students" },
  { label: "Admission", path: "admissions/new" },
  { label: "Seats", path: "seats" },
  { label: "Renewals", path: "renewals" },
  { label: "Lockers", path: "lockers" },
  { label: "Staff", path: "staff" },
  { label: "Settings", path: "settings" },
  { label: "Subscription", path: "subscription" },
];

const bottomNav = [
  { label: "Dashboard", path: "dashboard" },
  { label: "Students", path: "students" },
  { label: "Seats", path: "seats" },
  { label: "Renewals", path: "renewals" },
  { label: "More", path: "settings" },
];

const toneForSubscription = (status) => {
  if (status === "active") return "success";
  if (status === "pending_approval") return "warning";
  if (status === "expired" || status === "paused") return "danger";
  return "default";
};

export default function AppShell() {
  const { libraryId } = useParams();
  const { token, libraries, logout, selectLibrary } = useAuth();
  const [contextData, setContextData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const linkedLibrary = useMemo(
    () => libraries.find((item) => item.id === libraryId) || null,
    [libraries, libraryId],
  );

  const refreshContext = async () => {
    if (!token || !libraryId) {
      console.warn("[AppShell] Missing token or libraryId:", {
        token: token ? `${token.substring(0, 20)}...` : "NO TOKEN",
        libraryId,
      });
      return;
    }
    setLoading(true);
    setError("");
    try {
      console.log(
        "[AppShell] Fetching context with token:",
        `${token.substring(0, 20)}...`,
      );
      const response = await portalApi.getLibraryContext(token, libraryId);
      setContextData(response);
      selectLibrary(libraryId);
    } catch (err) {
      const message = err.message || "Failed to load library context";
      setError(message);
      if (/authorization|unauthorized|invalid portal token/i.test(message)) {
        toast.error("Session expired. Please sign in again.");
        logout();
        navigate("/login", { replace: true });
        return;
      }
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!linkedLibrary && libraries.length) {
      navigate("/libraries", { replace: true });
      return;
    }
    refreshContext();
  }, [libraryId, token]);

  useEffect(() => {
    if (!contextData?.subscription || !contextData?.user) return;
    if (
      contextData.subscription.is_locked &&
      contextData.user.role === "owner" &&
      !location.pathname.endsWith("/subscription")
    ) {
      navigate(`/app/${libraryId}/subscription`, { replace: true });
    }
  }, [contextData, libraryId, location.pathname, navigate]);

  if (!linkedLibrary && libraries.length) {
    return null;
  }

  return (
    <div className="shell">
      <aside className="shell__sidebar">
        <div className="shell__brand">
          <span>LibraryOS</span>
          <small>Owner + Staff Portal</small>
        </div>
        <nav className="shell__nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={`/app/${libraryId}/${item.path}`}
              className={({ isActive }) =>
                `shell__nav-link${isActive ? " active" : ""}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="shell__sidebar-footer">
          <button
            type="button"
            className="ghost-button"
            onClick={() => navigate("/libraries")}
          >
            Switch library
          </button>
          <button
            type="button"
            className="ghost-button"
            onClick={() => {
              logout();
              navigate("/login");
            }}
          >
            Logout
          </button>
        </div>
      </aside>

      <div className="shell__content">
        <header className="shell__topbar">
          <div>
            <p className="shell__eyebrow">Library dashboard</p>
            <h1>
              {contextData?.library?.name || linkedLibrary?.name || "Library"}
            </h1>
            <div className="shell__meta-row">
              <StatusBadge
                label={
                  contextData?.subscription?.label ||
                  linkedLibrary?.subscription?.label ||
                  "Active"
                }
                tone={toneForSubscription(
                  contextData?.subscription?.status ||
                    linkedLibrary?.subscription?.status,
                )}
              />
              <span>
                Subscription ends{" "}
                {formatDate(
                  contextData?.subscription?.ends_on ||
                    linkedLibrary?.subscription?.ends_on,
                )}
              </span>
              <span>
                {contextData?.user?.role === "owner"
                  ? "Owner access"
                  : "Staff access"}
              </span>
            </div>
          </div>
          <div className="shell__topbar-right">
            <div className="shell__stat-chip">
              <strong>
                {contextData?.notifications?.filter((item) => !item.read_at)
                  .length || 0}
              </strong>
              <span>Unread alerts</span>
            </div>
            <button
              type="button"
              className="primary-button"
              onClick={() => navigate("/libraries")}
            >
              Libraries
            </button>
          </div>
        </header>

        {loading ? (
          <div className="panel">Loading library workspace...</div>
        ) : null}
        {!loading && error ? (
          <div className="panel panel--danger">{error}</div>
        ) : null}
        {!loading && !error ? (
          <main className="shell__main">
            <Outlet context={{ contextData, refreshContext, linkedLibrary }} />
          </main>
        ) : null}
      </div>

      <nav className="shell__bottom-nav">
        {bottomNav.map((item) => (
          <NavLink
            key={item.path}
            to={`/app/${libraryId}/${item.path}`}
            className={({ isActive }) =>
              `shell__bottom-link${isActive ? " active" : ""}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
