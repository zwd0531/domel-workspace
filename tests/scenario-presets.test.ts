import { describe, expect, it } from "vitest";
import {
  applyEnvironmentPreset,
  applyStrategyPreset,
  buildDemandSensitivity,
  buildStrategyComparisons,
} from "@/domain/scenario/presets";
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

describe("restored scenario presets", () => {
  it("applies environment presets without overwriting strategy fields", () => {
    const current = { ...baseline, price: 175, capacity: 1_040 };
    const pessimistic = applyEnvironmentPreset(baseline, current, "pessimistic");
    expect(pessimistic.demand).toBe(-10);
    expect(pessimistic.cost).toBe(124.2);
    expect(pessimistic.price).toBe(175);
    expect(pessimistic.capacity).toBe(1_040);
  });

  it("recreates the original hold, price and expansion strategies", () => {
    expect(applyStrategyPreset(baseline, baseline, "price").price).toBe(176.7);
    const expansion = applyStrategyPreset(baseline, baseline, "expand");
    expect(expansion.capacity).toBe(1_040);
    expect(expansion.fixed).toBe(11_200);
    expect(expansion.capex).toBe(45_000);
  });

  it("produces comparable strategy results and includes the active demand in sensitivity", () => {
    const current = { ...baseline, demand: 15, cost: 111.55 };
    const comparisons = buildStrategyComparisons(baseline, current);
    expect(comparisons.map((item) => item.id)).toEqual(["hold", "price", "expand"]);
    expect(comparisons.every((item) => item.inputs.demand === 15)).toBe(true);
    expect(buildDemandSensitivity({ ...baseline, demand: 7 }).map((item) => item.demand)).toContain(7);
  });
});
