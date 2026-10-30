export type ScenarioInputs = {
  quantity: number;
  price: number;
  cost: number;
  fixed: number;
  capacity: number;
  capex: number;
  demand: number;
};

export type ScenarioResult = {
  formulaVersion: string;
  demandUnits: number;
  units: number;
  revenue: number;
  variableCost: number;
  grossProfit: number;
  operatingProfit: number;
  grossMargin: number | null;
  capacityUtilization: number | null;
  unservedDemand: number;
  capex: number;
};
