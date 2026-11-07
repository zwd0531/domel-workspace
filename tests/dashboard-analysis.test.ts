import { describe, expect, it } from "vitest";
import { salesValue, salesTotalsByCurrency, rate, outstanding, notPassed } from "@/domain/dashboard/analysis";
import { summarizeDashboard } from "@/domain/dashboard/summary";
import { dashboardUrl } from "@/domain/dashboard/navigation";
import type { DashboardRow } from "@/domain/dashboard/types";

const base: DashboardRow = { id: "a", code: "A", name: "A", family: "Motors", application: "HVAC", ownerLabel: null, month: "2026-10", currency: "EUR" };

describe("product analysis arithmetic", () => {
  it("distinguishes missing records, recorded zeros and undefined rates", () => {
    for (const role of ["sales", "production_planner", "quality_engineer"] as const) expect(summarizeDashboard(role, []).every(metric => metric.value === null)).toBe(true);
    expect(salesValue({ ...base, shippedUnits: 0, unitPrice: 12 })).toBe(0);
    expect(salesValue({ ...base, shippedUnits: 5 })).toBeNull();
    expect(rate(0, 10)).toBe(0);
    expect(rate(0, 0)).toBeNull();
    expect(rate(undefined, 10)).toBeNull();
  });
  it("computes revenue from units, not order count, and preserves currency totals", () => {
    const rows = [{ ...base, orderCount: 2, shippedUnits: 100, unitPrice: 10 }, { ...base, id: "b", shippedUnits: 50, unitPrice: 20 }, { ...base, id: "c", currency: "USD", shippedUnits: 7, unitPrice: 10 }];
    const totals = salesTotalsByCurrency(rows);
    expect(totals).toEqual({ EUR: 2000, USD: 70 });
    expect(rate(salesValue(rows[0]), totals.EUR)).toBe(50);
    expect(summarizeDashboard("sales", rows).find(metric => metric.label === "Sales value")?.value).toBeNull();
  });
  it("supports overproduction without inventing a negative backlog", () => {
    expect(rate(5500, 5000)).toBeCloseTo(110);
    expect(outstanding({ ...base, plannedUnits: 5000, producedUnits: 5500 })).toBe(0);
    expect(outstanding(base)).toBeNull();
  });
  it("keeps recorded defect rate separate from the test pass complement", () => {
    const row = { ...base, testedUnits: 100, passedUnits: 95, defectRate: 2, fieldReturns: 0, risk: "Low" as const };
    expect(notPassed(row)).toBe(5);
    expect(summarizeDashboard("quality_engineer", [row]).find(metric => metric.label === "Defect rate")?.value).toBe(2);
    expect(summarizeDashboard("quality_engineer", [{ ...row, defectRate: null }]).find(metric => metric.label === "Defect rate")?.value).toBeNull();
  });
  it("keeps open analysis state only for a specific product", () => {
    expect(dashboardUrl({ role: "sales", month: "2026-10", analysis: true })).not.toContain("analysis");
    expect(dashboardUrl({ role: "sales", month: "2026-10", product: "a", analysis: true }, true)).toBe("/dashboard?role=sales&month=2026-10&product=a&analysis=1#product-analysis");
  });
});
