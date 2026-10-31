import "server-only";

import { z } from "zod";
import {
  buildSearchOnlyDigest,
  intelligenceResearchResultSchema,
  researchSourceSchema,
  toPublicSource,
  type IntelligenceResearchResult,
  type ResearchSource,
} from "@/domain/intelligence/research";
import { EVIDENCE_TOPICS } from "@/domain/intelligence/constants";

const DEEPSEEK_BASE_URL = "https://api.deepseek.com";

const searchResponseSchema = z.object({
  results: z.array(z.object({
    rerank_score: z.number().catch(0),
    title: z.string().catch("Untitled source"),
    url: z.string().url(),
    snippet: z.string().catch(""),
    summary: z.string().catch(""),
    content: z.string().catch(""),
    site_name: z.string().nullable().catch(null),
    date: z.string().nullable().catch(null),
    authority: z.number().int().catch(-1),
  })).max(50),
});

const synthesisSchema = z.object({
  title: z.string().min(1).max(180),
  summary: z.string().min(1).max(3_000),
  findings: z.array(z.object({
    sourceIndex: z.number().int().min(1).max(10),
    title: z.string().min(1).max(180),
    fact: z.string().min(1).max(2_000),
    interpretation: z.string().min(1).max(2_000),
    limitations: z.string().min(1).max(2_000),
    topic: z.enum(EVIDENCE_TOPICS),
    confidence: z.enum(["low", "medium", "high"]),
  })).min(1).max(4),
  gaps: z.array(z.string().min(1).max(500)).max(6),
});

const rawSynthesisSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  findings: z.array(z.object({
    sourceIndex: z.coerce.number().int(),
    title: z.string().min(1),
    fact: z.string().min(1),
    interpretation: z.string().min(1),
    limitations: z.string().min(1),
    topic: z.string(),
    confidence: z.string(),
  })).min(1),
  gaps: z.array(z.string()).catch([]),
});

type Synthesis = z.infer<typeof synthesisSchema>;

export async function runIntelligenceResearch(brief: string): Promise<IntelligenceResearchResult> {
  const key = process.env.DEEPSEEK_API_KEY?.trim();
  if (!key) throw new ResearchAgentError("The research service is not configured yet.", 503);

  const searchQuery = brief.replace(/\s+/g, " ").trim().slice(0, 128);
  const sources = await searchDeepSeek(key, searchQuery, brief.slice(0, 128));
  if (!sources.length) throw new ResearchAgentError("No public web results were found for this brief.", 404);

  const model = process.env.DEEPSEEK_MODEL?.trim() || "deepseek-flash";
  try {
    const synthesis = await synthesizeWithDeepSeek(key, model, brief, sources);
    const sourceByIndex = new Map(sources.map((source) => [source.index, source]));
    const findings = synthesis.findings.map((finding) => {
      const source = sourceByIndex.get(finding.sourceIndex);
      if (!source) throw new Error("The synthesis referenced an unknown source.");
      return {
        ...finding,
        sourceTitle: source.title,
        sourceUrl: source.url,
        publisher: source.siteName || new URL(source.url).hostname.replace(/^www\./, ""),
        publishedOn: source.publishedOn,
      };
    });

    return intelligenceResearchResultSchema.parse({
      ...synthesis,
      engine: "deepseek",
      model,
      fallbackReason: null,
      searchQuery,
      findings,
      sources: sources.map(toPublicSource),
    });
  } catch (error) {
    console.warn("DeepSeek structured research synthesis was unavailable:", safeErrorMessage(error));
    return buildSearchOnlyDigest(
      brief,
      searchQuery,
      sources,
      "DeepSeek found live sources, but structured synthesis was unavailable. Search summaries are shown without added conclusions.",
    );
  }
}

