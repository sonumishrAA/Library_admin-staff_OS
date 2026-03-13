export default function StatusBadge({ label, tone = 'default' }) {
  return <span className={`status-badge status-badge--${tone}`}>{label}</span>;
}
