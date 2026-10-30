"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DecisionWorkflow } from "@/components/decisions/decision-workflow";
import { NotificationCenter } from "@/components/notifications/notification-center";
import { EVIDENCE_TOPICS } from "@/domain/intelligence/constants";
import { calculateScenario } from "@/domain/scenario/calculate";
import { interpretScenario } from "@/domain/scenario/interpret";
import type { ScenarioInputs } from "@/domain/scenario/types";
import type { ScenarioWorkspaceData } from "@/domain/scenario/workspace";

const EMPTY_INPUTS: ScenarioInputs = {
  quantity: 0, price: 0, cost: 0, fixed: 0, capacity: 0, capex: 0, demand: 0,
};

const INPUT_FIELDS: Array<{ key: keyof ScenarioInputs; label: string; suffix: string; step?: number }> = [
  { key: "quantity", label: "Baseline units", suffix: "units" },
  { key: "demand", label: "Demand change", suffix: "%", step: 0.1 },
  { key: "price", label: "Unit price", suffix: "EUR", step: 0.01 },
  { key: "cost", label: "Variable unit cost", suffix: "EUR", step: 0.01 },
  { key: "fixed", label: "Monthly fixed cost", suffix: "EUR", step: 0.01 },
  { key: "capacity", label: "Available capacity", suffix: "units" },
  { key: "capex", label: "Proposed capex", suffix: "EUR", step: 0.01 },
];

