import "server-only";

import {
  analyzeAssumptionsLocally,
  scenarioAssumptionAnalysisSchema,
  type AssumptionAnalysisRequest,
  type ScenarioAssumptionAnalysis,
} from "@/domain/ai/assumption-analysis";

export type AnalysisRun = {
  analysis: ScenarioAssumptionAnalysis;
  engine: "openai" | "local_rules";
  model: string | null;
  fallbackReason: string | null;
};

const OPENAI_SCHEMA = {
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
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return { analysis: analyzeAssumptionsLocally(request.text), engine: "local_rules", model: null, fallbackReason: null };

  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        store: false,
        max_output_tokens: 1_800,
        instructions: "You analyze business scenario assumptions. Separate explicit statements from inference, never invent evidence, map only supported numeric changes, and return concise decision-oriented JSON. Scores measure completeness and testability, not whether the prediction is true.",
        input: JSON.stringify({ assumptionText: request.text, currentScenarioInputs: request.inputs }),
        text: { format: { type: "json_schema", name: "scenario_assumption_analysis", strict: true, schema: OPENAI_SCHEMA } },
      }),
      signal: AbortSignal.timeout(35_000),
    });
    if (!response.ok) throw new Error(`OpenAI request returned ${response.status}.`);
    const payload = await response.json() as OpenAiResponse;
    if (payload.status !== "completed") throw new Error("OpenAI response was incomplete.");
    const outputText = payload.output?.flatMap((item) => item.content ?? []).find((item) => item.type === "output_text")?.text;
    if (!outputText) throw new Error("OpenAI response contained no structured output.");
    const analysis = scenarioAssumptionAnalysisSchema.parse(JSON.parse(outputText));
    return { analysis, engine: "openai", model, fallbackReason: null };
  } catch {
    return {
      analysis: analyzeAssumptionsLocally(request.text),
      engine: "local_rules",
      model: null,
      fallbackReason: "The configured AI service was unavailable, so the local demonstration analyzer was used.",
    };
  }
}

function nullableNumber(minimum: number, maximum: number) {
  return { anyOf: [{ type: "number", minimum, maximum }, { type: "null" }] } as const;
}

type OpenAiResponse = {
  status?: string;
  output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
};
