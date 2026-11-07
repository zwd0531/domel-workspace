import Link from "next/link";
import type { DashboardRole } from "@/domain/dashboard/types";
import { dashboardUrl } from "@/domain/dashboard/navigation";

const LABELS: Record<DashboardRole, string> = {
  sales: "Sales Coordinator",
  production_planner: "Production Planner",
  quality_engineer: "Quality Engineer",
};

export function DashboardRoleSwitch({ availableRoles, role, month, productId, analysisOpen }: {
  availableRoles: DashboardRole[];
  role: DashboardRole;
  month: string;
  productId: string | null;
  analysisOpen: boolean;
}) {
  if (availableRoles.length < 2) return null;

  return <nav className="dashboard-role-switch" aria-label="Dashboard role view">
    <span className="small muted">View as</span>
    {availableRoles.map((availableRole) => {
      return <Link key={availableRole} scroll={false} href={dashboardUrl({ role: availableRole, month, product: productId, analysis: analysisOpen })} className={`btn small ${role === availableRole ? "primary" : ""}`} aria-current={role === availableRole ? "page" : undefined}>{LABELS[availableRole]}</Link>;
    })}
  </nav>;
}
