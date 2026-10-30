"use client";

export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main><section className="status-card"><span className="eyebrow">DASHBOARD ERROR</span><h1>The authorized data view could not be loaded.</h1><p>Check the database connection and role assignment, then try again.</p><button className="btn primary" onClick={reset}>Try again</button></section></main>;
}
