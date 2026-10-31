import { calculateScenario } from "./calculate";
import type { ScenarioInputs, ScenarioResult } from "./types";

export type EnvironmentPreset = "pessimistic" | "base" | "optimistic";
export type StrategyPreset = "hold" | "price" | "expand";

export type StrategyComparison = {
  id: StrategyPreset;
  label: string;
  inputs: ScenarioInputs;
  result: ScenarioResult;
};

export type SensitivityPoint = {
  demand: number;
  operatingProfit: number;
};

function moneyValue(value: number) {
  return Math.round(value * 100) / 100;
}

export function applyEnvironmentPreset(
  baseline: ScenarioInputs,
  current: ScenarioInputs,
  preset: EnvironmentPreset,
): ScenarioInputs {
  const definition = {
    pessimistic: { demand: -10, costMultiplier: 1.08 },
    base: { demand: 0, costMultiplier: 1 },
    optimistic: { demand: 15, costMultiplier: 0.97 },
  }[preset];

  return {
    ...current,
    demand: definition.demand,
    cost: moneyValue(baseline.cost * definition.costMultiplier),
  };
}

export function applyStrategyPreset(
  baseline: ScenarioInputs,
  current: ScenarioInputs,
  preset: StrategyPreset,
): ScenarioInputs {
  if (preset === "price") {
    return {
      ...current,
      price: moneyValue(baseline.price * 0.95),
      capacity: baseline.capacity,
      fixed: baseline.fixed,
      capex: baseline.capex,
    };
  }
  if (preset === "expand") {
    return {
      ...current,
      price: baseline.price,
      capacity: Math.round(baseline.capacity * 1.3),
      fixed: moneyValue(baseline.fixed * 1.12),
      capex: moneyValue(baseline.capex + 45_000),
    };
  }
  return {
    ...current,
    price: baseline.price,
    capacity: baseline.capacity,
    fixed: baseline.fixed,
    capex: baseline.capex,
  };
}

export function buildStrategyComparisons(
  baseline: ScenarioInputs,
  current: ScenarioInputs,
): StrategyComparison[] {
  return ([
    ["hold", "Hold steady"],
    ["price", "Price −5%"],
    ["expand", "Capacity +30%"],
  ] as const).map(([id, label]) => {
    const inputs = applyStrategyPreset(baseline, current, id);
    return { id, label, inputs, result: calculateScenario(inputs) };
  });
}

export function buildDemandSensitivity(inputs: ScenarioInputs): SensitivityPoint[] {
  const demandValues = [...new Set([-20, -10, 0, 10, 20, 30, inputs.demand])].sort((a, b) => a - b);
  return demandValues.map((demand) => ({
    demand,
    operatingProfit: calculateScenario({ ...inputs, demand }).operatingProfit,
  }));
}
