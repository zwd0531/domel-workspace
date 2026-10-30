export const APP_ROLES = [
  "sales",
  "production_planner",
  "quality_engineer",
  "decision_owner",
  "admin",
] as const;

export type AppRole = (typeof APP_ROLES)[number];

export type Permission =
  | "dashboard:sales:read"
  | "dashboard:production:read"
  | "dashboard:quality:read"
  | "finance:read"
  | "scenario:calculate"
  | "scenario:save"
  | "evidence:read"
  | "evidence:write"
  | "decision:approve"
  | "users:manage";

const ROLE_PERMISSIONS: Record<AppRole, ReadonlySet<Permission>> = {
  sales: new Set(["dashboard:sales:read", "evidence:read"]),
  production_planner: new Set([
    "dashboard:production:read",
    "dashboard:quality:read",
    "evidence:read",
  ]),
  quality_engineer: new Set(["dashboard:quality:read", "evidence:read"]),
  decision_owner: new Set([
    "dashboard:sales:read",
    "dashboard:production:read",
    "dashboard:quality:read",
    "finance:read",
    "scenario:calculate",
    "scenario:save",
    "evidence:read",
    "evidence:write",
    "decision:approve",
  ]),
  admin: new Set([
    "dashboard:sales:read",
    "dashboard:production:read",
    "dashboard:quality:read",
    "finance:read",
    "scenario:calculate",
    "scenario:save",
    "evidence:read",
    "evidence:write",
    "decision:approve",
    "users:manage",
  ]),
};

export function isAppRole(value: string): value is AppRole {
  return (APP_ROLES as readonly string[]).includes(value);
}

export function can(role: AppRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].has(permission);
}

export function canAny(roles: AppRole[], permission: Permission): boolean {
  return roles.some((role) => can(role, permission));
}
