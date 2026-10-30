import { z } from "zod";
import { EVIDENCE_TOPICS } from "@/domain/intelligence/constants";

export const researchBriefSchema = z.object({
  brief: z.string().trim().min(10).max(800),
});

export const researchSourceSchema = z.object({
  index: z.number().int().min(1).max(50),
  title: z.string().min(1).max(500),
  url: z.string().url().max(8_192),
  snippet: z.string().max(2_000),
  summary: z.string().max(8_000),
  content: z.string().max(20_000),
  siteName: z.string().max(300).nullable(),
  publishedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  authority: z.number().int().min(-1).max(4),
  relevance: z.number().min(0).max(3),
});

export const researchFindingSchema = z.object({
  sourceIndex: z.number().int().min(1).max(50),
  sourceTitle: z.string().min(1).max(500),
  sourceUrl: z.string().url().max(8_192),
  publisher: z.string().min(1).max(300),
  publishedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  title: z.string().min(1).max(180),
  fact: z.string().min(1).max(2_000),
  interpretation: z.string().min(1).max(2_000),
  limitations: z.string().min(1).max(2_000),
  topic: z.enum(EVIDENCE_TOPICS),
  confidence: z.enum(["low", "medium", "high"]),
});

export const intelligenceResearchResultSchema = z.object({
  title: z.string().min(1).max(180),
  summary: z.string().min(1).max(3_000),
  engine: z.enum(["deepseek", "search_only"]),
  model: z.string().max(120).nullable(),
  fallbackReason: z.string().max(500).nullable(),
  searchQuery: z.string().min(1).max(128),
  findings: z.array(researchFindingSchema).min(1).max(6),
  gaps: z.array(z.string().min(1).max(500)).max(6),
  sources: z.array(researchSourceSchema.omit({ content: true })).min(1).max(10),
});

export type ResearchSource = z.infer<typeof researchSourceSchema>;
export type ResearchFinding = z.infer<typeof researchFindingSchema>;
export type IntelligenceResearchResult = z.infer<typeof intelligenceResearchResultSchema>;

export function buildSearchOnlyDigest(brief: string, searchQuery: string, sources: ResearchSource[], fallbackReason: string): IntelligenceResearchResult {
  const findings = sources.slice(0, 4).map((source) => ({
    sourceIndex: source.index,
    sourceTitle: source.title,
    sourceUrl: source.url,
    publisher: source.siteName || hostname(source.url),
    publishedOn: source.publishedOn,
    title: source.title.slice(0, 180),
    fact: (source.summary || source.snippet).slice(0, 700),
    interpretation: "This source may be relevant to the research brief, but no model-generated interpretation is shown because synthesis was unavailable.",
    limitations: "Search-result text has not been independently verified. Open the original source and review its context before using it in a decision.",
    topic: "Demand" as const,
    confidence: source.authority >= 3 && source.relevance >= 1.5 ? "medium" as const : "low" as const,
  }));

  return intelligenceResearchResultSchema.parse({
    title: `Search results for: ${brief.slice(0, 130)}`,
    summary: `${findings.length} public web sources were found. Automated synthesis was unavailable, so this result preserves source summaries without adding unsupported conclusions.`,
    engine: "search_only",
    model: null,
    fallbackReason,
    searchQuery,
    findings,
    gaps: ["Review the original pages before promoting any finding to reviewed evidence.", "Add product- and market-specific sources if the current results are too broad."],
    sources: sources.map(toPublicSource),
  });
}

export function toPublicSource(source: ResearchSource) {
  return {
    index: source.index,
    title: source.title,
    url: source.url,
    snippet: source.snippet,
    summary: source.summary,
    siteName: source.siteName,
    publishedOn: source.publishedOn,
    authority: source.authority,
    relevance: source.relevance,
  };
}

function hostname(value: string) {
  try { return new URL(value).hostname.replace(/^www\./, ""); } catch { return "Public web source"; }
}
