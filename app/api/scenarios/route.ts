import { canAny } from "@/domain/permissions/policy";
import { scenarioSaveSchema } from "@/domain/scenario/schema";
import { getAuthorizationContext } from "@/server/auth/context";
import { createSupabaseServerClient } from "@/server/supabase/server";
import { isDemoMode } from "@/server/demo/config";
import { saveDemoScenario } from "@/server/demo/database";

export async function POST(request: Request) {
  const auth = await getAuthorizationContext();
  if (!auth) return Response.json({ error: "Authentication required." }, { status: 401 });
  if (!canAny(auth.roles, "scenario:save")) {
    return Response.json({ error: "Scenario save permission required." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = scenarioSaveSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid scenario record.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  if (isDemoMode()) {
    try {
      const data = saveDemoScenario({ ...parsed.data, evidenceIds: [...new Set(parsed.data.evidenceIds)] });
      return Response.json(data, { status: parsed.data.scenarioId ? 200 : 201 });
    } catch {
      return Response.json({ error: "Unable to save the local demonstration scenario." }, { status: 400 });
    }
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("save_scenario_snapshot", {
    p_scenario_id: parsed.data.scenarioId ?? null,
    p_product_id: parsed.data.productId,
    p_business_month: parsed.data.businessMonth,
    p_name: parsed.data.name,
    p_inputs: parsed.data.inputs,
    p_rationale: parsed.data.rationale,
    p_evidence_ids: [...new Set(parsed.data.evidenceIds)],
  });

  if (error) {
    const forbidden = error.code === "42501";
    return Response.json(
      { error: forbidden ? "Scenario save permission denied." : "Unable to save the scenario snapshot." },
      { status: forbidden ? 403 : 400 },
    );
  }

  return Response.json(data, { status: parsed.data.scenarioId ? 200 : 201 });
}
