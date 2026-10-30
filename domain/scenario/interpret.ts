import type { ScenarioInputs, ScenarioResult } from "./types";

export type ScenarioInterpretation = {
  risks: string[];
  evidenceGaps: string[];
};

export function interpretScenario(
  inputs: ScenarioInputs,
  result: ScenarioResult,
  linkedEvidenceTopics: string[],
): ScenarioInterpretation {
  const risks: string[] = [];
  const evidenceGaps: string[] = [];

  if (result.unservedDemand > 0) risks.push("Assumed demand exceeds available capacity.");
  if (result.operatingProfit < 0) risks.push("The scenario produces a monthly operating loss.");
  if (result.capacityUtilization !== null && result.capacityUtilization > 0.95) {
    risks.push("Capacity utilization exceeds 95 percent.");
  }

  if (inputs.demand > 10 && !linkedEvidenceTopics.some((topic) => ["Demand", "Competition"].includes(topic))) {
    evidenceGaps.push("Demand growth above 10 percent needs demand or competition evidence.");
  }
  if (inputs.price !== 0 && inputs.demand === 0) {
    evidenceGaps.push("Review whether the selected price assumption changes customer demand.");
  }

  return { risks, evidenceGaps };
}
