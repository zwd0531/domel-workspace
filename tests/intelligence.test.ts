import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { evidenceCsv, filterEvidence } from "@/domain/intelligence/filter";
import type { IntelligenceEvidence } from "@/domain/intelligence/types";
import { evidenceReviewSchema } from "@/domain/scenario/schema";

const base: IntelligenceEvidence = {
  id: "40000000-0000-0000-0000-000000000001",
  title: "HVAC demand signal",
  publisher: "Example publisher",
  sourceUrl: "https://example.com/source",
  publishedOn: "2026-10-01",
  capturedOn: "2026-10-13",
  topic: "Demand",
  fact: "Published fact",
  interpretation: "Working interpretation",
  limitations: "No product-specific forecast.",
  verificationStatus: "source_reviewed",
  reviewNote: "Source text checked.",
  reviewedAt: "2026-10-13T00:00:00Z",
  linkedScenarioCount: 1,
};

describe("Industry Intelligence", () => {
  it("filters by query, topic and review status", () => {
    const competition = { ...base, id: "40000000-0000-0000-0000-000000000002", title: "Competitor controls", topic: "Competition" as const };
    expect(filterEvidence([base, competition], { query: "HVAC", topic: "Demand", status: "source_reviewed" })).toEqual([base]);
    expect(filterEvidence([base, competition], { query: "controls", topic: "All", status: "All" })).toEqual([competition]);
  });

  it("escapes CSV cells and neutralizes spreadsheet formulas", () => {
    const csv = evidenceCsv([{ ...base, title: "=HYPERLINK(\"bad\")" }]);
    expect(csv).toContain("\"'=HYPERLINK(\"\"bad\"\")\"");
    expect(csv).toContain("\"No product-specific forecast.\"");
  });

  it("requires a reviewer note for follow-up or rejection", () => {
    const payload = { evidenceId: base.id, status: "needs_follow_up", reviewNote: "" };
    expect(evidenceReviewSchema.safeParse(payload).success).toBe(false);
    expect(evidenceReviewSchema.safeParse({ ...payload, reviewNote: "Confirm the current publication date." }).success).toBe(true);
  });

  it("keeps review writes inside an audited security-definer function", () => {
    const migration = readFileSync(new URL("../db/migrations/0005_industry_intelligence_review.sql", import.meta.url), "utf8");
    expect(migration).toContain("function public.review_evidence_record");
    expect(migration).toContain("security definer");
    expect(migration).toContain("'evidence.reviewed'");
  });

  it("ships all eleven attributed offline sources as UAT seed records", () => {
    const seed = readFileSync(new URL("../db/seed/demo.sql", import.meta.url), "utf8");
    const ids = seed.match(/40000000-0000-0000-0000-0000000000\d{2}/g) ?? [];
    expect(new Set(ids).size).toBe(11);
    expect(seed).toContain("publisher claims were not independently tested");
  });
});
