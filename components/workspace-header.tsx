import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import type { DashboardRole } from "@/domain/dashboard/types";

const ROLE_LABELS: Record<DashboardRole, string> = {
  sales: "Sales Coordinator",
  production_planner: "Production Planner",
  quality_engineer: "Quality Engineer",
};

export function WorkspaceHeader({ displayName, role }: { displayName: string; role: DashboardRole }) {
  const initials = role === "sales" ? "SC" : role === "production_planner" ? "PP" : "QE";
  return (
    <header className="site-header">
      <Link className="brand" href="/dashboard"><span className="brand-mark">✦</span><span>domel<small>DECISION WORKSPACE</small></span></Link>
      <nav aria-label="Main navigation">
        <Link aria-current="page" href="/dashboard">▦ Business Dashboard</Link>
        <span aria-disabled="true">▥ Scenario Planning</span>
        <span aria-disabled="true">◎ Industry Intelligence</span>
      </nav>
      <div className="header-actions">
        <span className="environment-label"><i className="dot" /> FORMAL PROJECT</span>
        <details className="account-menu">
          <summary className="account"><span className="avatar">{initials}</span><span>{displayName}<small>{ROLE_LABELS[role]} ▾</small></span></summary>
          <div className="account-popover"><p><strong>{displayName}</strong><br /><span>{ROLE_LABELS[role]}</span></p><form action={signOut}><button className="btn small" type="submit">Sign out</button></form></div>
        </details>
      </div>
    </header>
  );
}

export { ROLE_LABELS };
