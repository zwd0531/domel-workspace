import type { DashboardRow } from "./types";

export function known(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function salesValue(row: DashboardRow): number | null {
  return known(row.shippedUnits) && known(row.unitPrice) ? row.shippedUnits * row.unitPrice : null;
}

export function rate(numerator: unknown, denominator: unknown): number | null {
  return known(numerator) && known(denominator) && denominator > 0 ? numerator / denominator * 100 : null;
}

export function outstanding(row: DashboardRow): number | null {
  return known(row.plannedUnits) && known(row.producedUnits) ? Math.max(0, row.plannedUnits - row.producedUnits) : null;
}

export function notPassed(row: DashboardRow): number | null {
  return known(row.testedUnits) && known(row.passedUnits) && row.testedUnits >= row.passedUnits ? row.testedUnits - row.passedUnits : null;
}

export function salesTotalsByCurrency(rows: DashboardRow[]): Record<string, number | null> {
  const totals: Record<string, number | null> = {};
  for (const row of rows) {
    if (!row.currency) continue;
    const value = salesValue(row);
    const previous = totals[row.currency];
    totals[row.currency] = value === null || previous === null ? null : (previous ?? 0) + value;
  }
  return totals;
}
