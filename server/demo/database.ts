import "server-only";

import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { calculateScenario } from "@/domain/scenario/calculate";
import type { DashboardData, DashboardProduct, DashboardRole, DashboardRow, WorkItem } from "@/domain/dashboard/types";
import type { IntelligenceData, IntelligenceEvidence } from "@/domain/intelligence/types";
import type { AdminWorkspaceData } from "@/domain/admin/types";
import type { AssumptionAnalysisEngine, AssumptionAnalysisRequest, ScenarioAssumptionAnalysis } from "@/domain/ai/assumption-analysis";
import type { AppRole } from "@/domain/permissions/policy";
import type { ScenarioInputs } from "@/domain/scenario/types";
import type { ScenarioWorkspaceData } from "@/domain/scenario/workspace";
import type { IntelligenceResearchResult } from "@/domain/intelligence/research";
import { DEMO_USER_ID } from "@/server/demo/config";
import { salesTotalsByCurrency } from "@/domain/dashboard/analysis";

const DEMO_DISPLAY_NAME = "Domel Demo Administrator";
const DEMO_ROLES: AppRole[] = ["production_planner", "quality_engineer", "decision_owner", "admin"];
const BUSINESS_MONTH = "2026-10-01";

let database: DatabaseSync | null = null;

function getDatabase() {
  if (database) return database;
  const directory = join(process.cwd(), "data");
  mkdirSync(directory, { recursive: true });
  database = new DatabaseSync(join(directory, "domel-demo.sqlite"));
  database.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
  migrate(database);
  seed(database);
  return database;
}

function migrate(db: DatabaseSync) {
  db.exec(`
    create table if not exists products (
      id text primary key, code text not null, name text not null, family text not null,
      application text not null, owner_label text
    );
    create table if not exists monthly_facts (
      product_id text primary key references products(id), month text not null,
      order_count integer not null, shipped_units integer not null, unit_price real not null,
      planned_units integer not null, produced_units integer not null, on_time_rate real,
      tested_units integer not null, passed_units integer not null, field_returns integer not null,
      defect_rate real, risk text not null, quality_note text,
      variable_cost real not null, fixed_cost real not null
    );
    create table if not exists work_items (
      id text primary key, product_id text, assigned_role text not null, title text not null,
      action text not null, priority text not null, due_at text, status text not null
    );
    create table if not exists evidence_records (
      id text primary key, title text not null, publisher text not null, source_url text not null,
      published_on text, captured_on text not null, topic text not null, fact text not null,
      interpretation text not null, limitations text not null, verification_status text not null,
      review_note text not null default '', reviewed_at text, created_at text not null
    );
    create table if not exists scenarios (
      id text primary key, product_id text not null, business_month text not null, owner_id text not null,
      name text not null, status text not null, version integer not null, updated_at text not null
    );
    create table if not exists scenario_snapshots (
      id text primary key, scenario_id text not null references scenarios(id) on delete cascade,
      inputs text not null, result text not null, formula_version text not null,
      rationale text not null, created_by text not null, created_at text not null
    );
    create table if not exists scenario_evidence (
      scenario_id text not null, evidence_id text not null, primary key (scenario_id, evidence_id)
    );
    create table if not exists ai_analyses (
      id text primary key, scenario_id text not null, snapshot_id text, input_text text not null,
      analysis text not null, engine text not null, model text, created_at text not null
    );
    create table if not exists research_runs (
      id text primary key, brief text not null, search_query text not null, result text not null,
      engine text not null, model text, created_at text not null
    );
  `);
}

