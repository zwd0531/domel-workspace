import { toggleWorkItem } from "@/app/actions/dashboard";
import { summarizeDashboard, type DashboardMetric } from "@/domain/dashboard/summary";
import type { DashboardData, DashboardRow } from "@/domain/dashboard/types";
import { formatDashboardMonth } from "@/domain/dashboard/format";
import { AnalysisLink } from "./analysis-link";
import { ProductAnalysis } from "./product-analysis";
import { dashboardUrl } from "@/domain/dashboard/navigation";
import { known, outstanding, rate, salesValue } from "@/domain/dashboard/analysis";
import { ROLE_LABELS } from "@/components/workspace-header";

const ROLE_DESCRIPTIONS = {
  sales: "Orders, prices and customer shipments",
  production_planner: "Plans, output and delivery performance",
  quality_engineer: "Testing, defects and product risks",
};

export function DashboardView({ data, analysisOpen }: { data: DashboardData; analysisOpen: boolean }) {
  const metrics = summarizeDashboard(data.role, data.rows);

  const query = new URLSearchParams({ month: data.month });
  query.set("role", data.role);
  if (data.productId) query.set("product", data.productId);

  return (
    <>
      <main id="main">
        <div className="page-head"><div><span className="eyebrow">01 / SUZHOU OPERATIONS</span><h1>Role-based household vacuum dashboard</h1><p className="lead">A focused view of products, orders and quality records for Domel Suzhou employees.</p></div><div className="button-row"><a className="btn" href={`/api/dashboard/export?${query.toString()}`}>⇩ Export view</a><a className="btn primary" href="#work-queue">Demo walkthrough →</a></div></div>
        <div className="dashboard-context"><span className="badge blue">{ROLE_LABELS[data.role]}</span><span className="small muted">{ROLE_DESCRIPTIONS[data.role]}</span><span className="badge green">Server-authorized view</span></div>
        {data.productSelectionInvalid ? <div className="notice" role="status">The selected product is unavailable. Choose another product or view all products.</div> : null}
        {data.selectedProduct ? <div className="selected-product-bar"><strong>{data.selectedProduct.name} · {data.selectedProduct.code}</strong><AnalysisLink className="btn primary small" href={dashboardUrl({ role: data.role, month: data.month, product: data.productId, analysis: true }, true)}>View product analysis</AnalysisLink></div> : null}
        {!data.rows.length ? <div className="notice dashboard-empty" role="status">{data.productSelectionInvalid ? "No records are shown for this unavailable selection." : data.selectedProduct ? "No data is recorded for this product in this month." : "No product data is recorded for this month."}</div> : null}
        <div className="kpi-grid">{metrics.map((metric) => <Kpi key={metric.label} metric={metric} currency={data.rows[0]?.currency} />)}</div>
        <div className="grid-two"><section className="panel"><div className="panel-head row"><div><h2>{chartTitle(data.role)}</h2><p>{formatDashboardMonth(data.month)} · Suzhou household-appliance programme</p></div><span className="badge">Role view</span></div><div className="contribution">{data.rows.length ? data.rows.map((row) => <Contribution key={row.id} row={row} role={data.role} rows={data.rows} />) : <p className="small muted">No chart data for this selection.</p>}</div></section><section className="panel panel-pad"><h2>What this role needs next</h2><p className="small muted">{nextStepCopy(data.role)}</p><div className="notice"><span>ⓘ</span><span>The server returns only the dataset authorized for this employee role.</span></div></section></div>
        <WorkQueue data={data} />
        <RoleTable data={data} query={query} />
        {analysisOpen && data.selectedProduct ? <ProductAnalysis product={data.selectedProduct} row={data.rows[0]} role={data.role} month={data.month} salesTotal={data.salesTotals[data.rows[0]?.currency ?? "EUR"] ?? null} /> : null}
        <p className="dashboard-note">Scope: Suzhou household vacuum units. Current seed values remain fictional course records until an approved data source is connected.</p>
      </main>
    </>
  );
}

function Kpi({ metric, currency }: { metric: DashboardMetric; currency?: string }) {
  const value = metric.value === null ? "—" : metric.kind === "money" ? new Intl.NumberFormat("en-IE", { style: "currency", currency: currency ?? "EUR", maximumFractionDigits: 2 }).format(metric.value) : metric.kind === "percent" ? `${metric.value.toFixed(1)}%` : new Intl.NumberFormat("en-GB").format(metric.value);
  return <article className="kpi"><div className="kpi-top">{metric.label}<span>◌</span></div><div className="kpi-value">{value}</div><div className="kpi-foot">{metric.value === null ? "Missing data or rate cannot be calculated" : "Current filtered reporting scope"}</div></article>;
}

function Contribution({ row, role, rows }: { row: DashboardRow; role: DashboardData["role"]; rows: DashboardRow[] }) {
  const metric = (item: DashboardRow) => role === "sales" ? item.shippedUnits : role === "production_planner" ? item.producedUnits : rate(item.passedUnits, item.testedUnits);
  const value = metric(row);
  const max = role === "quality_engineer" ? 100 : Math.max(...rows.map(item => metric(item) ?? 0), 1);
  const label = known(value) ? role === "quality_engineer" ? `${value.toFixed(1)}%` : number(value) : "—";
  return <div className="contribution-item"><div className="row small"><strong>{row.name}</strong><span>{label}</span></div><div className="bar-track"><span style={{ width: `${known(value) ? Math.max(0, value / max * 100) : 0}%` }} /></div><div className="row tiny muted"><span>{row.family}</span><span>{role === "sales" ? "units shipped" : role === "production_planner" ? "units produced" : "pass rate"}</span></div></div>;
}

