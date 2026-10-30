import { canAny } from "@/domain/permissions/policy";
import { evidenceReviewSchema } from "@/domain/scenario/schema";
import { getAuthorizationContext } from "@/server/auth/context";
import { createSupabaseServerClient } from "@/server/supabase/server";
import { isDemoMode } from "@/server/demo/config";
import { reviewDemoEvidence } from "@/server/demo/database";

export async function POST(request: Request) {
  const auth = await getAuthorizationContext();
  if (!auth) return Response.json({ error: "Authentication required." }, { status: 401 });
  if (!canAny(auth.roles, "evidence:write")) {
    return Response.json({ error: "Evidence review permission required." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = evidenceReviewSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid evidence review.", details: parsed.error.flatten() }, { status: 400 });
  }

  if (isDemoMode()) {
    try { return Response.json(reviewDemoEvidence(parsed.data.evidenceId, parsed.data.status, parsed.data.reviewNote)); }
    catch { return Response.json({ error: "Unable to review the evidence record." }, { status: 400 }); }
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("review_evidence_record", {
    p_evidence_id: parsed.data.evidenceId,
    p_status: parsed.data.status,
    p_review_note: parsed.data.reviewNote,
  });

  if (error) {
    return Response.json(
      { error: error.code === "42501" ? "Evidence review permission denied." : "Unable to review the evidence record." },
      { status: error.code === "42501" ? 403 : 400 },
    );
  }

  return Response.json(data);
}
