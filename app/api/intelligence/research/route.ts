import { researchBriefSchema } from "@/domain/intelligence/research";
import { canAny } from "@/domain/permissions/policy";
import { getAuthorizationContext } from "@/server/auth/context";
import { ResearchAgentError, runIntelligenceResearch } from "@/server/intelligence/research-agent";
import { createSupabaseServerClient } from "@/server/supabase/server";

export async function POST(request: Request) {
  const auth = await getAuthorizationContext();
  if (!auth) return Response.json({ error: "Authentication required." }, { status: 401 });
  if (!canAny(auth.roles, "evidence:read")) {
    return Response.json({ error: "Industry intelligence permission required." }, { status: 403 });
  }

  const parsed = researchBriefSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Enter a research brief between 10 and 800 characters.", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const result = await runIntelligenceResearch(parsed.data.brief);
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("intelligence_research_runs").insert({
      brief: parsed.data.brief,
      search_query: result.searchQuery,
      result,
      engine: result.engine,
      model: result.model,
      created_by: auth.userId,
    });

    return Response.json({
      result,
      saved: !error,
      saveWarning: error ? "Research completed, but this run could not be added to database history." : null,
    });
  } catch (error) {
    if (error instanceof ResearchAgentError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    return Response.json({ error: "The research agent could not complete this brief." }, { status: 502 });
  }
}
