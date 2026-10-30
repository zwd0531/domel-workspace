import { canAny } from "@/domain/permissions/policy";
import { evidenceCsv, filterEvidence } from "@/domain/intelligence/filter";
import { getAuthorizationContext } from "@/server/auth/context";
import { loadIntelligenceData } from "@/server/intelligence/data";

export async function GET(request: Request) {
  const auth = await getAuthorizationContext();
  if (!auth) return Response.json({ error: "Authentication required." }, { status: 401 });
  if (!canAny(auth.roles, "evidence:read")) {
    return Response.json({ error: "Evidence read permission required." }, { status: 403 });
  }

  const url = new URL(request.url);
  const records = filterEvidence((await loadIntelligenceData(auth)).records, {
    query: url.searchParams.get("query") ?? "",
    topic: url.searchParams.get("topic") ?? "All",
    status: url.searchParams.get("status") ?? "All",
  });

  return new Response(`\uFEFF${evidenceCsv(records)}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="Domel-industry-intelligence.csv"',
      "Cache-Control": "private, no-store",
    },
  });
}
