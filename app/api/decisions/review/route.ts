import { canAny } from "@/domain/permissions/policy";
import { decisionReviewSchema } from "@/domain/scenario/schema";
import { getAuthorizationContext } from "@/server/auth/context";
import { createSupabaseServerClient } from "@/server/supabase/server";

export async function POST(request: Request) {
  const auth = await getAuthorizationContext();
  if (!auth) return Response.json({ error: "Authentication required." }, { status: 401 });
  if (!canAny(auth.roles, "decision:approve")) {
    return Response.json({ error: "Decision approval permission required." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = decisionReviewSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid decision review.", details: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("review_scenario_decision", {
    p_decision_id: parsed.data.decisionId,
    p_action: parsed.data.action,
    p_review_note: parsed.data.reviewNote,
  });

  if (error) {
    const forbidden = error.code === "42501";
    return Response.json(
      { error: forbidden ? "The submitter cannot review their own decision, or approval permission was denied." : error.message || "Unable to review the decision." },
      { status: forbidden ? 403 : 400 },
    );
  }

  return Response.json(data);
}
