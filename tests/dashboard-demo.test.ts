import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
import { loadDemoDashboardData } from "@/server/demo/database";

describe("demo dashboard month and product isolation", () => {
  it("queries the stored month without relabeling October data as September", () => {
    const cwd = vi.spyOn(process, "cwd").mockReturnValue(mkdtempSync(join(tmpdir(), "domel-dashboard-test-")));
    try {
      const all = loadDemoDashboardData("sales", { month: "2026-10" });
      expect(all.rows).toHaveLength(3);
      const id = all.rows[0].id;
      const selected = loadDemoDashboardData("sales", { month: "2026-10", productId: id });
      expect(selected.rows).toHaveLength(1);
      expect(selected.salesTotals).toEqual(all.salesTotals);
      const empty = loadDemoDashboardData("sales", { month: "2026-09", productId: id });
      expect(empty.rows).toEqual([]);
      expect(empty.selectedProduct?.id).toBe(id);
      expect(empty.productSelectionInvalid).toBe(false);
      const invalid = loadDemoDashboardData("sales", { productId: "missing" });
      expect(invalid.productSelectionInvalid).toBe(true);
      expect(invalid.rows).toEqual([]);
    } finally { cwd.mockRestore(); }
  });
});
