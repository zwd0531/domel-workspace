import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { analyzeAssumptionsLocally, scenarioAssumptionAnalysisSchema } from "@/domain/ai/assumption-analysis";

describe("scenario AI assumption analysis", () => {
  it("maps an English narrative into scenario parameter changes", () => {
    const analysis = analyzeAssumptionsLocally("Demand is expected to grow 15% in Q1 2027, raw material cost may increase 8%, and capacity will remain unchanged. Review the scenario if demand growth falls below 5%. Source: internal sales forecast.");
    expect(analysis.parameterSuggestions.demandChangePercent).toBe(15);
    expect(analysis.parameterSuggestions.variableCostChangePercent).toBe(8);
    expect(analysis.parameterSuggestions.capacityChangePercent).toBe(0);
    expect(analysis.overallScore).toBe(100);
    expect(analysis.confidence).toBe("high");
    expect(analysis.concerns.join(" ")).toContain("capacity constraint");
  });

  it("supports common Chinese assumption wording", () => {
    const analysis = analyzeAssumptionsLocally("根据内部预测，2027年需求增长12%，原材料成本上涨6%，产能保持不变。如果需求增长低于4%则重新评估。");
    expect(analysis.parameterSuggestions.demandChangePercent).toBe(12);
    expect(analysis.parameterSuggestions.variableCostChangePercent).toBe(6);
    expect(analysis.parameterSuggestions.capacityChangePercent).toBe(0);
    expect(analysis.confidence).toBe("high");
  });

  it("flags a vague narrative instead of inventing parameters", () => {
    const analysis = analyzeAssumptionsLocally("The market could improve and the team expects a positive result.");
    expect(Object.values(analysis.parameterSuggestions).every((value) => value === null)).toBe(true);
    expect(analysis.confidence).toBe("low");
    expect(analysis.concerns.join(" ")).toContain("No supported numeric assumption");
    expect(scenarioAssumptionAnalysisSchema.safeParse(analysis).success).toBe(true);
  });

  it("uses DeepSeek structured JSON with a local fallback", () => {
    const provider = readFileSync(new URL("../server/ai/analyze-assumptions.ts", import.meta.url), "utf8");
    expect(provider).toContain("DEEPSEEK_API_KEY");
    expect(provider).toContain("api.deepseek.com");
    expect(provider).toContain('response_format: { type: "json_object" }');
    expect(provider).toContain('engine: "deepseek"');
    expect(provider).toContain("analyzeAssumptionsLocally");
    expect(provider).toContain("fallbackReason");
    expect(provider).not.toContain("OPENAI_API_KEY");
  });

  it("persists only a simple scenario-linked analysis history", () => {
    const createMigration = readFileSync(new URL("../db/migrations/0008_scenario_ai_analysis.sql", import.meta.url), "utf8");
    const providerMigration = readFileSync(new URL("../db/migrations/0010_deepseek_scenario_analysis.sql", import.meta.url), "utf8");
    expect(createMigration).toContain("create table public.scenario_ai_analyses");
    expect(createMigration).toContain("scenario_id uuid not null references public.scenarios");
    expect(createMigration).toContain("analysis jsonb not null");
    expect(providerMigration).toContain("scenario_ai_analyses_engine_check");
    expect(providerMigration).toContain("engine in ('local_rules', 'deepseek', 'openai')");
  });
});
