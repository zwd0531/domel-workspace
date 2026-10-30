"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ScenarioAssumptionAnalysis } from "@/domain/ai/assumption-analysis";
import type { ScenarioInputs } from "@/domain/scenario/types";
import type { SavedScenario, ScenarioAiAnalysisRecord } from "@/domain/scenario/workspace";

type AnalysisResponse = {
  analysis: ScenarioAssumptionAnalysis;
  engine: "openai" | "local_rules";
  model: string | null;
  fallbackReason: string | null;
  saved: boolean;
  saveWarning: string | null;
};

export function AiAssumptionPanel({
  scenario,
  analyses,
  text,
  inputs,
  canEdit,
  onTextChange,
  onApplyInputs,
}: {
  scenario: SavedScenario | null;
  analyses: ScenarioAiAnalysisRecord[];
  text: string;
  inputs: ScenarioInputs;
  canEdit: boolean;
  onTextChange: (text: string) => void;
  onApplyInputs: (inputs: ScenarioInputs) => void;
}) {
  const router = useRouter();
  const latest = scenario ? analyses.find((item) => item.scenarioId === scenario.id) : null;
  const [result, setResult] = useState<AnalysisResponse | null>(latest ? {
    analysis: latest.analysis,
    engine: latest.engine,
    model: latest.model,
    fallbackReason: null,
    saved: true,
    saveWarning: null,
  } : null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);

  async function analyze() {
    setLoading(true);
    setError(null);
    setApplied(false);
    try {
      const response = await fetch("/api/ai/assumptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          inputs,
          scenarioId: scenario?.id ?? null,
          snapshotId: scenario?.snapshots[0]?.id ?? null,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to analyze these assumptions.");
      setResult(payload);
      if (payload.saved) router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to analyze these assumptions.");
    } finally {
      setLoading(false);
    }
  }

  function applySuggestions() {
    if (!result || !canEdit) return;
    const suggestion = result.analysis.parameterSuggestions;
    onApplyInputs({
      ...inputs,
      demand: suggestion.demandChangePercent ?? inputs.demand,
      price: applyPercent(inputs.price, suggestion.priceChangePercent),
      cost: applyPercent(inputs.cost, suggestion.variableCostChangePercent),
      fixed: applyPercent(inputs.fixed, suggestion.fixedCostChangePercent),
      capacity: Math.round(applyPercent(inputs.capacity, suggestion.capacityChangePercent)),
      capex: suggestion.capexAmount ?? inputs.capex,
    });
    setApplied(true);
  }

  const analysis = result?.analysis;
  const suggestionCount = analysis ? Object.values(analysis.parameterSuggestions).filter((value) => value !== null).length : 0;
  const history = scenario ? analyses.filter((item) => item.scenarioId === scenario.id).slice(0, 3) : [];

  return <section className="panel panel-pad ai-assumption-panel">
    <div className="row"><div><span className="eyebrow">AI ASSUMPTION REVIEW</span><h2>Parse and challenge the scenario narrative</h2><p className="small muted">The analyzer separates explicit assumptions from gaps, suggests parameter changes and leaves final control with the user.</p></div><span className={result?.engine === "openai" ? "badge green" : "badge blue"}>{result ? result.engine === "openai" ? `OpenAI · ${result.model}` : "Local demo mode" : "AI analyzer ready"}</span></div>
    <div className="ai-action-row"><p className="small muted">Uses the rationale text entered above. The local mode recognizes common English and Chinese demand, price, cost, capacity and capex statements.</p><div className="button-row"><button className="btn small" type="button" disabled={!canEdit || loading} onClick={() => onTextChange("Demand is expected to grow 15% in Q1 2027, raw material cost may increase 8%, and capacity will remain unchanged. Review the scenario if demand growth falls below 5%. Source: internal sales forecast.")}>Use example</button><button className="btn primary" type="button" disabled={loading || text.trim().length < 10} onClick={analyze}>{loading ? "Analyzing…" : "Analyze assumptions"}</button></div></div>
    {error ? <div className="scenario-message error">{error}</div> : null}
    {result?.fallbackReason ? <div className="notice"><span>ⓘ</span><span>{result.fallbackReason}</span></div> : null}
    {result?.saveWarning ? <div className="notice"><span>ⓘ</span><span>{result.saveWarning}</span></div> : null}

    {analysis ? <div className="ai-analysis-result">
      <div className="ai-score-card"><div className="ai-score" style={{ "--score": analysis.overallScore } as React.CSSProperties}><strong>{analysis.overallScore}</strong><small>/ 100</small></div><div><span className="badge">{analysis.confidence} confidence</span><p>{analysis.summary}</p></div></div>
      <div className="ai-review-grid"><ReviewList title="Strengths" items={analysis.strengths} tone="good" empty="No clear strength was detected." /><ReviewList title="Concerns" items={analysis.concerns} tone="warn" empty="No immediate concern was detected." /><ReviewList title="Missing information" items={analysis.missingInformation} tone="neutral" empty="No obvious information gap was detected." /></div>

      <div className="ai-assumptions"><div className="row"><h3>Recognized assumptions</h3><span className="badge blue">{analysis.assumptions.length} extracted</span></div>{analysis.assumptions.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>Category</th><th>Statement</th><th>Source phrase</th><th>Value</th><th>Confidence</th></tr></thead><tbody>{analysis.assumptions.map((item, index) => <tr key={`${item.category}-${index}`}><td><span className="badge">{item.category.replace("_", " ")}</span></td><td className="wrap-cell">{item.statement}</td><td className="wrap-cell">“{item.sourcePhrase}”</td><td>{item.value === null ? "—" : `${item.value}${item.unit}`}</td><td>{item.confidence}</td></tr>)}</tbody></table></div> : <p className="small muted">No supported numeric assumption was extracted.</p>}</div>

      <div className="ai-suggestions"><div><h3>Suggested wording</h3><p>{analysis.suggestedRewrite}</p></div><button className="btn small" type="button" disabled={!canEdit} onClick={() => onTextChange(analysis.suggestedRewrite)}>Use this wording</button></div>
      <div className="ai-apply"><div><h3>Scenario parameter suggestions</h3><div className="button-row">{Object.entries(analysis.parameterSuggestions).map(([key, value]) => value === null ? null : <span className="badge blue" key={key}>{parameterLabel(key)} · {formatSuggestion(key, value)}</span>)}</div><p className="small muted">Applying suggestions changes the editable scenario fields only. Save a snapshot separately when satisfied.</p></div><button className="btn" type="button" disabled={!canEdit || !suggestionCount || applied} onClick={applySuggestions}>{applied ? "Applied to fields" : `Apply ${suggestionCount} suggestion${suggestionCount === 1 ? "" : "s"}`}</button></div>
    </div> : <div className="ai-empty"><strong>Turn a narrative into testable assumptions.</strong><p>Enter at least one quantified statement in the rationale field, then run the analysis.</p></div>}

    {history.length ? <details className="ai-history"><summary>Previous analyses ({history.length})</summary><div>{history.map((item) => <article key={item.id}><span className={item.engine === "openai" ? "badge green" : "badge blue"}>{item.engine === "openai" ? item.model ?? "OpenAI" : "Local"}</span><strong>{item.analysis.overallScore}/100</strong><small>{formatDate(item.createdAt)}</small><p>{item.analysis.summary}</p></article>)}</div></details> : null}
  </section>;
}

function ReviewList({ title, items, tone, empty }: { title: string; items: string[]; tone: string; empty: string }) {
  return <div className={tone}><h3>{title}</h3>{items.length ? <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul> : <p className="small muted">{empty}</p>}</div>;
}

function applyPercent(base: number, percentage: number | null) {
  return percentage === null ? base : Math.max(0, base * (1 + percentage / 100));
}

function parameterLabel(key: string) {
  return ({ demandChangePercent: "Demand", priceChangePercent: "Price", variableCostChangePercent: "Unit cost", fixedCostChangePercent: "Fixed cost", capacityChangePercent: "Capacity", capexAmount: "Capex" } as Record<string, string>)[key] ?? key;
}

function formatSuggestion(key: string, value: number) {
  return key === "capexAmount" ? new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value) : `${value > 0 ? "+" : ""}${value}%`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
