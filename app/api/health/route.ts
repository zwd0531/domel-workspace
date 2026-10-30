import { FORMULA_VERSION } from "@/domain/scenario/calculate";
import { isDemoMode } from "@/server/demo/config";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    status: "ok",
    service: "domel-workspace",
    mode: isDemoMode() ? "local_sqlite_demo" : "supabase_formal",
    formulaVersion: FORMULA_VERSION,
    checkedAt: new Date().toISOString(),
  });
}
