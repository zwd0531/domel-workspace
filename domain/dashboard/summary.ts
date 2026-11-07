import type { DashboardRole, DashboardRow } from "./types";
import { known, rate, salesValue } from "./analysis";

export type DashboardMetric = { label: string; value: number | null; kind: "number" | "money" | "percent" };

export function summarizeDashboard(role: DashboardRole, rows: DashboardRow[]): DashboardMetric[] {
  if (role === "sales") {
    const values = rows.map(salesValue);
    const currencies = new Set(rows.map(row => row.currency));
    return [
      { label: "Orders", value: sum(rows, "orderCount"), kind: "number" },
      { label: "Units shipped", value: sum(rows, "shippedUnits"), kind: "number" },
      {
        label: "Sales value",
        value: values.length && values.every(known) && currencies.size === 1 ? values.reduce((total, value) => total + value, 0) : null,
        kind: "money",
      },
      { label: "Products in scope", value: rows.length || null, kind: "number" },
    ];
  }

  if (role === "production_planner") {
    const planned = sum(rows, "plannedUnits");
    const produced = sum(rows, "producedUnits");
    const weightedOnTime = weightedRate(rows, "onTimeRate", "producedUnits");
    return [
      { label: "Planned units", value: planned, kind: "number" },
      { label: "Produced units", value: produced, kind: "number" },
      { label: "On-time rate", value: weightedOnTime, kind: "percent" },
      { label: "Open backlog", value: planned !== null && produced !== null ? Math.max(0, planned - produced) : null, kind: "number" },
    ];
  }

  const tested = sum(rows, "testedUnits");
  const passed = sum(rows, "passedUnits");
  return [
    { label: "Test pass rate", value: rate(passed, tested), kind: "percent" },
    { label: "Defect rate", value: weightedRate(rows, "defectRate", "testedUnits"), kind: "percent" },
    { label: "Field returns", value: sum(rows, "fieldReturns"), kind: "number" },
    { label: "High-risk products", value: rows.length ? rows.filter((row) => row.risk === "High").length : null, kind: "number" },
  ];
}

function sum(rows: DashboardRow[], key: keyof DashboardRow): number | null {
  const values = rows.map(row => row[key]);
  return values.length && values.every(known) ? values.reduce((total, value) => total + value, 0) : null;
}

function weightedRate(rows: DashboardRow[], rateKey: keyof DashboardRow, weightKey: keyof DashboardRow): number | null {
  if (!rows.length || rows.some(row => !known(row[rateKey]) || !known(row[weightKey]))) return null;
  const weight = sum(rows, weightKey);
  if (weight === null || weight <= 0) return null;
  return rows.reduce(
    (total, row) => total + Number(row[rateKey]) * Number(row[weightKey]),
    0,
  ) / weight;
}