export function ScenarioWorkspace({
  data,
  selectedScenarioId,
}: {
  data: ScenarioWorkspaceData;
  selectedScenarioId: string | null;
}) {
  const router = useRouter();
  const selected = data.scenarios.find((scenario) => scenario.id === selectedScenarioId) ?? null;
  const initialProduct = selected?.productId ?? data.products.find((product) => product.baseline)?.id ?? data.products[0]?.id ?? "";
  const latest = selected?.snapshots[0];
  const [productId, setProductId] = useState(initialProduct);
  const [name, setName] = useState(selected?.name ?? "October demand and capacity review");
  const [inputs, setInputs] = useState<ScenarioInputs>(latest?.inputs ?? data.products.find((product) => product.id === initialProduct)?.baseline ?? EMPTY_INPUTS);
  const [rationale, setRationale] = useState(latest?.rationale ?? "");
  const [evidenceIds, setEvidenceIds] = useState<string[]>(selected?.evidenceIds ?? []);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [creatingEvidence, setCreatingEvidence] = useState(false);

  const product = data.products.find((item) => item.id === productId) ?? null;
  const result = useMemo(() => calculateScenario(inputs), [inputs]);
  const linkedTopics = data.evidence.filter((item) => evidenceIds.includes(item.id)).map((item) => item.topic);
  const interpretation = useMemo(() => interpretScenario(inputs, result, linkedTopics), [inputs, result, linkedTopics]);
  const canEdit = !selected || ((selected.ownerId === data.userId || data.roles.includes("admin")) && ["draft", "rejected"].includes(selected.status));

  function chooseProduct(nextProductId: string) {
    setProductId(nextProductId);
    const baseline = data.products.find((item) => item.id === nextProductId)?.baseline;
    setInputs(baseline ?? EMPTY_INPUTS);
  }

  function updateInput(key: keyof ScenarioInputs, value: string) {
    const numeric = value === "" ? 0 : Number(value);
    const finite = Number.isFinite(numeric) ? numeric : 0;
    const bounded = key === "demand" ? Math.min(200, Math.max(-100, finite)) : Math.min(1_000_000_000, Math.max(0, finite));
    const normalized = key === "quantity" || key === "capacity" ? Math.round(bounded) : bounded;
    setInputs((current) => ({ ...current, [key]: normalized }));
  }

  async function saveScenario() {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioId: selected?.id ?? null,
          productId,
          businessMonth: selected?.businessMonth ?? data.businessMonth,
          name,
          inputs,
          rationale,
          evidenceIds,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to save the scenario.");
      setMessage({ tone: "ok", text: `Snapshot v${payload.version} saved with formula ${payload.result.formulaVersion}.` });
      router.push(`/scenarios?scenario=${payload.scenarioId}`);
      router.refresh();
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Unable to save the scenario." });
    } finally {
      setSaving(false);
    }
  }

  async function createEvidence(formData: FormData) {
    setCreatingEvidence(true);
    setMessage(null);
    try {
      const response = await fetch("/api/evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.get("title"),
          publisher: formData.get("publisher"),
          sourceUrl: formData.get("sourceUrl"),
          publishedOn: formData.get("publishedOn") || null,
          topic: formData.get("topic"),
          fact: formData.get("fact"),
          interpretation: formData.get("interpretation"),
          limitations: formData.get("limitations"),
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to create evidence.");
      setEvidenceIds((current) => [...new Set([...current, payload.id])]);
      setMessage({ tone: "ok", text: "Evidence created. Save the scenario to attach it to this snapshot." });
      router.refresh();
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Unable to create evidence." });
    } finally {
      setCreatingEvidence(false);
    }
  }

  return (
    <main id="main" className="scenario-main">
      <div className="page-head">
        <div><span className="eyebrow">02 / DECISION MODELLING</span><h1>Scenario planning workspace</h1><p className="lead">Test a controlled assumption, connect supporting evidence and preserve a server-recalculated snapshot.</p></div>
        <div className="button-row"><Link className="btn" href="/scenarios">＋ New scenario</Link><button className="btn primary" type="button" onClick={saveScenario} disabled={!canEdit || saving || !productId || !name.trim()}>{saving ? "Saving…" : selected ? "Save new snapshot" : "Create scenario"}</button></div>
      </div>

      {message ? <div className={`scenario-message ${message.tone}`} role="status">{message.text}</div> : null}
      {selected && !canEdit ? <div className="scenario-message error">This scenario is read-only because it belongs to another Decision Owner or its workflow status is {selected.status}.</div> : null}
      <NotificationCenter data={data} />

      <div className="scenario-layout">
        <aside className="panel scenario-library">
          <div className="panel-head"><h2>Saved scenarios</h2><p>Open a record to load its latest immutable snapshot.</p></div>
          <div className="scenario-list">
            {data.scenarios.length ? data.scenarios.map((scenario) => (
              <Link key={scenario.id} className={scenario.id === selected?.id ? "active" : ""} href={`/scenarios?scenario=${scenario.id}`}>
                <strong>{scenario.name}</strong><span>{data.products.find((item) => item.id === scenario.productId)?.name ?? "Product"}</span><small>v{scenario.version} · {scenario.status}</small>
              </Link>
            )) : <p className="small muted empty-state">No snapshots yet. Create the first controlled scenario.</p>}
          </div>
        </aside>

        <section className="scenario-editor">
          <section className="panel panel-pad">
            <div className="row"><div><h2>Assumptions</h2><p className="small muted">The current database facts provide the baseline; only this scenario copy changes.</p></div><span className="badge blue">Formula 2.0.0</span></div>
            <div className="scenario-meta-grid">
              <label className="field"><span>Scenario name</span><input value={name} maxLength={120} onChange={(event) => setName(event.target.value)} disabled={!canEdit} /></label>
              <label className="field"><span>Product</span><select value={productId} onChange={(event) => chooseProduct(event.target.value)} disabled={!canEdit || Boolean(selected)}>{data.products.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.code}</option>)}</select></label>
              <div className="field"><span>Business month</span><div className="read-only-value">{(selected?.businessMonth ?? data.businessMonth).slice(0, 7)}</div></div>
            </div>
            {!product?.baseline ? <div className="notice"><span>ⓘ</span><span>This product has no complete sales, capacity and cost baseline for the selected month.</span></div> : null}
            <div className="scenario-input-grid">{INPUT_FIELDS.map((field) => <label className="field" key={field.key}><span>{field.label}</span><div className="number-field"><input type="number" min={field.key === "demand" ? -100 : 0} max={field.key === "demand" ? 200 : 1_000_000_000} step={field.step ?? 1} value={inputs[field.key]} onChange={(event) => updateInput(field.key, event.target.value)} disabled={!canEdit} /><small>{field.suffix}</small></div></label>)}</div>
            <label className="field scenario-rationale"><span>Rationale and conditions</span><textarea value={rationale} maxLength={2000} rows={4} onChange={(event) => setRationale(event.target.value)} placeholder="Explain why these assumptions are reasonable and what would trigger a review." disabled={!canEdit} /></label>
          </section>

          <section className="panel panel-pad scenario-results">
            <div className="row"><div><h2>Calculated outcome</h2><p className="small muted">Live browser preview. The database recalculates the same inputs before storage.</p></div><span className="badge green">Server verified on save</span></div>
            <div className="result-grid">
              <Result label="Units sold" value={number(result.units)} />
              <Result label="Revenue" value={money(result.revenue)} />
              <Result label="Gross profit" value={money(result.grossProfit)} />
              <Result label="Operating profit" value={money(result.operatingProfit)} emphasis />
              <Result label="Gross margin" value={percent(result.grossMargin)} />
              <Result label="Capacity use" value={percent(result.capacityUtilization)} />
              <Result label="Unserved demand" value={number(result.unservedDemand)} />
              <Result label="Proposed capex" value={money(result.capex)} />
            </div>
            <div className="interpretation-grid"><Interpretation title="Rule-based risks" items={interpretation.risks} empty="No formula risk rule is currently triggered." /><Interpretation title="Evidence gaps" items={interpretation.evidenceGaps} empty="No evidence gap rule is currently triggered." /></div>
          </section>

          <EvidencePanel data={data} evidenceIds={evidenceIds} setEvidenceIds={setEvidenceIds} canEdit={canEdit} createEvidence={createEvidence} creating={creatingEvidence} />
          <DecisionWorkflow data={data} scenario={selected} />
        </section>

        <aside className="panel scenario-history">
          <div className="panel-head"><h2>Snapshot history</h2><p>Stored inputs and outputs are immutable.</p></div>
          <div className="history-list">{selected?.snapshots.length ? selected.snapshots.map((snapshot, index) => <article key={snapshot.id}><span className="badge">v{selected.version - index}</span><strong>{new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(snapshot.createdAt))}</strong><small>{money(snapshot.result.operatingProfit)} operating profit</small><small>Formula {snapshot.formulaVersion}</small>{snapshot.rationale ? <p>{snapshot.rationale}</p> : null}</article>) : <p className="small muted empty-state">Save the scenario to create its first immutable snapshot.</p>}</div>
        </aside>
      </div>
    </main>
  );
}

