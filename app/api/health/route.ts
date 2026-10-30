import { FORMULA_VERSION } from "@/domain/scenario/calculate";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    status: "ok",
    service: "domel-workspace",
    formulaVersion: FORMULA_VERSION,
    checkedAt: new Date().toISOString(),
  });
}
