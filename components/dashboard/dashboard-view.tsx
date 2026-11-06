import Link from "next/link";
import { toggleWorkItem } from "@/app/actions/dashboard";
import { summarizeDashboard, type DashboardMetric } from "@/domain/dashboard/summary";
import type { DashboardData, DashboardRow } from "@/domain/dashboard/types";
import { formatDashboardMonth } from "@/domain/dashboard/format";
import { ROLE_LABELS } from "@/components/workspace-header";

const ROLE_DESCRIPTIONS = {
  sales: "Orders, prices and customer shipments",
  production_planner: "Plans, output and delivery performance",
  quality_engineer: "Testing, defects and product risks",
};

export function DashboardView({ data, selectedRecord }: { data: DashboardData; selectedRecord?: string }) {
  const metrics = summarizeDashboard(data.role, data.rows);
  const detail = data.rows.find((row) => row.id === selectedRecord);
  const query = new URLSearchParams({ month: data.month });
  query.set("role", data.role);
  if (data.productId) query.set("product", data.productId);

  return (
    <>
      <main id="main">
        <div className="page-head"><div><span className="eyebrow">01 / SUZHOU OPERATIONS</span><h1>Role-based household vacuum dashboard</h1><p className="lead">A focused view of products, orders and quality records for Domel Suzhou employees.</p></div><div className="button-row"><a className="btn" href={`/api/dashboard/export?${query.toString()}`}>⇩ Export view</a><a className="btn primary" href="#work-queue">Demo walkthrough →</a></div></div>
        <div className="dashboard-context"><span className="badge blue">{ROLE_LABELS[data.role]}</span><span className="small muted">{ROLE_DESCRIPTIONS[data.role]}</span><span className="badge green">Server-authorized view</span></div>
        <div className="kpi-grid">{metrics.map((metric) => <Kpi key={metric.label} metric={metric} />)}</div>
        <div className="grid-two"><section className="panel"><div className="panel-head row"><div><h2>{chartTitle(data.role)}</h2><p>{formatDashboardMonth(data.month)} · Suzhou household-appliance programme</p></div><span className="badge">Role view</span></div><div className="contribution">{data.rows.map((row) => <Contribution key={row.id} row={row} role={data.role} rows={data.rows} />)}</div></section><section className="panel panel-pad"><h2>What this role needs next</h2><p className="small muted">{nextStepCopy(data.role)}</p><div className="notice"><span>ⓘ</span><span>The server returns only the dataset authorized for this employee role.</span></div></section></div>
        <WorkQueue data={data} />
        <RoleTable data={data} query={query} />
        <p className="dashboard-note">Scope: Suzhou household vacuum units. Current seed values remain fictional course records until an approved data source is connected.</p>
      </main>
      {detail ? <RecordDetail row={detail} role={data.role} closeQuery={query} /> : null}
    </>
  );
}

function Kpi({ metric }: { metric: DashboardMetric }) {
  const value = metric.kind === "money" ? new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(metric.value) : metric.kind === "percent" ? `${metric.value.toFixed(1)}%` : new Intl.NumberFormat("en-GB").format(metric.value);
  return <article className="kpi"><div className="kpi-top">{metric.label}<span>◌</span></div><div className="kpi-value">{value}</div><div className="kpi-foot">Current filtered reporting scope</div></article>;
}

function Contribution({ row, role, rows }: { row: DashboardRow; role: DashboardData["role"]; rows: DashboardRow[] }) {
  const value = role === "sales" ? row.shippedUnits ?? 0 : role === "production_planner" ? row.producedUnits ?? 0 : row.testedUnits ? ((row.passedUnits ?? 0) / row.testedUnits) * 100 : 0;
  const max = Math.max(...rows.map((item) => role === "sales" ? item.shippedUnits ?? 0 : role === "production_planner" ? item.producedUnits ?? 0 : item.testedUnits ? ((item.passedUnits ?? 0) / item.testedUnits) * 100 : 0), 1);
  const label = role === "quality_engineer" ? `${value.toFixed(1)}%` : new Intl.NumberFormat("en-GB").format(value);
  return <div className="contribution-item"><div className="row small"><strong>{row.name}</strong><span>{label}</span></div><div className="bar-track"><span style={{ width: `${Math.max(4, (value / max) * 100)}%` }} /></div><div className="row tiny muted"><span>{row.family}</span><span>{role === "sales" ? "units shipped" : role === "production_planner" ? "units produced" : "pass rate"}</span></div></div>;
}

function WorkQueue({ data }: { data: DashboardData }) {
  const productMap = new Map(data.products.map((product) => [product.id, product.name]));
  return <section id="work-queue" className="panel panel-pad task-panel"><div className="row"><div><h2>My work queue</h2><p className="small muted">Concrete follow-ups for the {ROLE_LABELS[data.role]}.</p></div><span className="badge amber">{data.workItems.filter((item) => item.status === "open").length} open</span></div><div className="task-list">{data.workItems.length ? data.workItems.map((item) => <article key={item.id} className={`task-item ${item.status === "completed" ? "done" : ""}`}><div className="task-main"><div className="row"><strong>{item.title}</strong><span className={`risk-pill ${item.priority.toLowerCase()}`}>{item.priority}</span></div><p>{item.action}</p><span className="sub">{item.productId ? productMap.get(item.productId) : "General"} · {item.dueAt ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(item.dueAt)) : "No due date"}</span></div><form action={toggleWorkItem}><input type="hidden" name="id" value={item.id} /><button className={`btn small ${item.status === "completed" ? "" : "primary"}`} type="submit">{item.status === "completed" ? "Reopen task" : "Mark complete"}</button></form></article>) : <p className="small muted">No work items are assigned to this role.</p>}</div></section>;
}