function Result({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) {
  return <div className={emphasis ? "result emphasis" : "result"}><span>{label}</span><strong>{value}</strong></div>;
}

function Interpretation({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return <div><h3>{title}</h3>{items.length ? <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul> : <p className="small muted">{empty}</p>}</div>;
}

function EvidencePanel({
  data,
  evidenceIds,
  setEvidenceIds,
  canEdit,
  createEvidence,
  creating,
}: {
  data: ScenarioWorkspaceData;
  evidenceIds: string[];
  setEvidenceIds: (ids: string[]) => void;
  canEdit: boolean;
  createEvidence: (formData: FormData) => Promise<void>;
  creating: boolean;
}) {
  function toggle(id: string) {
    setEvidenceIds(evidenceIds.includes(id) ? evidenceIds.filter((item) => item !== id) : [...evidenceIds, id]);
  }
  return <section className="panel panel-pad evidence-panel"><div className="row"><div><h2>Evidence bridge</h2><p className="small muted">Attach traceable external facts to the scenario rather than treating them as operating data.</p></div><span className="badge blue">{evidenceIds.length} linked</span></div><div className="evidence-list">{data.evidence.length ? data.evidence.map((item) => <label key={item.id} className={evidenceIds.includes(item.id) ? "evidence-card selected" : "evidence-card"}><input type="checkbox" checked={evidenceIds.includes(item.id)} onChange={() => toggle(item.id)} disabled={!canEdit} /><span><span className="row"><strong>{item.title}</strong><span className="badge">{item.topic}</span></span><small>{item.publisher}{item.publishedOn ? ` · ${item.publishedOn}` : ""} · {item.verificationStatus}</small><p>{item.fact}</p><a href={item.sourceUrl} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>Open source ↗</a></span></label>) : <p className="small muted empty-state">No evidence records exist yet. Add the first source below.</p>}</div><details className="evidence-create"><summary>＋ Add a controlled evidence record</summary><form action={createEvidence}><div className="scenario-meta-grid"><label className="field"><span>Title</span><input name="title" required maxLength={180} /></label><label className="field"><span>Publisher</span><input name="publisher" required maxLength={120} /></label><label className="field"><span>Topic</span><select name="topic" defaultValue="Demand">{EVIDENCE_TOPICS.map((topic) => <option key={topic}>{topic}</option>)}</select></label><label className="field"><span>Source URL</span><input name="sourceUrl" type="url" required placeholder="https://" /></label><label className="field"><span>Published date</span><input name="publishedOn" type="date" /></label></div><div className="evidence-text-grid"><label className="field"><span>Verifiable fact</span><textarea name="fact" required rows={3} maxLength={2000} /></label><label className="field"><span>Interpretation</span><textarea name="interpretation" required rows={3} maxLength={2000} /></label><label className="field"><span>Limitations</span><textarea name="limitations" required rows={3} maxLength={2000} /></label></div><button className="btn" type="submit" disabled={!canEdit || creating}>{creating ? "Adding…" : "Add evidence"}</button></form></details></section>;
}

function number(value: number) { return new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 }).format(value); }
function money(value: number) { return new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value); }
function percent(value: number | null) { return value === null ? "N/A" : `${(value * 100).toFixed(1)}%`; }
