import type { AppRole } from "@/domain/permissions/policy";
import type { DashboardRole } from "./types";

export const DASHBOARD_ROLES: DashboardRole[] = ["sales", "production_planner", "quality_engineer"];

export function availableDashboardRoles(roles: AppRole[]): DashboardRole[] {
  if (roles.includes("decision_owner") || roles.includes("admin")) return [...DASHBOARD_ROLES];
  return DASHBOARD_ROLES.filter((role) => roles.includes(role));
}

export function resolveDashboardRole(roles: AppRole[], requestedRole?: string | null): DashboardRole | null {
  const available = availableDashboardRoles(roles);
  if (requestedRole && available.some((role) => role === requestedRole)) return requestedRole as DashboardRole;
  if (roles.includes("sales")) return "sales";
  if (roles.includes("production_planner")) return "production_planner";
  if (roles.includes("quality_engineer")) return "quality_engineer";
  if (roles.includes("decision_owner") || roles.includes("admin")) return "production_planner";
  return null;
}
