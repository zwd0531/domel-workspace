import { describe, expect, it } from "vitest";
import { calculateScenario, FORMULA_VERSION, validateScenarioInputs } from "@/domain/scenario/calculate";
import type { ScenarioInputs } from "@/domain/scenario/types";

const baseline: ScenarioInputs = {
  quantity: 735,
  price: 186,
  cost: 115,
  fixed: 10_000,
  capacity: 800,
  capex: 0,
  demand: 0,
};

describe("calculateScenario", () => {
  it("preserves the transparent demo formula and records its version", () => {
    const result = calculateScenario(baseline);
    expect(result.formulaVersion).toBe(FORMULA_VERSION);
    expect(result.units).toBe(735);
    expect(result.revenue).toBe(136_710);
    expect(result.variableCost).toBe(84_525);
    expect(result.operatingProfit).toBe(42_185);
  });

  it("caps sales at capacity and reports unserved demand", () => {
    const result = calculateScenario({ ...baseline, demand: 20 });
    expect(result.demandUnits).toBe(882);
    expect(result.units).toBe(800);
    expect(result.unservedDemand).toBe(82);
    expect(result.capacityUtilization).toBe(1);
  });

  it("returns null ratios when their denominator is zero", () => {
    const result = calculateScenario({ ...baseline, quantity: 0, capacity: 0 });
    expect(result.grossMargin).toBeNull();
    expect(result.capacityUtilization).toBeNull();
  });

  it("rejects invalid ranges before calculation", () => {
    expect(validateScenarioInputs({ ...baseline, demand: 201 })).toContain(
      "demand must be between -100 and 200 percent.",
    );
    expect(() => calculateScenario({ ...baseline, cost: -1 })).toThrow();
  });
});
