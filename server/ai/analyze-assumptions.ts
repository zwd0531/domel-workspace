import "server-only";

import {
  analyzeAssumptionsLocally,
  scenarioAssumptionAnalysisSchema,
  type AssumptionAnalysisEngine,
  type AssumptionAnalysisRequest,
  type ScenarioAssumptionAnalysis,
} from "@/domain/ai/assumption-analysis";

export type AnalysisRun = {
  analysis: ScenarioAssumptionAnalysis;
  engine: Exclude<AssumptionAnalysisEngine, "openai">;
  model: string | null;
  fallbackReason: string | null;
};

const DEEPSEEK_BASE_URL = "https://api.deepseek.com";

const DEEPSEEK_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type: "string" },
    overallScore: { type: "integer", minimum: 0, maximum: 100 },
    confidence: { type: "string", enum: ["low", "medium", "high"] },
    assumptions: {
      type: "array",
      maxItems: 12,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          category: { type: "string", enum: ["demand", "price", "variable_cost", "fixed_cost", "capacity", "capex", "other"] },
          statement: { type: "string" },
          sourcePhrase: { type: "string" },
          value: { anyOf: [{ type: "number" }, { type: "null" }] },
          unit: { type: "string" },
          confidence: { type: "string", enum: ["low", "medium", "high"] },
        },
        required: ["category", "statement", "sourcePhrase", "value", "unit", "confidence"],
      },
    },
    strengths: { type: "array", maxItems: 8, items: { type: "string" } },
    concerns: { type: "array", maxItems: 8, items: { type: "string" } },
    missingInformation: { type: "array", maxItems: 8, items: { type: "string" } },
    suggestedRewrite: { type: "string" },
    parameterSuggestions: {
      type: "object",
      additionalProperties: false,
      properties: {
        demandChangePercent: nullableNumber(-100, 200),
        priceChangePercent: nullableNumber(-100, 200),
        variableCostChangePercent: nullableNumber(-100, 200),
        fixedCostChangePercent: nullableNumber(-100, 200),
        capacityChangePercent: nullableNumber(-100, 200),
        capexAmount: nullableNumber(0, 1_000_000_000),
      },
      required: ["demandChangePercent", "priceChangePercent", "variableCostChangePercent", "fixedCostChangePercent", "capacityChangePercent", "capexAmount"],
    },
  },
  required: ["summary", "overallScore", "confidence", "assumptions", "strengths", "concerns", "missingInformation", "suggestedRewrite", "parameterSuggestions"],
} as const;

export async function analyzeScenarioAssumptions(request: AssumptionAnalysisRequest): Promise<AnalysisRun> {
  const key = process.env.DEEPSEEK_API_KEY?.trim();
  if (!key) return { analysis: analyzeAssumptionsLocally(request.text), engine: "local_rules", model: null, fallbackReason: null };

  const model = process.env.DEEPSEEK_MODEL?.trim() || "deepseek-flash";
  try {
    const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        thinking: { type: "disabled" },
        max_tokens: 1_800,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You analyze business scenario assumptions. Return JSON only and match the supplied JSON Schema exactly. Separate explicit statements from inference, never invent evidence, map only supported numeric changes, and keep the result concise and decision-oriented. Scores measure completeness and testability, not whether the prediction is true. JSON Schema: ${JSON.stringify(DEEPSEEK_SCHEMA)}`,
          },
          {
            role: "user",
            content: JSON.stringify({ assumptionText: request.text, currentScenarioInputs: request.inputs }),
          },
        ],
      }),
      signal: AbortSignal.timeout(35_000),
    });
    if (!response.ok) throw new Error(`DeepSeek request returned ${response.status}.`);
    const payload = await response.json() as DeepSeekResponse;
    const outputText = payload.choices?.[0]?.message?.content;
    if (!outputText) throw new Error("DeepSeek response contained no structured output.");
    const analysis = scenarioAssumptionAnalysisSchema.parse(JSON.parse(stripCodeFence(outputText)));
    return { analysis, engine: "deepseek", model, fallbackReason: null };
  } catch {
    return {
      analysis: analyzeAssumptionsLocally(request.text),
      engine: "local_rules",
      model: null,
      fallbackReason: "DeepSeek was unavailable or returned an invalid analysis, so the local analyzer was used.",
    };
  }
}

function nullableNumber(minimum: number, maximum: number) {
  return { anyOf: [{ type: "number", minimum, maximum }, { type: "null" }] } as const;
}

function stripCodeFence(value: string) {
  return value.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
}

type DeepSeekResponse = {
  choices?: Array<{ message?: { content?: string | null } }>;
};
