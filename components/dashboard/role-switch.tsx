import Link from "next/link";
import type { DashboardRole } from "@/domain/dashboard/types";

const LABELS: Record<DashboardRole, string> = {
  sales: "Sales Coordinator",
  production_planner: "Production Planner",
  quality_engineer: "Quality Engineer",
};

export function DashboardRoleSwitch({ availableRoles, role, month, productId }: {
  availableRoles: DashboardRole[];
  role: DashboardRole;
  month: string;
  productId: string | null;
}) {
  if (availableRoles.length < 2) return null;

  return <nav className="dashboard-role-switch" aria-label="Dashboard role view">
    <span className="small muted">View as</span>
    {availableRoles.map((availableRole) => {
      const query = new URLSearchParams({ role: availableRole, month });
      if (productId) query.set("product", productId);
      return <Link key={availableRole} href={`/dashboard?${query.toString()}`} className={`btn small ${role === availableRole ? "primary" : ""}`} aria-current={role === availableRole ? "page" : undefined}>{LABELS[availableRole]}</Link>;
    })}
  </nav>;
}
