import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { IMPORT_DEFINITIONS, validateImportCsv } from "@/domain/admin/imports";
import { IMPORT_DATASETS } from "@/domain/admin/types";

describe("administrator operational imports", () => {
  it("validates every shipped CSV template", () => {
    for (const dataset of IMPORT_DATASETS) {
      const path = `../public${IMPORT_DEFINITIONS[dataset].template}`;
      const csv = readFileSync(new URL(path, import.meta.url), "utf8");
      const validation = validateImportCsv(dataset, csv);
      expect(validation.errors, dataset).toEqual([]);
      expect(validation.rows, dataset).toHaveLength(1);
    }
  });

  it("parses quoted commas without shifting cells", () => {
    const csv = [
      "plant_code,product_code,month,tested_units,passed_units,field_returns,defect_rate,risk,quality_note",
      'SZ,SZ-DRY,2026-11-01,10,9,0,10,Medium,"Seal check, second sample"',
    ].join("\n");
    const validation = validateImportCsv("quality", csv);
    expect(validation.errors).toEqual([]);
    expect(validation.rows[0].quality_note).toBe("Seal check, second sample");
  });

  it("rejects duplicates and invalid ranges before a database call", () => {
    const csv = [
      "plant_code,product_code,month,order_count,shipped_units,unit_price,currency",
      "SZ,SZ-DRY,2026-11-01,2,10,40,EUR",
      "SZ,SZ-DRY,2026-11-01,3,-1,40,EUR",
    ].join("\n");
    const validation = validateImportCsv("sales", csv);
    expect(validation.errors.join(" ")).toContain(">=0");

    const duplicate = csv.replace("3,-1", "3,12");
    expect(validateImportCsv("sales", duplicate).errors.join(" ")).toContain("duplicate plant, product and month");
  });

  it("requires the exact controlled header contract", () => {
    const csv = "product_code,month,order_count\nSZ-DRY,2026-11-01,1";
    const validation = validateImportCsv("sales", csv);
    expect(validation.errors.join(" ")).toContain("Missing columns");
  });

  it("keeps facts, import runs and roles behind audited database functions", () => {
    const migration = readFileSync(new URL("../db/migrations/0007_admin_import_console.sql", import.meta.url), "utf8");
    expect(migration).toContain("revoke insert, update, delete on public.monthly_sales from authenticated");
    expect(migration).toContain("revoke insert, update, delete on public.user_roles from authenticated");
    expect(migration).toContain("function public.import_operational_dataset");
    expect(migration).toContain("'import.completed'");
    expect(migration).toContain("'import.failed'");
    expect(migration).toContain("function public.set_user_roles");
    expect(migration).toContain("The final active administrator role cannot be removed.");
    expect(migration).toContain("pg_advisory_xact_lock");
    expect(migration).toContain("'user.roles_updated'");
  });
});
