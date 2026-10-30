import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { canReviewDecision, canSubmitDecision } from "@/domain/decisions/policy";
import { decisionReviewSchema } from "@/domain/scenario/schema";

const owner = { userId: "owner", roles: ["decision_owner"] as const };
const secondOwner = { userId: "reviewer", roles: ["decision_owner"] as const };
const admin = { userId: "admin", roles: ["admin"] as const };
const sales = { userId: "sales", roles: ["sales"] as const };

describe("conditional decision workflow", () => {
  it("allows only the scenario owner or an administrator to submit", () => {
    expect(canSubmitDecision({ ...owner, roles: [...owner.roles] }, "owner")).toBe(true);
    expect(canSubmitDecision({ ...secondOwner, roles: [...secondOwner.roles] }, "owner")).toBe(false);
    expect(canSubmitDecision({ ...admin, roles: [...admin.roles] }, "owner")).toBe(true);
    expect(canSubmitDecision({ ...sales, roles: [...sales.roles] }, "sales")).toBe(false);
  });

  it("enforces four-eyes review in the shared policy", () => {
    const submitted = { submittedBy: "owner", status: "submitted" };
    expect(canReviewDecision({ ...owner, roles: [...owner.roles] }, submitted)).toBe(false);
    expect(canReviewDecision({ ...secondOwner, roles: [...secondOwner.roles] }, submitted)).toBe(true);
    expect(canReviewDecision({ ...admin, roles: [...admin.roles] }, submitted)).toBe(true);
    expect(canReviewDecision({ ...sales, roles: [...sales.roles] }, submitted)).toBe(false);
    expect(canReviewDecision({ ...secondOwner, roles: [...secondOwner.roles] }, { ...submitted, status: "approved" })).toBe(false);
  });

  it("requires a reason when rejecting", () => {
    const payload = { decisionId: "10000000-0000-0000-0000-000000000001", action: "rejected", reviewNote: "" };
    expect(decisionReviewSchema.safeParse(payload).success).toBe(false);
    expect(decisionReviewSchema.safeParse({ ...payload, reviewNote: "Demand evidence is too old." }).success).toBe(true);
  });

  it("keeps submission, review, audit and notifications behind database functions", () => {
    const migration = readFileSync(new URL("../db/migrations/0006_conditional_decision_workflow.sql", import.meta.url), "utf8");
    expect(migration).toContain("revoke insert, update, delete on public.decisions from authenticated");
    expect(migration).toContain("function public.submit_scenario_decision");
    expect(migration).toContain("function public.review_scenario_decision");
    expect(migration).toContain("v_decision.submitted_by = v_actor");
    expect(migration).toContain("'decision.submitted'");
    expect(migration).toContain("'decision.' || p_action");
    expect(migration).toContain("insert into public.workflow_notifications");
  });

  it("locks snapshots while a decision is submitted or final", () => {
    const migration = readFileSync(new URL("../db/migrations/0006_conditional_decision_workflow.sql", import.meta.url), "utf8");
    expect(migration).toContain("scenario_snapshots_guard_locked_status");
    expect(migration).toContain("v_status in ('submitted', 'approved', 'archived')");
  });
});
