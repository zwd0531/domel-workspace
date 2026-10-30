import { canAny } from "@/domain/permissions/policy";
import { decisionSubmitSchema } from "@/domain/scenario/schema";
import { getAuthorizationContext } from "@/server/auth/context";
import { createSupabaseServerClient } from "@/server/supabase/server";

export async function POST(request: Request) {
  const auth = await getAuthorizationContext();
  if (!auth) return Response.json({ error: "Authentication required." }, { status: 401 });
  if (!canAny(auth.roles, "decision:submit")) {
    return Response.json({ error: "Decision submission permission required." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = decisionSubmitSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid decision submission.", details: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("submit_scenario_decision", {
    p_scenario_id: parsed.data.scenarioId,
    p_snapshot_id: parsed.data.snapshotId,
    p_title: parsed.data.title,
    p_recommendation: parsed.data.recommendation,
    p_review_trigger: parsed.data.reviewTrigger,
  });

  if (error) {
    const forbidden = error.code === "42501";
    return Response.json(
      { error: forbidden ? "Decision submission permission denied." : error.message || "Unable to submit the decision." },
      { status: forbidden ? 403 : 400 },
    );
  }

  return Response.json(data, { status: 201 });
}
