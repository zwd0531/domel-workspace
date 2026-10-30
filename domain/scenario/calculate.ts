import type { ScenarioInputs, ScenarioResult } from "./types";

export const FORMULA_VERSION = "2.0.0";

export function validateScenarioInputs(inputs: ScenarioInputs): string[] {
  const errors: string[] = [];
  const nonNegativeKeys: Array<keyof Omit<ScenarioInputs, "demand">> = [
    "quantity",
    "price",
    "cost",
    "fixed",
    "capacity",
    "capex",
  ];

  for (const key of nonNegativeKeys) {
    const value = inputs[key];
    if (!Number.isFinite(value) || value < 0 || value > 1_000_000_000) {
      errors.push(`${key} must be between 0 and 1,000,000,000.`);
    }
  }

  if (!Number.isFinite(inputs.demand) || inputs.demand < -100 || inputs.demand > 200) {
    errors.push("demand must be between -100 and 200 percent.");
  }
  if (!Number.isInteger(inputs.quantity)) errors.push("quantity must be a whole number.");
  if (!Number.isInteger(inputs.capacity)) errors.push("capacity must be a whole number.");

  return errors;
}

export function calculateScenario(inputs: ScenarioInputs): ScenarioResult {
  const errors = validateScenarioInputs(inputs);
  if (errors.length) throw new Error(errors.join(" "));

  const demandUnits = Math.max(0, Math.round(inputs.quantity * (1 + inputs.demand / 100)));
  const units = Math.min(demandUnits, inputs.capacity);
  const revenue = units * inputs.price;
  const variableCost = units * inputs.cost;
  const grossProfit = revenue - variableCost;
  const operatingProfit = grossProfit - inputs.fixed;

  return {
    formulaVersion: FORMULA_VERSION,
    demandUnits,
    units,
    revenue,
    variableCost,
    grossProfit,
    operatingProfit,
    grossMargin: revenue === 0 ? null : grossProfit / revenue,
    capacityUtilization: inputs.capacity === 0 ? null : units / inputs.capacity,
    unservedDemand: demandUnits - units,
    capex: inputs.capex,
  };
}