function RoleTable({ data, query }: { data: DashboardData; query: URLSearchParams }) {
  return <section className="panel data-section"><div className="panel-head row"><div><h2>{ROLE_LABELS[data.role]} worklist</h2><p>Open a product to view the role-authorized record detail.</p></div><span className="badge blue">{data.rows.length} product records</span></div><div className="table-wrap"><table className="data-table"><thead><tr>{tableHeaders(data.role).map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{data.rows.map((row) => <RoleRow key={row.id} row={row} role={data.role} query={query} />)}</tbody></table></div><div className="table-footer"><span>Domel Electric Motors Suzhou · {formatDashboardMonth(data.month)}</span><span>Source: permission-filtered database</span></div></section>;
}

function RoleRow({ row, role, query }: { row: DashboardRow; role: DashboardData["role"]; query: URLSearchParams }) {
  const detailQuery = new URLSearchParams(query); detailQuery.set("record", row.id);
  const action = <td><Link className="btn small" href={`/dashboard?${detailQuery.toString()}`}>Open record</Link></td>;
  if (role === "sales") return <tr><td><strong>{row.name}</strong><span className="sub">{row.family}</span></td><td>{money(row.unitPrice)}</td><td>{number(row.orderCount)}</td><td>{number(row.shippedUnits)}</td><td>{money((row.shippedUnits ?? 0) * (row.unitPrice ?? 0))}</td>{action}</tr>;
  if (role === "production_planner") { const completion = row.plannedUnits ? ((row.producedUnits ?? 0) / row.plannedUnits) * 100 : 0; return <tr><td><strong>{row.name}</strong><span className="sub">{row.ownerLabel}</span></td><td>{number(row.plannedUnits)}</td><td>{number(row.producedUnits)}</td><td><div className="progress"><span style={{ width: `${Math.min(100, completion)}%` }} /></div><span className="sub">{completion.toFixed(0)}% of plan</span></td><td>{(row.onTimeRate ?? 0).toFixed(1)}%</td><td>{number(Math.max(0, (row.plannedUnits ?? 0) - (row.producedUnits ?? 0)))}</td>{action}</tr>; }
  const pass = row.testedUnits ? ((row.passedUnits ?? 0) / row.testedUnits) * 100 : 0;
  return <tr><td><strong>{row.name}</strong><span className="sub">{row.family}</span></td><td>{pass.toFixed(1)}%</td><td>{(row.defectRate ?? 0).toFixed(1)}%</td><td>{number(row.fieldReturns)}</td><td><span className={`risk-pill ${(row.risk ?? "Low").toLowerCase()}`}>{row.risk}</span></td><td className="wrap-cell">{row.qualityNote}</td>{action}</tr>;
}

function RecordDetail({ row, role, closeQuery }: { row: DashboardRow; role: DashboardData["role"]; closeQuery: URLSearchParams }) {
  const fields = role === "sales" ? [["Unit price", money(row.unitPrice)], ["Orders", number(row.orderCount)], ["Units shipped", number(row.shippedUnits)], ["Sales value", money((row.shippedUnits ?? 0) * (row.unitPrice ?? 0))]] : role === "production_planner" ? [["Planned units", number(row.plannedUnits)], ["Produced units", number(row.producedUnits)], ["On-time rate", `${(row.onTimeRate ?? 0).toFixed(1)}%`], ["Open backlog", number(Math.max(0, (row.plannedUnits ?? 0) - (row.producedUnits ?? 0)))]] : [["Tested units", number(row.testedUnits)], ["Test pass rate", row.testedUnits ? `${(((row.passedUnits ?? 0) / row.testedUnits) * 100).toFixed(1)}%` : "N/A"], ["Defect rate", `${(row.defectRate ?? 0).toFixed(1)}%`], ["Field returns", number(row.fieldReturns)], ["Risk", row.risk ?? "N/A"], ["Quality note", row.qualityNote ?? ""]];
  return <div className="modal-backdrop"><section className="record-modal" role="dialog" aria-modal="true" aria-labelledby="record-title"><div className="modal-head"><div><span className="eyebrow">ROLE-AUTHORIZED RECORD</span><h2 id="record-title">{row.name}</h2></div><Link className="icon-button" aria-label="Close" href={`/dashboard?${closeQuery.toString()}`}>×</Link></div><div className="modal-body"><p className="scope-tag">Suzhou plant · {formatDashboardMonth(row.month)}</p><p className="small muted">{row.family} · {row.application}</p><dl className="definition">{fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><div className="notice"><span>ⓘ</span><span>This detail contains only fields authorized for the {ROLE_LABELS[role]} role.</span></div></div></section></div>;
}

function tableHeaders(role: DashboardData["role"]) { return role === "sales" ? ["Product / family", "Unit price", "Orders", "Units shipped", "Sales value", "Action"] : role === "production_planner" ? ["Product / owner", "Planned", "Produced", "Plan completion", "On-time", "Backlog", "Action"] : ["Product / family", "Test pass", "Defect rate", "Returns", "Risk", "Quality note", "Action"]; }
function chartTitle(role: DashboardData["role"]) { return role === "sales" ? "Units shipped by product" : role === "production_planner" ? "Output by product" : "Test pass rate by product"; }
function nextStepCopy(role: DashboardData["role"]) { return role === "sales" ? "Use product price and shipment data to follow customer orders and flag a change in demand." : role === "production_planner" ? "Use plan completion and on-time delivery to identify a line that needs coordination." : "Use pass rate, returns and risk notes to decide which product needs a quality follow-up."; }
function number(value: number | undefined) { return new Intl.NumberFormat("en-GB").format(value ?? 0); }
function money(value: number | undefined) { return new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value ?? 0); }
