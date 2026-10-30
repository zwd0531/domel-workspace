import { describe, expect, it } from "vitest";
import { can, canAny } from "@/domain/permissions/policy";

describe("role permissions", () => {
  it("does not expose finance or scenario editing to Sales", () => {
    expect(can("sales", "dashboard:sales:read")).toBe(true);
    expect(can("sales", "evidence:read")).toBe(true);
    expect(can("sales", "evidence:write")).toBe(false);
    expect(can("sales", "finance:read")).toBe(false);
    expect(can("sales", "scenario:calculate")).toBe(false);
  });

  it("keeps financial scenario calculation out of the production role by default", () => {
    expect(can("production_planner", "dashboard:production:read")).toBe(true);
    expect(can("production_planner", "scenario:calculate")).toBe(false);
  });

  it("lets a decision owner calculate, save and approve a decision", () => {
    expect(can("decision_owner", "scenario:calculate")).toBe(true);
    expect(can("decision_owner", "scenario:save")).toBe(true);
    expect(can("decision_owner", "decision:approve")).toBe(true);
  });

  it("supports users with more than one assigned role", () => {
    expect(canAny(["quality_engineer", "decision_owner"], "finance:read")).toBe(true);
  });
});
