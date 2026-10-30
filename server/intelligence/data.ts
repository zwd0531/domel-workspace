import { z } from "zod";
import { EVIDENCE_STATUSES, EVIDENCE_TOPICS } from "@/domain/intelligence/constants";
import type { IntelligenceData, IntelligenceEvidence } from "@/domain/intelligence/types";
import type { AuthorizationContext } from "@/server/auth/context";
import { createSupabaseServerClient } from "@/server/supabase/server";
import { isDemoMode } from "@/server/demo/config";
import { loadDemoIntelligenceData } from "@/server/demo/database";

const evidenceSchema = z.object({
  id: z.string(),
  title: z.string(),
  publisher: z.string(),
  source_url: z.string(),
  published_on: z.string().nullable(),
  captured_on: z.string(),
  topic: z.enum(EVIDENCE_TOPICS),
  fact: z.string(),
  interpretation: z.string(),
  limitations: z.string(),
  verification_status: z.enum(EVIDENCE_STATUSES),
  review_note: z.string(),
  reviewed_at: z.string().nullable(),
});
const linkSchema = z.object({ evidence_id: z.string() });

export async function loadIntelligenceData(auth: AuthorizationContext): Promise<IntelligenceData> {
  if (isDemoMode()) return loadDemoIntelligenceData();
  const supabase = await createSupabaseServerClient();
  const [profileResult, evidenceResult, linkResult] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", auth.userId).single(),
    supabase.from("evidence_records").select("id,title,publisher,source_url,published_on,captured_on,topic,fact,interpretation,limitations,verification_status,review_note,reviewed_at").order("published_on", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false }),
    supabase.from("scenario_evidence").select("evidence_id"),
  ]);

  if (profileResult.error) throw new Error(`Unable to load profile: ${profileResult.error.message}`);
  if (evidenceResult.error) throw new Error(`Unable to load intelligence records: ${evidenceResult.error.message}`);
  if (linkResult.error) throw new Error(`Unable to load evidence usage: ${linkResult.error.message}`);

  const linkCount = new Map<string, number>();
  for (const link of z.array(linkSchema).parse(linkResult.data)) {
    linkCount.set(link.evidence_id, (linkCount.get(link.evidence_id) ?? 0) + 1);
  }

  const records: IntelligenceEvidence[] = z.array(evidenceSchema).parse(evidenceResult.data).map((record) => ({
    id: record.id,
    title: record.title,
    publisher: record.publisher,
    sourceUrl: record.source_url,
    publishedOn: record.published_on,
    capturedOn: record.captured_on,
    topic: record.topic,
    fact: record.fact,
    interpretation: record.interpretation,
    limitations: record.limitations,
    verificationStatus: record.verification_status,
    reviewNote: record.review_note,
    reviewedAt: record.reviewed_at,
    linkedScenarioCount: linkCount.get(record.id) ?? 0,
  }));

  return {
    displayName: String(profileResult.data.display_name),
    roles: auth.roles,
    records,
  };
}
