import Link from "next/link";
import Image from "next/image";
import { signOut } from "@/app/actions/auth";
import { canAny, type AppRole } from "@/domain/permissions/policy";
import { isDemoMode } from "@/server/demo/config";
import { LanguageToggle } from "@/components/i18n/language-toggle";
import type { DashboardRole } from "@/domain/dashboard/types";

const ROLE_LABELS: Record<AppRole, string> = {
  sales: "Sales Coordinator",
  production_planner: "Production Planner",
  quality_engineer: "Quality Engineer",
  decision_owner: "Decision Owner",
  admin: "Administrator",
};

function displayRole(roles: AppRole[], dashboardRole?: DashboardRole) {
  return roles.includes("admin") ? "admin" : roles.includes("decision_owner") ? "decision_owner" : dashboardRole && roles.includes(dashboardRole) ? dashboardRole : roles[0] ?? "sales";
}

export function WorkspaceHeader({
  displayName,
  roles,
  active = "dashboard",
  dashboardRole,
}: {
  displayName: string;
  roles: AppRole[];
  active?: "dashboard" | "scenarios" | "intelligence" | "admin";
  dashboardRole?: DashboardRole;
}) {
  const demoMode = isDemoMode();
  const role = displayRole(roles, dashboardRole);
  const initials = role === "sales" ? "SC" : role === "production_planner" ? "PP" : role === "quality_engineer" ? "QE" : role === "decision_owner" ? "DO" : "AD";
  const scenarioAccess = canAny(roles, "scenario:save");
  const intelligenceAccess = canAny(roles, "evidence:read");
  const adminAccess = canAny(roles, "users:manage");
  return (
    <header className="site-header">
      <Link className="brand" href="/dashboard" aria-label="Domel Decision Workspace">
        <Image className="brand-logo" src="/domel-logo.png" alt="Domel" width={1800} height={578} priority />
      </Link>
      <nav aria-label="Main navigation">
        <Link aria-current={active === "dashboard" ? "page" : undefined} href="/dashboard">▦ Business Dashboard</Link>
        {scenarioAccess ? <Link aria-current={active === "scenarios" ? "page" : undefined} href="/scenarios">▥ Scenario Planning</Link> : <span aria-disabled="true">▥ Scenario Planning</span>}
        {intelligenceAccess ? <Link aria-current={active === "intelligence" ? "page" : undefined} href="/intelligence">◎ Industry Intelligence</Link> : <span aria-disabled="true">◎ Industry Intelligence</span>}
        {adminAccess ? <Link aria-current={active === "admin" ? "page" : undefined} href="/admin">⚙ Administration</Link> : null}
      </nav>
      <div className="header-actions">
        <LanguageToggle />
        <span className="environment-label"><i className="dot" /> {demoMode ? "LOCAL SQLITE DEMO" : "FORMAL PROJECT"}</span>
        <details className="account-menu">
          <summary className="account"><span className="avatar">{initials}</span><span>{displayName}<small>{ROLE_LABELS[role]} ▾</small></span></summary>
          <div className="account-popover"><p><strong>{displayName}</strong><br /><span>{ROLE_LABELS[role]}</span></p><form action={signOut}><button className="btn small" type="submit">Sign out</button></form></div>
        </details>
      </div>
    </header>
  );
}

export { ROLE_LABELS };
