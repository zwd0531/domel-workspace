import { z } from "zod";
import { EVIDENCE_STATUSES, EVIDENCE_TOPICS } from "@/domain/intelligence/constants";

const nonNegativeAmount = z.number().finite().min(0).max(1_000_000_000);
const databaseId = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

export const scenarioInputSchema = z.object({
  quantity: nonNegativeAmount.int(),
  price: nonNegativeAmount,
  cost: nonNegativeAmount,
  fixed: nonNegativeAmount,
  capacity: nonNegativeAmount.int(),
  capex: nonNegativeAmount,
  demand: z.number().finite().min(-100).max(200),
});

export const scenarioSaveSchema = z.object({
  scenarioId: databaseId.nullable().optional(),
  productId: databaseId,
  businessMonth: z.string().regex(/^\d{4}-\d{2}-01$/),
  name: z.string().trim().min(1).max(120),
  inputs: scenarioInputSchema,
  rationale: z.string().trim().max(2_000).default(""),
  evidenceIds: z.array(databaseId).max(20).default([]),
});

export const evidenceCreateSchema = z.object({
  title: z.string().trim().min(1).max(180),
  publisher: z.string().trim().min(1).max(120),
  sourceUrl: z.string().trim().url().max(2_000),
  publishedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  topic: z.enum(EVIDENCE_TOPICS),
  fact: z.string().trim().min(1).max(2_000),
  interpretation: z.string().trim().min(1).max(2_000),
  limitations: z.string().trim().min(1).max(2_000),
});

export const evidenceReviewSchema = z.object({
  evidenceId: databaseId,
  status: z.enum(EVIDENCE_STATUSES),
  reviewNote: z.string().trim().max(2_000).default(""),
}).superRefine((value, context) => {
  if (["needs_follow_up", "rejected"].includes(value.status) && !value.reviewNote) {
    context.addIssue({ code: "custom", path: ["reviewNote"], message: "A review note is required for this status." });
  }
});