function WorkQueue({ data }: { data: DashboardData }) {
  const productMap = new Map(data.products.map((product) => [product.id, product.name]));
  return <section id="work-queue" className="panel panel-pad task-panel"><div className="row"><div><h2>My work queue</h2><p className="small muted">Concrete follow-ups for the {ROLE_LABELS[data.role]}.</p></div><span className="badge amber">{data.workItems.filter((item) => item.status === "open").length} open</span></div><div className="task-list">{data.workItems.length ? data.workItems.map((item) => <article key={item.id} className={`task-item ${item.status === "completed" ? "done" : ""}`}><div className="task-main"><div className="row"><strong>{item.title}</strong><span className={`risk-pill ${item.priority.toLowerCase()}`}>{item.priority}</span></div><p>{item.action}</p><span className="sub">{item.productId ? productMap.get(item.productId) : "General"} · {item.dueAt ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(item.dueAt)) : "No due date"}</span></div><form action={toggleWorkItem}><input type="hidden" name="id" value={item.id} /><button className={`btn small ${item.status === "completed" ? "" : "primary"}`} type="submit">{item.status === "completed" ? "Reopen task" : "Mark complete"}</button></form></article>) : <p className="small muted">No work items are assigned to this role.</p>}</div></section>;
}

function RoleTable({ data, query }: { data: DashboardData; query: URLSearchParams }) {
  return <section className="panel data-section"><div className="panel-head row"><div><h2>{ROLE_LABELS[data.role]} worklist</h2><p>Open a product to view its role-based analysis.</p></div><span className="badge blue">{data.rows.length} product records</span></div><div className="table-wrap"><table className="data-table"><thead><tr>{tableHeaders(data.role).map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{data.rows.length ? data.rows.map((row) => <RoleRow key={row.id} row={row} role={data.role} query={query} />) : <tr><td colSpan={tableHeaders(data.role).length}>No records for this selection.</td></tr>}</tbody></table></div><div className="table-footer"><span>Domel Electric Motors Suzhou · {formatDashboardMonth(data.month)}</span><span>Source: permission-filtered database</span></div></section>;
}

function RoleRow({ row, role, query }: { row: DashboardRow; role: DashboardData["role"]; query: URLSearchParams }) {
  const detailQuery = new URLSearchParams(query); detailQuery.set("product", row.id); detailQuery.set("analysis", "1");
  const action = <td><AnalysisLink className="btn small" href={`/dashboard?${detailQuery.toString()}#product-analysis`}>View product analysis</AnalysisLink></td>;
  if (role === "sales") return <tr><td><strong>{row.name}</strong><span className="sub">{row.family}</span></td><td>{money(row.unitPrice, row.currency)}</td><td>{number(row.orderCount)}</td><td>{number(row.shippedUnits)}</td><td>{money(salesValue(row), row.currency)}</td>{action}</tr>;
  if (role === "production_planner") { const completion = rate(row.producedUnits, row.plannedUnits); return <tr><td><strong>{row.name}</strong><span className="sub">{row.ownerLabel}</span></td><td>{number(row.plannedUnits)}</td><td>{number(row.producedUnits)}</td><td><div className="progress"><span style={{ width: `${Math.min(100, completion ?? 0)}%` }} /></div><span className="sub">{completion === null ? "—" : `${completion.toFixed(1)}%`} of plan</span></td><td>{known(row.onTimeRate) ? `${row.onTimeRate.toFixed(1)}%` : "—"}</td><td>{number(outstanding(row))}</td>{action}</tr>; }
  const pass = rate(row.passedUnits, row.testedUnits);
  return <tr><td><strong>{row.name}</strong><span className="sub">{row.family}</span></td><td>{pass === null ? "—" : `${pass.toFixed(1)}%`}</td><td>{known(row.defectRate) ? `${row.defectRate.toFixed(1)}%` : "—"}</td><td>{number(row.fieldReturns)}</td><td><span className={`risk-pill ${(row.risk ?? "Low").toLowerCase()}`}>{row.risk}</span></td><td className="wrap-cell">{row.qualityNote || "Not recorded"}</td>{action}</tr>;
}

function tableHeaders(role: DashboardData["role"]) { return role === "sales" ? ["Product / family", "Unit price", "Orders", "Units shipped", "Sales value", "Action"] : role === "production_planner" ? ["Product / owner", "Planned", "Produced", "Plan completion", "On-time", "Backlog", "Action"] : ["Product / family", "Test pass", "Defect rate", "Returns", "Risk", "Quality note", "Action"]; }
function chartTitle(role: DashboardData["role"]) { return role === "sales" ? "Units shipped by product" : role === "production_planner" ? "Output by product" : "Test pass rate by product"; }
function nextStepCopy(role: DashboardData["role"]) { return role === "sales" ? "Use product price and shipment data to follow customer orders and flag a change in demand." : role === "production_planner" ? "Use plan completion and on-time delivery to identify a line that needs coordination." : "Use pass rate, returns and risk notes to decide which product needs a quality follow-up."; }
function number(value: number | null | undefined) { return known(value) ? new Intl.NumberFormat("en-GB").format(value) : "—"; }
function money(value: number | null | undefined, currency = "EUR") { return known(value) ? new Intl.NumberFormat("en-IE", { style: "currency", currency, maximumFractionDigits: 2 }).format(value) : "—"; }
