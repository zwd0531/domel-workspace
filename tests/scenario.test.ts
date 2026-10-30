import { describe, expect, it } from "vitest";
import { calculateScenario, FORMULA_VERSION, validateScenarioInputs } from "@/domain/scenario/calculate";
import { interpretScenario } from "@/domain/scenario/interpret";
import { evidenceCreateSchema, scenarioSaveSchema } from "@/domain/scenario/schema";
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

  it("flags unsupported demand growth until relevant evidence is linked", () => {
    const inputs = { ...baseline, demand: 20 };
    const result = calculateScenario(inputs);
    expect(interpretScenario(inputs, result, []).evidenceGaps).toContain(
      "Demand growth above 10 percent needs demand or competition evidence.",
    );
    expect(interpretScenario(inputs, result, ["Demand"]).evidenceGaps).not.toContain(
      "Demand growth above 10 percent needs demand or competition evidence.",
    );
  });

  it("validates a complete save request without accepting calculated results", () => {
    const parsed = scenarioSaveSchema.parse({
      scenarioId: null,
      productId: "20000000-0000-0000-0000-000000000002",
      businessMonth: "2026-10-01",
      name: "Demand review",
      inputs: baseline,
      rationale: "Controlled UAT assumption.",
      evidenceIds: [],
      calculatedResult: { operatingProfit: 999_999_999 },
    });
    expect(parsed).not.toHaveProperty("calculatedResult");
  });

  it("requires evidence provenance and limitations", () => {
    expect(evidenceCreateSchema.safeParse({
      title: "Source",
      publisher: "Publisher",
      sourceUrl: "not-a-url",
      topic: "Demand",
      fact: "Fact",
      interpretation: "Interpretation",
      limitations: "",
    }).success).toBe(false);
  });
});
