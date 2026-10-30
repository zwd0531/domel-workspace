import { canAny } from "@/domain/permissions/policy";
import { evidenceCreateSchema } from "@/domain/scenario/schema";
import { getAuthorizationContext } from "@/server/auth/context";
import { createSupabaseServerClient } from "@/server/supabase/server";
import { isDemoMode } from "@/server/demo/config";
import { createDemoEvidence } from "@/server/demo/database";

export async function POST(request: Request) {
  const auth = await getAuthorizationContext();
  if (!auth) return Response.json({ error: "Authentication required." }, { status: 401 });
  if (!canAny(auth.roles, "evidence:write")) {
    return Response.json({ error: "Evidence write permission required." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = evidenceCreateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid evidence record.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  if (isDemoMode()) return Response.json(createDemoEvidence(parsed.data), { status: 201 });

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("create_evidence_record", {
    p_title: parsed.data.title,
    p_publisher: parsed.data.publisher,
    p_source_url: parsed.data.sourceUrl,
    p_published_on: parsed.data.publishedOn || null,
    p_topic: parsed.data.topic,
    p_fact: parsed.data.fact,
    p_interpretation: parsed.data.interpretation,
    p_limitations: parsed.data.limitations,
  });

  if (error) {
    return Response.json(
      { error: error.code === "42501" ? "Evidence write permission denied." : "Unable to create the evidence record." },
      { status: error.code === "42501" ? 403 : 400 },
    );
  }

  return Response.json(data, { status: 201 });
}
