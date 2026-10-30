import "server-only";

export function isDemoMode() {
  return process.env.DOMEL_DEMO_MODE === "true";
}

export const DEMO_USER_ID = "10000000-0000-0000-0000-000000000001";

export const DEMO_AUTH_CONTEXT = {
  userId: DEMO_USER_ID,
  email: "demo@domel.local",
  roles: ["production_planner", "quality_engineer", "decision_owner", "admin"],
} as const;
