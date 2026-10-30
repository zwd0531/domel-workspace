import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL("../db/migrations/0004_secure_scenario_workspace.sql", import.meta.url),
  "utf8",
);

describe("secure scenario persistence migration", () => {
  it("stores formula results inside the database function", () => {
    expect(migration).toContain("v_operating_profit := v_gross_profit - v_fixed");
    expect(migration).toContain("'formulaVersion', '2.0.0'");
    expect(migration).toContain("security definer");
  });

  it("blocks direct writes that could bypass recalculation or audit", () => {
    expect(migration).toContain("revoke insert on public.scenario_snapshots from authenticated");
    expect(migration).toContain("revoke insert, update on public.scenarios from authenticated");
    expect(migration).toContain("revoke insert, update, delete on public.scenario_evidence from authenticated");
    expect(migration).toContain("revoke insert on public.audit_events from authenticated");
  });

  it("writes snapshots, evidence links and audit events in one function", () => {
    expect(migration).toContain("insert into public.scenario_snapshots");
    expect(migration).toContain("insert into public.scenario_evidence");
    expect(migration).toContain("insert into public.audit_events");
  });
});
