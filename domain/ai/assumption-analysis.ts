import { z } from "zod";
import { scenarioInputSchema } from "@/domain/scenario/schema";

export const assumptionCategorySchema = z.enum(["demand", "price", "variable_cost", "fixed_cost", "capacity", "capex", "other"]);
export const analysisConfidenceSchema = z.enum(["low", "medium", "high"]);
const databaseId = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

export const scenarioAssumptionAnalysisSchema = z.object({
  summary: z.string().min(1).max(1_500),
  overallScore: z.number().int().min(0).max(100),
  confidence: analysisConfidenceSchema,
  assumptions: z.array(z.object({
    category: assumptionCategorySchema,
    statement: z.string().min(1).max(500),
    sourcePhrase: z.string().min(1).max(500),
    value: z.number().nullable(),
    unit: z.string().max(40),
    confidence: analysisConfidenceSchema,
  })).max(12),
  strengths: z.array(z.string().min(1).max(500)).max(8),
  concerns: z.array(z.string().min(1).max(500)).max(8),
  missingInformation: z.array(z.string().min(1).max(500)).max(8),
  suggestedRewrite: z.string().min(1).max(3_000),
  parameterSuggestions: z.object({
    demandChangePercent: z.number().min(-100).max(200).nullable(),
    priceChangePercent: z.number().min(-100).max(200).nullable(),
    variableCostChangePercent: z.number().min(-100).max(200).nullable(),
    fixedCostChangePercent: z.number().min(-100).max(200).nullable(),
    capacityChangePercent: z.number().min(-100).max(200).nullable(),
    capexAmount: z.number().min(0).max(1_000_000_000).nullable(),
  }),
});

export const assumptionAnalysisRequestSchema = z.object({
  text: z.string().trim().min(10).max(4_000),
  scenarioId: databaseId.nullable().optional(),
  snapshotId: databaseId.nullable().optional(),
  inputs: scenarioInputSchema,
});

export type ScenarioAssumptionAnalysis = z.infer<typeof scenarioAssumptionAnalysisSchema>;
export type AssumptionAnalysisRequest = z.infer<typeof assumptionAnalysisRequestSchema>;

type Category = z.infer<typeof assumptionCategorySchema>;

