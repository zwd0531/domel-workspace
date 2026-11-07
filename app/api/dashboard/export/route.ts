import { getAuthorizationContext } from "@/server/auth/context";
import { loadDashboardData } from "@/server/dashboard/data";
import { outstanding, salesValue } from "@/domain/dashboard/analysis";

export async function GET(request: Request) {
  const auth = await getAuthorizationContext();
  if (!auth) return Response.json({ error: "Authentication required." }, { status: 401 });

  const url = new URL(request.url);
  const data = await loadDashboardData(auth, { month: url.searchParams.get("month") ?? undefined, productId: url.searchParams.get("product"), role: url.searchParams.get("role") });
  const headers = data.role === "sales" ? ["product", "month", "unit_price", "orders", "units_shipped", "sales_value"] : data.role === "production_planner" ? ["product", "month", "planned", "produced", "on_time_rate", "backlog"] : ["product", "month", "tested", "passed", "defect_rate", "field_returns", "risk", "quality_note"];
  const rows = data.rows.map((row) => data.role === "sales" ? [row.name, row.month, row.unitPrice, row.orderCount, row.shippedUnits, salesValue(row)] : data.role === "production_planner" ? [row.name, row.month, row.plannedUnits, row.producedUnits, row.onTimeRate, outstanding(row)] : [row.name, row.month, row.testedUnits, row.passedUnits, row.defectRate, row.fieldReturns, row.risk, row.qualityNote]);
  const csv = `\uFEFF${[headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n")}`;

  return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="domel-${data.role}-${data.month}.csv"`, "Cache-Control": "private, no-store" } });
}

function csvCell(value: unknown) {
  let text = String(value ?? "");
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}
