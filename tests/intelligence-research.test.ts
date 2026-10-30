import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildSearchOnlyDigest, intelligenceResearchResultSchema, type ResearchSource } from "@/domain/intelligence/research";

const source: ResearchSource = {
  index: 1,
  title: "European heat pump market report",
  url: "https://example.com/report",
  snippet: "Market installations changed during the reporting period.",
  summary: "The publisher reports a change in European heat-pump installations during the reporting period.",
  content: "Full extracted page text.",
  siteName: "Example Institute",
  publishedOn: "2026-10-20",
  authority: 3,
  relevance: 2.1,
};

describe("Industry Intelligence research agent", () => {
  it("keeps source identity intact in search-only fallback results", () => {
    const result = buildSearchOnlyDigest("Assess European HVAC demand", "European HVAC demand", [source], "Synthesis unavailable.");
    expect(result.engine).toBe("search_only");
    expect(result.findings[0].sourceUrl).toBe(source.url);
    expect(result.findings[0].publisher).toBe(source.siteName);
    expect(result.findings[0].limitations).toContain("original source");
    expect(intelligenceResearchResultSchema.safeParse(result).success).toBe(true);
  });

  it("uses DeepSeek live search and JSON synthesis without embedding credentials", () => {
    const provider = readFileSync(new URL("../server/intelligence/research-agent.ts", import.meta.url), "utf8");
    expect(provider).toContain("process.env.DEEPSEEK_API_KEY");
    expect(provider).toContain("/v1/tools/search");
    expect(provider).toContain("/chat/completions");
    expect(provider).toContain('type: "json_object"');
    expect(provider).not.toMatch(/sk-[a-z0-9]{16,}/i);
  });

  it("stores only a simple creator-owned research history", () => {
    const migration = readFileSync(new URL("../db/migrations/0009_intelligence_research_agent.sql", import.meta.url), "utf8");
    expect(migration).toContain("create table public.intelligence_research_runs");
    expect(migration).toContain("result jsonb not null");
    expect(migration).toContain("created_by = auth.uid()");
  });
});
