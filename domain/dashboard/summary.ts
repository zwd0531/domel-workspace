import type { DashboardRole, DashboardRow } from "./types";

export type DashboardMetric = { label: string; value: number; kind: "number" | "money" | "percent" };

export function summarizeDashboard(role: DashboardRole, rows: DashboardRow[]): DashboardMetric[] {
  if (role === "sales") {
    return [
      { label: "Orders", value: sum(rows, "orderCount"), kind: "number" },
      { label: "Units shipped", value: sum(rows, "shippedUnits"), kind: "number" },
      {
        label: "Sales value",
        value: rows.reduce((total, row) => total + (row.shippedUnits ?? 0) * (row.unitPrice ?? 0), 0),
        kind: "money",
      },
      { label: "Products in scope", value: rows.length, kind: "number" },
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
      { label: "Open backlog", value: Math.max(0, planned - produced), kind: "number" },
    ];
  }

  const tested = sum(rows, "testedUnits");
  const passed = sum(rows, "passedUnits");
  return [
    { label: "Test pass rate", value: tested ? (passed / tested) * 100 : 0, kind: "percent" },
    { label: "Defect rate", value: weightedRate(rows, "defectRate", "testedUnits"), kind: "percent" },
    { label: "Field returns", value: sum(rows, "fieldReturns"), kind: "number" },
    { label: "High-risk products", value: rows.filter((row) => row.risk === "High").length, kind: "number" },
  ];
}

function sum(rows: DashboardRow[], key: keyof DashboardRow) {
  return rows.reduce((total, row) => total + Number(row[key] ?? 0), 0);
}

function weightedRate(rows: DashboardRow[], rateKey: keyof DashboardRow, weightKey: keyof DashboardRow) {
  const weight = sum(rows, weightKey);
  if (!weight) return 0;
  return rows.reduce(
    (total, row) => total + Number(row[rateKey] ?? 0) * Number(row[weightKey] ?? 0),
    0,
  ) / weight;
}