async function searchDeepSeek(key: string, query: string, originalQuestion: string): Promise<ResearchSource[]> {
  const response = await fetch(`${DEEPSEEK_BASE_URL}/v1/tools/search`, {
    method: "POST",
    headers: authHeaders(key),
    body: JSON.stringify({ query, ori_question: originalQuestion, count: 6, need_content: true }),
    signal: AbortSignal.timeout(35_000),
  });
  if (!response.ok) {
    const status = response.status === 401 ? 503 : response.status === 402 ? 503 : 502;
    throw new ResearchAgentError("The web research service is temporarily unavailable.", status);
  }

  const parsed = searchResponseSchema.parse(await response.json());
  return parsed.results.map((result, index) => researchSourceSchema.parse({
    index: index + 1,
    title: result.title.slice(0, 500),
    url: result.url,
    snippet: result.snippet.slice(0, 2_000),
    summary: result.summary.slice(0, 8_000),
    content: result.content.slice(0, 20_000),
    siteName: result.site_name?.slice(0, 300) || null,
    publishedOn: normalizeDate(result.date),
    authority: Math.max(-1, Math.min(4, result.authority)),
    relevance: Math.max(0, Math.min(3, result.rerank_score)),
  }));
}

async function synthesizeWithDeepSeek(key: string, model: string, brief: string, sources: ResearchSource[]): Promise<Synthesis> {
  const sourcePacket = sources.map((source) => ({
    index: source.index,
    title: source.title,
    url: source.url,
    publisher: source.siteName,
    publishedOn: source.publishedOn,
    authority: source.authority,
    relevance: source.relevance,
    text: (source.summary || source.snippet || source.content).slice(0, 3_000),
  }));
  const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: authHeaders(key),
    body: JSON.stringify({
      model,
      thinking: { type: "disabled" },
      max_tokens: 3_600,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are an industry-intelligence analyst. Return JSON only. Use only the supplied sources; never invent a URL, publisher, date, number or claim. Keep source fact separate from interpretation and limitations. Return 2 to 4 concise, non-duplicative findings. Every finding must cite exactly one sourceIndex from the supplied packet. Keep each fact under 160 words and each interpretation or limitation under 100 words. Allowed topics: ${EVIDENCE_TOPICS.join(", ")}. Output this JSON shape: {"title":"...","summary":"...","findings":[{"sourceIndex":1,"title":"...","fact":"...","interpretation":"...","limitations":"...","topic":"Demand","confidence":"medium"}],"gaps":["..."]}.`,
        },
        { role: "user", content: JSON.stringify({ brief, sources: sourcePacket }) },
      ],
    }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!response.ok) throw new Error(`DeepSeek synthesis returned ${response.status}.`);
  const payload = await response.json() as { choices?: Array<{ message?: { content?: string | null } }> };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("DeepSeek returned no synthesis.");
  const raw = rawSynthesisSchema.parse(JSON.parse(stripCodeFence(content)));
  const validSourceIndexes = new Set(sources.map((source) => source.index));
  const validFindings = raw.findings.filter((finding) => validSourceIndexes.has(finding.sourceIndex)).slice(0, 4);
  if (!validFindings.length) throw new Error("DeepSeek synthesis did not cite a supplied source index.");
  return synthesisSchema.parse({
    title: raw.title.slice(0, 180),
    summary: raw.summary.slice(0, 3_000),
    findings: validFindings.map((finding) => ({
      sourceIndex: finding.sourceIndex,
      title: finding.title.slice(0, 180),
      fact: finding.fact.slice(0, 2_000),
      interpretation: finding.interpretation.slice(0, 2_000),
      limitations: finding.limitations.slice(0, 2_000),
      topic: EVIDENCE_TOPICS.includes(finding.topic as (typeof EVIDENCE_TOPICS)[number]) ? finding.topic : "Demand",
      confidence: ["low", "medium", "high"].includes(finding.confidence) ? finding.confidence : "low",
    })),
    gaps: raw.gaps.filter(Boolean).slice(0, 6).map((gap) => gap.slice(0, 500)),
  });
}

function authHeaders(key: string) {
  return { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
}

function normalizeDate(value: string | null): string | null {
  if (!value) return null;
  const match = value.match(/^\d{4}-\d{2}-\d{2}/);
  return match?.[0] ?? null;
}

function stripCodeFence(value: string) {
  return value.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
}

function safeErrorMessage(error: unknown) {
  if (!(error instanceof Error)) return "Unknown error";
  return `${error.name}: ${error.message}`.slice(0, 300);
}

export class ResearchAgentError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}
