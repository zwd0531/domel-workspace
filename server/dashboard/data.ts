import { z } from "zod";
import type { AuthorizationContext } from "@/server/auth/context";
import { createSupabaseServerClient } from "@/server/supabase/server";
import type { DashboardData, DashboardProduct, DashboardRow } from "@/domain/dashboard/types";
import { DASHBOARD_MONTHS } from "@/domain/dashboard/constants";
import { resolveDashboardRole } from "@/domain/dashboard/role";
import { isDemoMode } from "@/server/demo/config";
import { loadDemoDashboardData } from "@/server/demo/database";

const productSchema = z.object({
  id: z.string(), code: z.string(), name: z.string(), family: z.string(), application: z.string(), owner_label: z.string().nullable(),
});
const salesSchema = z.object({
  product_id: z.string(), month: z.string(), order_count: z.coerce.number(), shipped_units: z.coerce.number(), unit_price: z.coerce.number(), currency: z.string(),
});
const productionSchema = z.object({
  product_id: z.string(), month: z.string(), planned_units: z.coerce.number(), produced_units: z.coerce.number(), on_time_rate: z.coerce.number().nullable(),
});
const qualitySchema = z.object({
  product_id: z.string(), month: z.string(), tested_units: z.coerce.number(), passed_units: z.coerce.number(), field_returns: z.coerce.number(), defect_rate: z.coerce.number().nullable(), risk: z.enum(["Low", "Medium", "High"]), quality_note: z.string().nullable(),
});
const workItemSchema = z.object({
  id: z.string(), product_id: z.string().nullable(), title: z.string(), action: z.string(), priority: z.enum(["Low", "Medium", "High"]), due_at: z.string().nullable(), status: z.enum(["open", "completed", "cancelled"]),
});

export async function loadDashboardData(
  auth: AuthorizationContext,
  filters: { month?: string; productId?: string | null },
): Promise<DashboardData> {
  const role = resolveDashboardRole(auth.roles);
  if (!role) throw new Error("No dashboard role is assigned.");
  if (isDemoMode()) return loadDemoDashboardData(role, filters);

  const month = DASHBOARD_MONTHS.includes(filters.month as (typeof DASHBOARD_MONTHS)[number]) ? filters.month! : "2026-10";
  const databaseMonth = `${month}-01`;
  const supabase = await createSupabaseServerClient();

  const [profileResult, productResult] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", auth.userId).single(),
    supabase.from("products").select("id,code,name,family,application,owner_label").eq("active", true).order("name"),
  ]);

  if (profileResult.error) throw new Error(`Unable to load profile: ${profileResult.error.message}`);
  if (productResult.error) throw new Error(`Unable to load products: ${productResult.error.message}`);

  const products: DashboardProduct[] = z.array(productSchema).parse(productResult.data).map((product) => ({
    id: product.id, code: product.code, name: product.name, family: product.family,
    application: product.application, ownerLabel: product.owner_label,
  }));
  const validProductId = products.some((product) => product.id === filters.productId) ? filters.productId! : null;

  const factTable = role === "sales" ? "monthly_sales" : role === "production_planner" ? "monthly_production" : "monthly_quality";
  const factFields = role === "sales"
    ? "product_id,month,order_count,shipped_units,unit_price,currency"
    : role === "production_planner"
      ? "product_id,month,planned_units,produced_units,on_time_rate"
      : "product_id,month,tested_units,passed_units,field_returns,defect_rate,risk,quality_note";

  let factQuery = supabase.from(factTable).select(factFields).eq("month", databaseMonth);
  if (validProductId) factQuery = factQuery.eq("product_id", validProductId);

  const [factResult, workResult] = await Promise.all([
    factQuery,
    supabase.from("work_items").select("id,product_id,title,action,priority,due_at,status").eq("assigned_role", role).order("due_at"),
  ]);

  if (factResult.error) throw new Error(`Unable to load dashboard facts: ${factResult.error.message}`);
  if (workResult.error) throw new Error(`Unable to load work items: ${workResult.error.message}`);

  const productMap = new Map(products.map((product) => [product.id, product]));
  let rows: DashboardRow[];
  if (role === "sales") {
    rows = z.array(salesSchema).parse(factResult.data).flatMap((fact) => {
      const product = productMap.get(fact.product_id);
      return product ? [{ ...product, month, orderCount: fact.order_count, shippedUnits: fact.shipped_units, unitPrice: fact.unit_price, currency: fact.currency }] : [];
    });
  } else if (role === "production_planner") {
    rows = z.array(productionSchema).parse(factResult.data).flatMap((fact) => {
      const product = productMap.get(fact.product_id);
      return product ? [{ ...product, month, plannedUnits: fact.planned_units, producedUnits: fact.produced_units, onTimeRate: fact.on_time_rate }] : [];
    });
  } else {
    rows = z.array(qualitySchema).parse(factResult.data).flatMap((fact) => {
      const product = productMap.get(fact.product_id);
      return product ? [{ ...product, month, testedUnits: fact.tested_units, passedUnits: fact.passed_units, fieldReturns: fact.field_returns, defectRate: fact.defect_rate, risk: fact.risk, qualityNote: fact.quality_note }] : [];
    });
  }

  return {
    role,
    displayName: String(profileResult.data.display_name),
    products,
    rows,
    workItems: z.array(workItemSchema).parse(workResult.data).map((item) => ({
      id: item.id, productId: item.product_id, title: item.title, action: item.action,
      priority: item.priority, dueAt: item.due_at, status: item.status,
    })),
    month,
    productId: validProductId,
  };
}
