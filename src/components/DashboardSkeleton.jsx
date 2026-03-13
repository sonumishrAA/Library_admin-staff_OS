export default function DashboardSkeleton() {
  return (
    <>
      <section className="metrics-grid">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="metric-card skeleton-card">
            <div className="skeleton skeleton-text" style={{ width: "60%" }}></div>
            <div className="skeleton skeleton-title"></div>
            <div className="skeleton skeleton-text" style={{ width: "80%" }}></div>
          </div>
        ))}
      </section>

      <section className="dashboard-grid">
        {Array.from({ length: 4 }).map((_, i) => (
          <article key={i} className="panel skeleton-panel">
            <div className="skeleton skeleton-heading"></div>
            <div className="list-stack">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="list-row skeleton-row">
                  <div>
                    <div className="skeleton skeleton-text" style={{ width: "120px" }}></div>
                    <div className="skeleton skeleton-text-sm" style={{ width: "80px" }}></div>
                  </div>
                  <div className="skeleton skeleton-pill"></div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
