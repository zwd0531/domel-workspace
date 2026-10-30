import type { AppRole } from "@/domain/permissions/policy";
import type { DashboardRole } from "./types";

export function resolveDashboardRole(roles: AppRole[]): DashboardRole | null {
  if (roles.includes("sales")) return "sales";
  if (roles.includes("production_planner")) return "production_planner";
  if (roles.includes("quality_engineer")) return "quality_engineer";
  if (roles.includes("decision_owner") || roles.includes("admin")) return "production_planner";
  return null;
}
