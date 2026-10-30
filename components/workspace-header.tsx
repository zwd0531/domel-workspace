import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import { canAny, type AppRole } from "@/domain/permissions/policy";

const ROLE_LABELS: Record<AppRole, string> = {
  sales: "Sales Coordinator",
  production_planner: "Production Planner",
  quality_engineer: "Quality Engineer",
  decision_owner: "Decision Owner",
  admin: "Administrator",
};

function displayRole(roles: AppRole[]) {
  return roles.includes("admin") ? "admin" : roles.includes("decision_owner") ? "decision_owner" : roles[0] ?? "sales";
}

export function WorkspaceHeader({
  displayName,
  roles,
  active = "dashboard",
}: {
  displayName: string;
  roles: AppRole[];
  active?: "dashboard" | "scenarios" | "intelligence" | "admin";
}) {
  const role = displayRole(roles);
  const initials = role === "sales" ? "SC" : role === "production_planner" ? "PP" : role === "quality_engineer" ? "QE" : role === "decision_owner" ? "DO" : "AD";
  const scenarioAccess = canAny(roles, "scenario:save");
  const intelligenceAccess = canAny(roles, "evidence:read");
  const adminAccess = canAny(roles, "users:manage");
  return (
    <header className="site-header">
      <Link className="brand" href="/dashboard"><span className="brand-mark">✦</span><span>domel<small>DECISION WORKSPACE</small></span></Link>
      <nav aria-label="Main navigation">
        <Link aria-current={active === "dashboard" ? "page" : undefined} href="/dashboard">▦ Business Dashboard</Link>
        {scenarioAccess ? <Link aria-current={active === "scenarios" ? "page" : undefined} href="/scenarios">▥ Scenario Planning</Link> : <span aria-disabled="true">▥ Scenario Planning</span>}
        {intelligenceAccess ? <Link aria-current={active === "intelligence" ? "page" : undefined} href="/intelligence">◎ Industry Intelligence</Link> : <span aria-disabled="true">◎ Industry Intelligence</span>}
        {adminAccess ? <Link aria-current={active === "admin" ? "page" : undefined} href="/admin">⚙ Administration</Link> : null}
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
