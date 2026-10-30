import { z } from "zod";
import type { AuthorizationContext } from "@/server/auth/context";
import { createSupabaseServerClient } from "@/server/supabase/server";
import { scenarioInputSchema } from "@/domain/scenario/schema";
import type {
  EvidenceRecord,
  SavedScenario,
  ScenarioSnapshot,
  ScenarioWorkspaceData,
} from "@/domain/scenario/workspace";

const BUSINESS_MONTH = "2026-10-01";

const productSchema = z.object({
  id: z.string(), code: z.string(), name: z.string(), family: z.string(),
});
const salesSchema = z.object({
  product_id: z.string(), shipped_units: z.coerce.number(), unit_price: z.coerce.number(),
});
const productionSchema = z.object({
  product_id: z.string(), planned_units: z.coerce.number(),
});
const costSchema = z.object({
  product_id: z.string(), unit_variable_cost: z.coerce.number(), monthly_fixed_cost: z.coerce.number(),
});
const scenarioRowSchema = z.object({
  id: z.string(), product_id: z.string(), business_month: z.string(), owner_id: z.string(), name: z.string(),
  status: z.enum(["draft", "submitted", "approved", "rejected", "archived"]),
  version: z.coerce.number().int().positive(), updated_at: z.string(),
});
const resultSchema = z.object({
  formulaVersion: z.string(), demandUnits: z.coerce.number(), units: z.coerce.number(), revenue: z.coerce.number(),
  variableCost: z.coerce.number(), grossProfit: z.coerce.number(), operatingProfit: z.coerce.number(),
  grossMargin: z.coerce.number().nullable(), capacityUtilization: z.coerce.number().nullable(),
  unservedDemand: z.coerce.number(), capex: z.coerce.number(),
});
const snapshotRowSchema = z.object({
  id: z.string(), scenario_id: z.string(), created_by: z.string(), inputs: scenarioInputSchema,
  calculated_result: resultSchema, formula_version: z.string(), rationale: z.string(), created_at: z.string(),
});
const evidenceRowSchema = z.object({
  id: z.string(), title: z.string(), publisher: z.string(), source_url: z.string(), published_on: z.string().nullable(),
  topic: z.string(), fact: z.string(), interpretation: z.string(), limitations: z.string(), verification_status: z.string(),
});
const linkRowSchema = z.object({ scenario_id: z.string(), evidence_id: z.string() });

function assertQuery(error: { message: string } | null, label: string) {
  if (error) throw new Error(`${label}: ${error.message}`);
}