export function analyzeAssumptionsLocally(text: string): ScenarioAssumptionAnalysis {
  const assumptions: ScenarioAssumptionAnalysis["assumptions"] = [];
  const suggestions: ScenarioAssumptionAnalysis["parameterSuggestions"] = {
    demandChangePercent: null,
    priceChangePercent: null,
    variableCostChangePercent: null,
    fixedCostChangePercent: null,
    capacityChangePercent: null,
    capexAmount: null,
  };

  const rules: Array<{
    category: Category;
    key: keyof typeof suggestions;
    pattern: RegExp;
    negative?: boolean;
    unit: string;
  }> = [
    { category: "demand", key: "demandChangePercent", pattern: /(?:demand|sales volume|需求|销量)[^.%。]{0,35}?(?:grow|increase|rise|增长|增加|上升)[^\d-]{0,10}(-?\d+(?:\.\d+)?)\s*%/i, unit: "%" },
    { category: "demand", key: "demandChangePercent", pattern: /(?:demand|sales volume|需求|销量)[^.%。]{0,35}?(?:decline|decrease|fall|下降|减少)[^\d-]{0,10}(-?\d+(?:\.\d+)?)\s*%/i, negative: true, unit: "%" },
    { category: "price", key: "priceChangePercent", pattern: /(?:unit price|selling price|price|售价|价格)[^.%。]{0,35}?(?:grow|increase|rise|上涨|增长|提高)[^\d-]{0,10}(-?\d+(?:\.\d+)?)\s*%/i, unit: "%" },
    { category: "price", key: "priceChangePercent", pattern: /(?:unit price|selling price|price|售价|价格)[^.%。]{0,35}?(?:decline|decrease|fall|下降|降低)[^\d-]{0,10}(-?\d+(?:\.\d+)?)\s*%/i, negative: true, unit: "%" },
    { category: "variable_cost", key: "variableCostChangePercent", pattern: /(?:raw material cost|material cost|variable cost|原材料成本|单位成本|变动成本)[^.%。]{0,35}?(?:grow|increase|rise|上涨|增长|增加)[^\d-]{0,10}(-?\d+(?:\.\d+)?)\s*%/i, unit: "%" },
    { category: "variable_cost", key: "variableCostChangePercent", pattern: /(?:raw material cost|material cost|variable cost|原材料成本|单位成本|变动成本)[^.%。]{0,35}?(?:decline|decrease|fall|下降|降低)[^\d-]{0,10}(-?\d+(?:\.\d+)?)\s*%/i, negative: true, unit: "%" },
    { category: "fixed_cost", key: "fixedCostChangePercent", pattern: /(?:fixed cost|固定成本)[^.%。]{0,35}?(?:grow|increase|rise|上涨|增长|增加)[^\d-]{0,10}(-?\d+(?:\.\d+)?)\s*%/i, unit: "%" },
    { category: "capacity", key: "capacityChangePercent", pattern: /(?:capacity|产能)[^.%。]{0,35}?(?:grow|increase|expand|扩张|增加|提升)[^\d-]{0,10}(-?\d+(?:\.\d+)?)\s*%/i, unit: "%" },
  ];

  for (const rule of rules) {
    if (suggestions[rule.key] !== null) continue;
    const match = text.match(rule.pattern);
    if (!match) continue;
    const raw = Number(match[1]);
    const value = clamp(rule.negative ? -Math.abs(raw) : raw, rule.key === "demandChangePercent" ? -100 : -100, 200);
    suggestions[rule.key] = value;
    assumptions.push({
      category: rule.category,
      statement: `${label(rule.category)} change of ${value}%`,
      sourcePhrase: match[0],
      value,
      unit: rule.unit,
      confidence: "high",
    });
  }

  const unchangedCapacity = text.match(/(?:capacity|产能)[^。.!]{0,30}?(?:unchanged|no expansion|remain(?:s)? flat|不变|不扩张|保持不变)/i);
  if (unchangedCapacity && suggestions.capacityChangePercent === null) {
    suggestions.capacityChangePercent = 0;
    assumptions.push({ category: "capacity", statement: "Capacity remains unchanged", sourcePhrase: unchangedCapacity[0], value: 0, unit: "%", confidence: "high" });
  }

  const capex = text.match(/(?:capex|investment|capital expenditure|资本支出|投资)[^\d]{0,15}(?:EUR|€|CNY|RMB|¥)?\s*([\d,.]+)\s*(million|m|万|百万)?/i);
  if (capex) {
    let value = Number(capex[1].replaceAll(",", ""));
    if (/million|\bm\b|百万/i.test(capex[2] ?? "")) value *= 1_000_000;
    if ((capex[2] ?? "") === "万") value *= 10_000;
    suggestions.capexAmount = clamp(value, 0, 1_000_000_000);
    assumptions.push({ category: "capex", statement: `Proposed capex of ${suggestions.capexAmount}`, sourcePhrase: capex[0], value: suggestions.capexAmount, unit: "currency", confidence: "medium" });
  }

  const hasTimeHorizon = /(?:20\d{2}|month|quarter|year|Q[1-4]|月|季度|年度|年内|未来\s*\d+)/i.test(text);
  const hasEvidence = /(?:according to|source|report|data|forecast|根据|来源|报告|数据显示|预测)/i.test(text);
  const hasTrigger = /(?:if|when|unless|trigger|review if|如果|当|一旦|触发|超过|低于)/i.test(text);
  const strengths: string[] = [];
  const concerns: string[] = [];
  const missingInformation: string[] = [];

  if (assumptions.length) strengths.push(`${assumptions.length} quantified assumption${assumptions.length === 1 ? " was" : "s were"} recognized.`);
  if (hasTimeHorizon) strengths.push("A time horizon is present.");
  if (hasEvidence) strengths.push("The text signals a data source or forecast basis.");
  if (!assumptions.length) concerns.push("No supported numeric assumption could be mapped to scenario parameters.");
  if (!hasTimeHorizon) { concerns.push("The assumption has no clear time horizon."); missingInformation.push("Define the month, quarter or year in which the change is expected."); }
  if (!hasEvidence) { concerns.push("The statement does not name supporting evidence."); missingInformation.push("Name the source, report or internal dataset behind each estimate."); }
  if (!hasTrigger) { concerns.push("No review trigger is defined."); missingInformation.push("Add a threshold or event that would cause the scenario to be reviewed."); }
  if ((suggestions.demandChangePercent ?? 0) > 0 && suggestions.capacityChangePercent === 0) {
    concerns.push("Demand increases while capacity stays flat, so the capacity constraint needs explicit review.");
  }

  const score = clamp(25 + Math.min(35, assumptions.length * 12) + (hasTimeHorizon ? 15 : 0) + (hasEvidence ? 15 : 0) + (hasTrigger ? 10 : 0), 0, 100);
  const confidence: ScenarioAssumptionAnalysis["confidence"] = hasEvidence && hasTimeHorizon ? "high" : assumptions.length && (hasEvidence || hasTimeHorizon) ? "medium" : "low";
  const additions = [
    !hasTimeHorizon ? "a defined time horizon" : null,
    !hasEvidence ? "a named evidence source" : null,
    !hasTrigger ? "a measurable review trigger" : null,
  ].filter(Boolean).join(", ");

  return scenarioAssumptionAnalysisSchema.parse({
    summary: assumptions.length
      ? `The analyzer mapped ${assumptions.length} assumption${assumptions.length === 1 ? "" : "s"} to scenario parameters. The statement scores ${score}/100 for decision-readiness.`
      : `The statement is readable but not yet specific enough to drive the scenario model. It scores ${score}/100 for decision-readiness.`,
    overallScore: score,
    confidence,
    assumptions,
    strengths,
    concerns,
    missingInformation,
    suggestedRewrite: additions ? `${text.trim()} Add ${additions} before treating this as a decision-ready assumption.` : text.trim(),
    parameterSuggestions: suggestions,
  });
}

function label(category: Category) {
  return category.replace("_", " ");
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}
