import { assumptionAnalysisRequestSchema } from "@/domain/ai/assumption-analysis";
import { canAny } from "@/domain/permissions/policy";
import { analyzeScenarioAssumptions } from "@/server/ai/analyze-assumptions";
import { getAuthorizationContext } from "@/server/auth/context";
import { createSupabaseServerClient } from "@/server/supabase/server";

export async function POST(request: Request) {
  const auth = await getAuthorizationContext();
  if (!auth) return Response.json({ error: "Authentication required." }, { status: 401 });
  if (!canAny(auth.roles, "scenario:calculate")) {
    return Response.json({ error: "Scenario analysis permission required." }, { status: 403 });
  }

  const parsed = assumptionAnalysisRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Enter at least 10 characters of scenario assumptions.", details: parsed.error.flatten() }, { status: 400 });
  }

  const run = await analyzeScenarioAssumptions(parsed.data);
  let saved = false;
  let saveWarning: string | null = null;
  if (parsed.data.scenarioId) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("scenario_ai_analyses").insert({
      scenario_id: parsed.data.scenarioId,
      snapshot_id: parsed.data.snapshotId ?? null,
      input_text: parsed.data.text,
      analysis: run.analysis,
      engine: run.engine,
      model: run.model,
      created_by: auth.userId,
    });
    saved = !error;
    if (error) saveWarning = "The analysis completed but could not be added to history.";
  }

  return Response.json({ ...run, saved, saveWarning });
}