export async function loadScenarioWorkspaceData(auth: AuthorizationContext): Promise<ScenarioWorkspaceData> {
  const supabase = await createSupabaseServerClient();
  const [profileResult, productResult, salesResult, productionResult, costResult, scenarioResult, evidenceResult] =
    await Promise.all([
      supabase.from("profiles").select("display_name").eq("id", auth.userId).single(),
      supabase.from("products").select("id,code,name,family").eq("active", true).order("name"),
      supabase.from("monthly_sales").select("product_id,shipped_units,unit_price").eq("month", BUSINESS_MONTH),
      supabase.from("monthly_production").select("product_id,planned_units").eq("month", BUSINESS_MONTH),
      supabase.from("monthly_costs").select("product_id,unit_variable_cost,monthly_fixed_cost").eq("month", BUSINESS_MONTH),
      supabase.from("scenarios").select("id,product_id,business_month,owner_id,name,status,version,updated_at").order("updated_at", { ascending: false }),
      supabase.from("evidence_records").select("id,title,publisher,source_url,published_on,topic,fact,interpretation,limitations,verification_status").order("created_at", { ascending: false }),
    ]);

  assertQuery(profileResult.error, "Unable to load profile");
  assertQuery(productResult.error, "Unable to load products");
  assertQuery(salesResult.error, "Unable to load sales baseline");
  assertQuery(productionResult.error, "Unable to load capacity baseline");
  assertQuery(costResult.error, "Unable to load cost baseline");
  assertQuery(scenarioResult.error, "Unable to load scenarios");
  assertQuery(evidenceResult.error, "Unable to load evidence");

  const scenarioRows = z.array(scenarioRowSchema).parse(scenarioResult.data);
  const scenarioIds = scenarioRows.map((scenario) => scenario.id);
  const [snapshotResult, linkResult] = scenarioIds.length
    ? await Promise.all([
        supabase.from("scenario_snapshots").select("id,scenario_id,created_by,inputs,calculated_result,formula_version,rationale,created_at").in("scenario_id", scenarioIds).order("created_at", { ascending: false }),
        supabase.from("scenario_evidence").select("scenario_id,evidence_id").in("scenario_id", scenarioIds),
      ])
    : [{ data: [], error: null }, { data: [], error: null }];

  assertQuery(snapshotResult.error, "Unable to load scenario snapshots");
  assertQuery(linkResult.error, "Unable to load scenario evidence links");

  const sales = new Map(z.array(salesSchema).parse(salesResult.data).map((row) => [row.product_id, row]));
  const production = new Map(z.array(productionSchema).parse(productionResult.data).map((row) => [row.product_id, row]));
  const costs = new Map(z.array(costSchema).parse(costResult.data).map((row) => [row.product_id, row]));
  const snapshots = z.array(snapshotRowSchema).parse(snapshotResult.data);
  const links = z.array(linkRowSchema).parse(linkResult.data);

  const snapshotMap = new Map<string, ScenarioSnapshot[]>();
  for (const row of snapshots) {
    const existing = snapshotMap.get(row.scenario_id) ?? [];
    existing.push({
      id: row.id,
      inputs: row.inputs,
      result: row.calculated_result,
      formulaVersion: row.formula_version,
      rationale: row.rationale,
      createdAt: row.created_at,
      createdBy: row.created_by,
    });
    snapshotMap.set(row.scenario_id, existing);
  }

  const evidenceMap = new Map<string, string[]>();
  for (const link of links) {
    const existing = evidenceMap.get(link.scenario_id) ?? [];
    existing.push(link.evidence_id);
    evidenceMap.set(link.scenario_id, existing);
  }

  const scenarios: SavedScenario[] = scenarioRows.map((row) => ({
    id: row.id,
    productId: row.product_id,
    businessMonth: row.business_month,
    name: row.name,
    status: row.status,
    version: row.version,
    ownerId: row.owner_id,
    updatedAt: row.updated_at,
    evidenceIds: evidenceMap.get(row.id) ?? [],
    snapshots: snapshotMap.get(row.id) ?? [],
  }));

  const evidence: EvidenceRecord[] = z.array(evidenceRowSchema).parse(evidenceResult.data).map((row) => ({
    id: row.id,
    title: row.title,
    publisher: row.publisher,
    sourceUrl: row.source_url,
    publishedOn: row.published_on,
    topic: row.topic,
    fact: row.fact,
    interpretation: row.interpretation,
    limitations: row.limitations,
    verificationStatus: row.verification_status,
  }));

  return {
    userId: auth.userId,
    displayName: String(profileResult.data?.display_name ?? auth.email ?? "Domel user"),
    roles: auth.roles,
    businessMonth: BUSINESS_MONTH,
    products: z.array(productSchema).parse(productResult.data).map((product) => {
      const sale = sales.get(product.id);
      const plan = production.get(product.id);
      const cost = costs.get(product.id);
      return {
        id: product.id,
        code: product.code,
        name: product.name,
        family: product.family,
        baseline: sale && plan && cost ? {
          quantity: sale.shipped_units,
          price: sale.unit_price,
          cost: cost.unit_variable_cost,
          fixed: cost.monthly_fixed_cost,
          capacity: plan.planned_units,
          capex: 0,
          demand: 0,
        } : null,
      };
    }),
    evidence,
    scenarios,
  };
}