function seed(db: DatabaseSync) {
  const count = Number((db.prepare("select count(*) as count from products").get() as { count: number }).count);
  if (count) return;
  const now = "2026-10-30T08:00:00.000Z";
  db.exec("BEGIN");
  try {
    const product = db.prepare("insert into products values (?, ?, ?, ?, ?, ?)");
    product.run("20000000-0000-0000-0000-000000000001", "ECM-180", "EC Ventilation Motor 180", "EC motors", "HVAC ventilation", "HVAC programme");
    product.run("20000000-0000-0000-0000-000000000002", "VAC-900", "Vacuum Motor 900", "Vacuum motors", "Household vacuum", "Vacuum programme");
    product.run("20000000-0000-0000-0000-000000000003", "BLW-240", "Compact Blower 240", "Blowers", "Air handling", "Blower programme");

    const fact = db.prepare("insert into monthly_facts values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    fact.run("20000000-0000-0000-0000-000000000001", BUSINESS_MONTH, 34, 8200, 86, 9000, 8450, 93.9, 8400, 8232, 18, 2.0, "Medium", "Connector variation remains under review.", 54, 118000);
    fact.run("20000000-0000-0000-0000-000000000002", BUSINESS_MONTH, 27, 6500, 72, 7000, 6720, 96.0, 6680, 6613, 11, 1.0, "Low", "Stable outgoing inspection result.", 45, 96000);
    fact.run("20000000-0000-0000-0000-000000000003", BUSINESS_MONTH, 19, 4100, 64, 4800, 4300, 89.6, 4260, 4132, 21, 3.0, "High", "Bearing noise requires supplier follow-up.", 41, 72000);

    const task = db.prepare("insert into work_items values (?, ?, ?, ?, ?, ?, ?, ?)");
    task.run("30000000-0000-0000-0000-000000000001", "20000000-0000-0000-0000-000000000001", "production_planner", "Confirm November capacity", "Review the EC motor demand scenario against the current line plan.", "High", "2026-11-03T09:00:00.000Z", "open");
    task.run("30000000-0000-0000-0000-000000000002", "20000000-0000-0000-0000-000000000003", "production_planner", "Resolve blower backlog", "Coordinate the revised bearing delivery with production sequencing.", "Medium", "2026-11-05T09:00:00.000Z", "open");

    const evidence = db.prepare("insert into evidence_records values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    evidence.run("40000000-0000-0000-0000-000000000001", "EU building renovation demand signal", "European Commission", "https://energy.ec.europa.eu/topics/energy-efficiency/energy-efficient-buildings_en", "2026-09-15", "2026-10-30", "Demand", "EU building-efficiency policy continues to support renovation and ventilation investment.", "Efficient ventilation components may benefit where building renovation activity converts into equipment orders.", "Policy direction does not provide a Domel-specific volume forecast.", "source_reviewed", "Source scope checked for demonstration use.", now, now);
    evidence.run("40000000-0000-0000-0000-000000000002", "Ecodesign requirements for electric motors", "European Commission", "https://energy-efficient-products.ec.europa.eu/ecodesign-and-energy-label/product-list/electric-motors_en", "2026-08-20", "2026-10-30", "Regulation", "EU ecodesign rules establish minimum efficiency requirements for electric motors.", "Higher efficiency requirements can strengthen the relevance of EC motor technology in regulated applications.", "Applicability depends on product class, power range and final-system configuration.", "source_reviewed", "Use the linked regulation page for scope checks.", now, now);
    evidence.run("40000000-0000-0000-0000-000000000003", "European heat-pump market uncertainty", "European Heat Pump Association", "https://www.ehpa.org/market-data/", "2026-10-01", "2026-10-30", "Demand", "Industry reporting indicates that European heat-pump demand differs materially by country and policy environment.", "Ventilation-motor planning should use country-level signals rather than one European growth assumption.", "Heat-pump installations are only an indirect proxy for ventilation motor demand.", "needs_follow_up", "Add Germany-specific 2026 installation data.", now, now);
    evidence.run("40000000-0000-0000-0000-000000000004", "Critical raw materials policy", "European Commission", "https://single-market-economy.ec.europa.eu/sectors/raw-materials/areas-specific-interest/critical-raw-materials_en", "2026-07-10", "2026-10-30", "Supply chain", "EU policy highlights supply resilience for critical raw materials.", "Magnet and electronics sourcing assumptions should be stress-tested in EC motor scenarios.", "The source does not quantify Domel supplier lead times or contract exposure.", "unverified", "", null, now);
    evidence.run("40000000-0000-0000-0000-000000000005", "Energy-efficiency market positioning", "International Energy Agency", "https://www.iea.org/topics/energy-efficiency", "2026-09-01", "2026-10-30", "Technology", "The IEA identifies energy efficiency as a central element of energy-transition strategy.", "Efficiency-led product positioning remains strategically relevant for HVAC components.", "High-level policy evidence cannot validate customer willingness to pay.", "unverified", "", null, now);

    const scenarioId = "50000000-0000-0000-0000-000000000001";
    const inputs: ScenarioInputs = { quantity: 8200, price: 86, cost: 54, fixed: 118000, capacity: 9000, capex: 120000, demand: 12 };
    const result = calculateScenario(inputs);
    db.prepare("insert into scenarios values (?, ?, ?, ?, ?, ?, ?, ?)").run(scenarioId, "20000000-0000-0000-0000-000000000001", BUSINESS_MONTH, DEMO_USER_ID, "Germany HVAC growth case", "draft", 1, now);
    db.prepare("insert into scenario_snapshots values (?, ?, ?, ?, ?, ?, ?, ?)").run("60000000-0000-0000-0000-000000000001", scenarioId, JSON.stringify(inputs), JSON.stringify(result), result.formulaVersion, "Assume 12% demand growth in 2027, supported by building-efficiency policy. Review if order intake falls below 5% growth.", DEMO_USER_ID, now);
    db.prepare("insert into scenario_evidence values (?, ?)").run(scenarioId, "40000000-0000-0000-0000-000000000001");
    db.prepare("insert into scenario_evidence values (?, ?)").run(scenarioId, "40000000-0000-0000-0000-000000000002");
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function loadDemoDashboardData(role: DashboardRole, filters: { month?: string; productId?: string | null }): DashboardData {
  const db = getDatabase();
  const month = filters.month === "2026-09" ? "2026-09" : "2026-10";
  const products = db.prepare("select * from products order by name").all().map((row) => mapProduct(row as ProductRow));
  const productId = filters.productId || null;
  const selectedProduct = products.find((item) => item.id === productId) ?? null;
  const productSelectionInvalid = Boolean(productId && !selectedProduct);
  const facts = db.prepare("select p.*, f.* from products p join monthly_facts f on f.product_id=p.id where f.month=? order by p.name").all(`${month}-01`);
  const rows: DashboardRow[] = facts.map((raw) => {
    const row = raw as ProductFactRow;
    const base = { ...mapProduct(row), month: row.month.slice(0, 7) };
    if (role === "sales") return { ...base, orderCount: row.order_count, shippedUnits: row.shipped_units, unitPrice: row.unit_price, currency: "EUR" };
    if (role === "production_planner") return { ...base, plannedUnits: row.planned_units, producedUnits: row.produced_units, onTimeRate: row.on_time_rate };
    return { ...base, testedUnits: row.tested_units, passedUnits: row.passed_units, fieldReturns: row.field_returns, defectRate: row.defect_rate, risk: row.risk, qualityNote: row.quality_note };
  });
  const workItems = db.prepare("select * from work_items where assigned_role=? order by due_at").all(role).map((raw) => {
    const row = raw as WorkItemRow;
    return { id: row.id, productId: row.product_id, title: row.title, action: row.action, priority: row.priority, dueAt: row.due_at, status: row.status } satisfies WorkItem;
  });
  return { role, displayName: DEMO_DISPLAY_NAME, products, rows: productSelectionInvalid ? [] : productId ? rows.filter(row => row.id === productId) : rows, workItems, month, productId, selectedProduct, productSelectionInvalid, salesTotals: role === "sales" ? salesTotalsByCurrency(rows) : {} };
}

export function toggleDemoWorkItem(id: string) {
  const db = getDatabase();
  db.prepare("update work_items set status=case status when 'completed' then 'open' else 'completed' end where id=?").run(id);
}

export function loadDemoIntelligenceData(): IntelligenceData {
  const db = getDatabase();
  const records = db.prepare(`select e.*, (select count(*) from scenario_evidence se where se.evidence_id=e.id) as linked_count from evidence_records e order by coalesce(published_on, '') desc, created_at desc`).all().map((raw) => mapIntelligenceEvidence(raw as EvidenceRow));
  return { displayName: DEMO_DISPLAY_NAME, roles: DEMO_ROLES, records };
}

export function createDemoEvidence(input: { title: string; publisher: string; sourceUrl: string; publishedOn?: string | null; topic: string; fact: string; interpretation: string; limitations: string }) {
  const id = randomUUID();
  const now = new Date().toISOString();
  getDatabase().prepare("insert into evidence_records values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'unverified', '', null, ?)").run(id, input.title, input.publisher, input.sourceUrl, input.publishedOn ?? null, now.slice(0, 10), input.topic, input.fact, input.interpretation, input.limitations, now);
  return { id, title: input.title };
}

export function reviewDemoEvidence(id: string, status: string, reviewNote: string) {
  const reviewedAt = new Date().toISOString();
  const result = getDatabase().prepare("update evidence_records set verification_status=?, review_note=?, reviewed_at=? where id=?").run(status, reviewNote, reviewedAt, id);
  if (!result.changes) throw new Error("Evidence record not found.");
  return { id, status, reviewedAt };
}

export function loadDemoScenarioWorkspaceData(): ScenarioWorkspaceData {
  const db = getDatabase();
  const products = db.prepare("select p.*, f.* from products p left join monthly_facts f on f.product_id=p.id order by p.name").all().map((raw) => {
    const row = raw as ProductFactRow;
    return { id: row.id, code: row.code, name: row.name, family: row.family, baseline: row.shipped_units === null ? null : { quantity: row.shipped_units, price: row.unit_price, cost: row.variable_cost, fixed: row.fixed_cost, capacity: row.planned_units, capex: 0, demand: 0 } };
  });
  const evidence = db.prepare("select * from evidence_records order by created_at desc").all().map((raw) => {
    const row = raw as EvidenceRow;
    return { id: row.id, title: row.title, publisher: row.publisher, sourceUrl: row.source_url, publishedOn: row.published_on, topic: row.topic, fact: row.fact, interpretation: row.interpretation, limitations: row.limitations, verificationStatus: row.verification_status };
  });
  const scenarios = db.prepare("select * from scenarios order by updated_at desc").all().map((raw) => {
    const row = raw as ScenarioRow;
    const snapshots = db.prepare("select * from scenario_snapshots where scenario_id=? order by created_at desc").all(row.id).map((value) => {
      const snapshot = value as SnapshotRow;
      return { id: snapshot.id, inputs: JSON.parse(snapshot.inputs), result: JSON.parse(snapshot.result), formulaVersion: snapshot.formula_version, rationale: snapshot.rationale, createdAt: snapshot.created_at, createdBy: snapshot.created_by };
    });
    const evidenceIds = db.prepare("select evidence_id from scenario_evidence where scenario_id=?").all(row.id).map((value) => String((value as { evidence_id: string }).evidence_id));
    return { id: row.id, productId: row.product_id, businessMonth: row.business_month, name: row.name, status: row.status, version: row.version, ownerId: row.owner_id, updatedAt: row.updated_at, evidenceIds, snapshots };
  });
  const aiAnalyses = db.prepare("select * from ai_analyses order by created_at desc limit 50").all().map((raw) => {
    const row = raw as AiRow;
    return { id: row.id, scenarioId: row.scenario_id, snapshotId: row.snapshot_id, inputText: row.input_text, analysis: JSON.parse(row.analysis), engine: row.engine, model: row.model, createdAt: row.created_at };
  });
  return { userId: DEMO_USER_ID, displayName: DEMO_DISPLAY_NAME, roles: DEMO_ROLES, businessMonth: BUSINESS_MONTH, products, evidence, scenarios, decisions: [], notifications: [], aiAnalyses } as ScenarioWorkspaceData;
}

export function saveDemoScenario(input: { scenarioId?: string | null; productId: string; businessMonth: string; name: string; inputs: ScenarioInputs; rationale: string; evidenceIds: string[] }) {
  const db = getDatabase();
  const now = new Date().toISOString();
  const scenarioId = input.scenarioId ?? randomUUID();
  const existing = db.prepare("select version from scenarios where id=?").get(scenarioId) as { version: number } | undefined;
  const version = (existing?.version ?? 0) + 1;
  const result = calculateScenario(input.inputs);
  const snapshotId = randomUUID();
  db.exec("BEGIN");
  try {
    if (existing) db.prepare("update scenarios set name=?, version=?, updated_at=? where id=?").run(input.name, version, now, scenarioId);
    else db.prepare("insert into scenarios values (?, ?, ?, ?, ?, 'draft', ?, ?)").run(scenarioId, input.productId, input.businessMonth, DEMO_USER_ID, input.name, version, now);
    db.prepare("insert into scenario_snapshots values (?, ?, ?, ?, ?, ?, ?, ?)").run(snapshotId, scenarioId, JSON.stringify(input.inputs), JSON.stringify(result), result.formulaVersion, input.rationale, DEMO_USER_ID, now);
    db.prepare("delete from scenario_evidence where scenario_id=?").run(scenarioId);
    const link = db.prepare("insert into scenario_evidence values (?, ?)");
    for (const evidenceId of [...new Set(input.evidenceIds)]) link.run(scenarioId, evidenceId);
    db.exec("COMMIT");
  } catch (error) { db.exec("ROLLBACK"); throw error; }
  return { scenarioId, snapshotId, version, result };
}

export function saveDemoAiAnalysis(request: AssumptionAnalysisRequest, analysis: ScenarioAssumptionAnalysis, engine: AssumptionAnalysisEngine, model: string | null) {
  if (!request.scenarioId) return false;
  getDatabase().prepare("insert into ai_analyses values (?, ?, ?, ?, ?, ?, ?, ?)").run(randomUUID(), request.scenarioId, request.snapshotId ?? null, request.text, JSON.stringify(analysis), engine, model, new Date().toISOString());
  return true;
}

export function saveDemoResearchRun(brief: string, result: IntelligenceResearchResult) {
  getDatabase().prepare("insert into research_runs values (?, ?, ?, ?, ?, ?, ?)").run(randomUUID(), brief, result.searchQuery, JSON.stringify(result), result.engine, result.model, new Date().toISOString());
}

export function loadDemoAdminData(): AdminWorkspaceData {
  const db = getDatabase();
  return {
    currentUserId: DEMO_USER_ID, displayName: DEMO_DISPLAY_NAME, roles: DEMO_ROLES,
    plantCount: 1, productCount: Number((db.prepare("select count(*) as count from products").get() as { count: number }).count),
    users: [{ id: DEMO_USER_ID, displayName: DEMO_DISPLAY_NAME, active: true, createdAt: "2026-10-30T08:00:00.000Z", roles: DEMO_ROLES }],
    importRuns: [],
  };
}

function mapProduct(row: ProductRow): DashboardProduct {
  return { id: row.id, code: row.code, name: row.name, family: row.family, application: row.application, ownerLabel: row.owner_label };
}

function mapIntelligenceEvidence(row: EvidenceRow): IntelligenceEvidence {
  return { id: row.id, title: row.title, publisher: row.publisher, sourceUrl: row.source_url, publishedOn: row.published_on, capturedOn: row.captured_on, topic: row.topic, fact: row.fact, interpretation: row.interpretation, limitations: row.limitations, verificationStatus: row.verification_status, reviewNote: row.review_note, reviewedAt: row.reviewed_at, linkedScenarioCount: row.linked_count ?? 0 };
}

type ProductRow = { id: string; code: string; name: string; family: string; application: string; owner_label: string | null };
type ProductFactRow = ProductRow & { month: string; order_count: number; shipped_units: number; unit_price: number; planned_units: number; produced_units: number; on_time_rate: number | null; tested_units: number; passed_units: number; field_returns: number; defect_rate: number | null; risk: "Low" | "Medium" | "High"; quality_note: string | null; variable_cost: number; fixed_cost: number };
type WorkItemRow = { id: string; product_id: string | null; title: string; action: string; priority: "Low" | "Medium" | "High"; due_at: string | null; status: "open" | "completed" | "cancelled" };
type EvidenceRow = { id: string; title: string; publisher: string; source_url: string; published_on: string | null; captured_on: string; topic: IntelligenceEvidence["topic"]; fact: string; interpretation: string; limitations: string; verification_status: IntelligenceEvidence["verificationStatus"]; review_note: string; reviewed_at: string | null; linked_count?: number };
type ScenarioRow = { id: string; product_id: string; business_month: string; owner_id: string; name: string; status: "draft" | "submitted" | "approved" | "rejected" | "archived"; version: number; updated_at: string };
type SnapshotRow = { id: string; inputs: string; result: string; formula_version: string; rationale: string; created_at: string; created_by: string };
type AiRow = { id: string; scenario_id: string; snapshot_id: string | null; input_text: string; analysis: string; engine: AssumptionAnalysisEngine; model: string | null; created_at: string };
