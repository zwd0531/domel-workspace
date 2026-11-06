import { describe, expect, it } from "vitest";
import { availableDashboardRoles, resolveDashboardRole } from "@/domain/dashboard/role";
import { summarizeDashboard } from "@/domain/dashboard/summary";
import type { DashboardRow } from "@/domain/dashboard/types";

const products: DashboardRow[] = [
  { id: "a", code: "A", name: "A", family: "Dry", application: "Vacuum", ownerLabel: "Line 1", month: "2026-10", testedUnits: 100, passedUnits: 90, fieldReturns: 2, defectRate: 10, risk: "High" },
  { id: "b", code: "B", name: "B", family: "Wet", application: "Vacuum", ownerLabel: "Line 2", month: "2026-10", testedUnits: 300, passedUnits: 285, fieldReturns: 3, defectRate: 5, risk: "Low" },
];

describe("dashboard authorization and summaries", () => {
  it("derives the employee dashboard from server-authorized roles", () => {
    expect(resolveDashboardRole(["sales"])).toBe("sales");
    expect(resolveDashboardRole(["quality_engineer"])).toBe("quality_engineer");
    expect(resolveDashboardRole([])).toBeNull();
    expect(availableDashboardRoles(["sales", "production_planner", "quality_engineer"])).toEqual(["sales", "production_planner", "quality_engineer"]);
    expect(resolveDashboardRole(["sales", "production_planner", "quality_engineer"], "quality_engineer")).toBe("quality_engineer");
    expect(resolveDashboardRole(["sales"], "quality_engineer")).toBe("sales");
  });

  it("uses weighted quality rates instead of averaging product percentages", () => {
    const metrics = summarizeDashboard("quality_engineer", products);
    expect(metrics.find((metric) => metric.label === "Test pass rate")?.value).toBe(93.75);
    expect(metrics.find((metric) => metric.label === "Defect rate")?.value).toBe(6.25);
  });
});
