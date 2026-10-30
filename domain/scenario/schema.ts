import { z } from "zod";

const nonNegativeAmount = z.number().finite().min(0).max(1_000_000_000);

export const scenarioInputSchema = z.object({
  quantity: nonNegativeAmount.int(),
  price: nonNegativeAmount,
  cost: nonNegativeAmount,
  fixed: nonNegativeAmount,
  capacity: nonNegativeAmount.int(),
  capex: nonNegativeAmount,
  demand: z.number().finite().min(-100).max(200),
});
