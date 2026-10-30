import { canAny, type AppRole } from "@/domain/permissions/policy";

export function canSubmitDecision(
  actor: { userId: string; roles: AppRole[] },
  scenarioOwnerId: string,
) {
  return canAny(actor.roles, "decision:submit") &&
    (actor.userId === scenarioOwnerId || actor.roles.includes("admin"));
}

export function canReviewDecision(
  actor: { userId: string; roles: AppRole[] },
  decision: { submittedBy: string; status: string },
) {
  return decision.status === "submitted" &&
    decision.submittedBy !== actor.userId &&
    canAny(actor.roles, "decision:approve");
}
