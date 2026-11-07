import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ tables: {} as Record<string, Record<string, unknown>[]> }));
vi.mock("@/server/demo/config", () => ({ isDemoMode: () => false }));
vi.mock("@/server/demo/database", () => ({ loadDemoDashboardData: vi.fn() }));
vi.mock("@/server/supabase/server", () => ({ createSupabaseServerClient: async () => ({ from(table: string) {
  const filters: [string, unknown][] = [];
  const query = {
    select() { return query; },
    eq(key: string, value: unknown) { filters.push([key, value]); return query; },
    order() { return query; },
    single: async () => ({ data: { display_name: "Tester" }, error: null }),
    then(resolve: (value: unknown) => void) { return Promise.resolve({ data: (state.tables[table] ?? []).filter(row => filters.every(([key, value]) => row[key] === value)), error: null }).then(resolve); },
  };
  return query;
} }) }));

import { loadDashboardData } from "@/server/dashboard/data";
const auth = { userId: "user", email: null, roles: ["sales"] as ("sales")[] };

describe("connected dashboard sales scope", () => {
  beforeEach(() => {
    state.tables = {
      products: ["a", "b"].map(id => ({ id, code: id, name: id, family: "Motors", application: "HVAC", owner_label: null, active: true })),
      monthly_sales: ["a", "b"].map(product_id => ({ product_id, month: "2026-10-01", order_count: 2, shipped_units: 100, unit_price: 10, currency: "EUR" })),
      work_items: [],
    };
  });
  it("filters the product after computing the same-month total", async () => {
    const selected = await loadDashboardData(auth, { productId: "a", month: "2026-10" });
    expect(selected.rows).toHaveLength(1);
    expect(selected.salesTotals.EUR).toBe(2000);
    expect(selected.selectedProduct?.id).toBe("a");
  });
  it("preserves product identity for an empty month and never falls back on an invalid selection", async () => {
    const empty = await loadDashboardData(auth, { productId: "a", month: "2026-09" });
    expect(empty.rows).toEqual([]);
    expect(empty.selectedProduct?.id).toBe("a");
    const invalid = await loadDashboardData(auth, { productId: "unknown" });
    expect(invalid.productSelectionInvalid).toBe(true);
    expect(invalid.rows).toEqual([]);
  });
});
