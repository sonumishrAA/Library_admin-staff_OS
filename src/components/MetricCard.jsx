import { Link } from 'react-router-dom';

export default function MetricCard({ label, value, hint, tone = 'default', to }) {
  const Card = (
    <article className={`metric-card metric-card--${tone} ${to ? 'metric-card--clickable' : ''}`}>
      <p>{label}</p>
      <strong>{value}</strong>
      {hint ? <span>{hint}</span> : null}
    </article>
  );

  if (to) {
    return <Link to={to} className="metric-card-link">{Card}</Link>;
  }

  return Card;
}
