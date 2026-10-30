"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { EVIDENCE_STATUSES, EVIDENCE_STATUS_LABELS, EVIDENCE_TOPICS, type EvidenceStatus } from "@/domain/intelligence/constants";
import { filterEvidence } from "@/domain/intelligence/filter";
import type { IntelligenceData, IntelligenceEvidence } from "@/domain/intelligence/types";

export function IntelligenceWorkspace({ data }: { data: IntelligenceData }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("All");
  const [status, setStatus] = useState("All");
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [creating, setCreating] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const canWrite = data.roles.includes("decision_owner") || data.roles.includes("admin");
  const visible = useMemo(() => filterEvidence(data.records, { query, topic, status }), [data.records, query, topic, status]);
  const sourceCount = new Set(visible.map((record) => record.publisher)).size;
  const reviewedCount = visible.filter((record) => record.verificationStatus === "source_reviewed").length;
  const linkedCount = visible.filter((record) => record.linkedScenarioCount > 0).length;
  const exportQuery = new URLSearchParams({ query, topic, status });

  async function createEvidence(formData: FormData) {
    setCreating(true);
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
      setMessage({ tone: "ok", text: "Evidence record created as Unverified and written to the audit trail." });
      router.refresh();
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Unable to create evidence." });
    } finally {
      setCreating(false);
    }
  }

  async function reviewEvidence(evidenceId: string, formData: FormData) {
    setReviewingId(evidenceId);
    setMessage(null);
    try {
      const response = await fetch("/api/evidence/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evidenceId,
          status: formData.get("status"),
          reviewNote: formData.get("reviewNote"),
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to review evidence.");
      setMessage({ tone: "ok", text: `Review saved as ${EVIDENCE_STATUS_LABELS[payload.status as EvidenceStatus] ?? payload.status}.` });
      router.refresh();
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Unable to review evidence." });
    } finally {
      setReviewingId(null);
    }
  }

  function clearFilters() {
    setQuery("");
    setTopic("All");
    setStatus("All");
  }

  return (
    <main id="main" className="intelligence-main">
      <div className="page-head">
        <div><span className="eyebrow">03 / EXTERNAL INTELLIGENCE</span><h1>Make sense of the signals.</h1><p className="lead">Search attributed evidence, separate source facts from working interpretation and review what each record cannot prove.</p></div>
        <div className="button-row"><a className="btn" href={`/api/intelligence/export?${exportQuery.toString()}`}>⇩ Export filtered evidence</a>{canWrite ? <a className="btn primary" href="#add-evidence">＋ Add evidence</a> : null}</div>
      </div>

      {message ? <div className={`scenario-message ${message.tone}`} role="status">{message.text}</div> : null}

      <section className="intel-summary" aria-label="Evidence summary">
        <Summary label="Evidence in view" value={visible.length} />
        <Summary label="Source organizations" value={sourceCount} />
        <Summary label="Sources reviewed" value={reviewedCount} />
        <Summary label="Linked in visible scenarios" value={linkedCount} />
      </section>

      <section className="panel panel-pad intelligence-controls" aria-label="Evidence filters">
        <label className="field intelligence-search"><span>Search evidence</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search titles, sources, facts or limitations…" /></label>
        <label className="field"><span>Topic</span><select value={topic} onChange={(event) => setTopic(event.target.value)}><option>All</option>{EVIDENCE_TOPICS.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="field"><span>Review status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option>All</option>{EVIDENCE_STATUSES.map((item) => <option key={item} value={item}>{EVIDENCE_STATUS_LABELS[item]}</option>)}</select></label>
        <button className="btn" type="button" onClick={clearFilters}>Reset</button>
      </section>

      <div className="intelligence-layout">
        <aside className="panel topic-overview">
          <div className="panel-head"><h2>Evidence by topic</h2><p>Record count, not market size.</p></div>
          <div className="topic-bars">{EVIDENCE_TOPICS.map((item) => {
            const count = visible.filter((record) => record.topic === item).length;
            const max = Math.max(1, ...EVIDENCE_TOPICS.map((candidate) => visible.filter((record) => record.topic === candidate).length));
            return <div className="topic-line" key={item}><span>{item}</span><div className="bar-track"><span style={{ width: `${(count / max) * 100}%` }} /></div><strong>{count}</strong></div>;
          })}</div>
          <div className="notice"><span>ⓘ</span><span>“Source reviewed” means the record was checked against the linked text. It is not independent validation of publisher claims.</span></div>
        </aside>

        <section>
          <div className="row intelligence-result-head"><div><h2>Evidence library</h2><p className="small muted">{visible.length} records match the current filters.</p></div><span className="badge blue">Facts · interpretations · limits</span></div>
          <div className="intelligence-list">{visible.length ? visible.map((record) => <EvidenceCard key={record.id} record={record} canWrite={canWrite} reviewing={reviewingId === record.id} reviewEvidence={reviewEvidence} />) : <div className="empty"><h3>No matching evidence</h3><p>Try another topic, status or search phrase.</p><button className="btn" type="button" onClick={clearFilters}>Clear filters</button></div>}</div>
        </section>
      </div>

      {canWrite ? <EvidenceCreateForm createEvidence={createEvidence} creating={creating} /> : <div className="notice"><span>ⓘ</span><span>Your role can read and export the shared evidence library. Creation and review are restricted to Decision Owner and Admin roles.</span></div>}
    </main>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return <article className="panel"><span>{label}</span><strong>{value}</strong></article>;
}

function EvidenceCard({
  record,
  canWrite,
  reviewing,
  reviewEvidence,
}: {
  record: IntelligenceEvidence;
  canWrite: boolean;
  reviewing: boolean;
  reviewEvidence: (evidenceId: string, formData: FormData) => Promise<void>;
}) {
  const badgeClass = record.verificationStatus === "source_reviewed" ? "green" : record.verificationStatus === "rejected" ? "red" : "amber";
  return <article className="panel intelligence-card"><div className="evidence-meta"><span className="badge blue">{record.topic}</span><span className={`badge ${badgeClass}`}>{EVIDENCE_STATUS_LABELS[record.verificationStatus]}</span><span>{record.publisher}</span>{record.linkedScenarioCount ? <span className="badge">{record.linkedScenarioCount} scenario link{record.linkedScenarioCount === 1 ? "" : "s"}</span> : null}</div><h3>{record.title}</h3><p className="evidence-fact">{record.fact}</p><details><summary>Review interpretation and limitations</summary><div className="evidence-review-grid"><div><span className="eyebrow">WORKING INTERPRETATION</span><p>{record.interpretation}</p></div><div className="evidence-limit"><span className="eyebrow">LIMITS & MISSING INFORMATION</span><p>{record.limitations}</p></div></div>{record.reviewNote ? <div className="review-note"><strong>Reviewer note</strong><p>{record.reviewNote}</p>{record.reviewedAt ? <small>{formatDateTime(record.reviewedAt)}</small> : null}</div> : null}</details><div className="card-bottom"><span className="tiny muted">Published: {record.publishedOn ? formatDate(record.publishedOn) : "Not stated"} · Captured: {formatDate(record.capturedOn)}</span><div className="button-row"><a className="btn small" href={record.sourceUrl} target="_blank" rel="noreferrer">Open source ↗</a><a className="btn small" href="/scenarios">Use in scenario →</a></div></div>{canWrite ? <form key={`${record.verificationStatus}:${record.reviewNote}`} className="evidence-review-form" action={(formData) => reviewEvidence(record.id, formData)}><label className="field"><span>Review status</span><select name="status" defaultValue={record.verificationStatus}>{EVIDENCE_STATUSES.map((item) => <option key={item} value={item}>{EVIDENCE_STATUS_LABELS[item]}</option>)}</select></label><label className="field review-note-field"><span>Review note</span><input name="reviewNote" defaultValue={record.reviewNote} maxLength={2000} placeholder="Required for follow-up or rejection" /></label><button className="btn small" type="submit" disabled={reviewing}>{reviewing ? "Saving…" : "Save review"}</button></form> : null}</article>;
}

function EvidenceCreateForm({ createEvidence, creating }: { createEvidence: (formData: FormData) => Promise<void>; creating: boolean }) {
  return <section id="add-evidence" className="panel panel-pad intelligence-create"><div><span className="eyebrow">CONTROLLED INPUT</span><h2>Add an evidence record</h2><p className="small muted">New records start as Unverified. Preserve the distinction between what the source says, your interpretation and what remains unknown.</p></div><form action={createEvidence}><div className="scenario-meta-grid"><label className="field"><span>Title</span><input name="title" required maxLength={180} /></label><label className="field"><span>Publisher</span><input name="publisher" required maxLength={120} /></label><label className="field"><span>Topic</span><select name="topic" defaultValue="Demand">{EVIDENCE_TOPICS.map((item) => <option key={item}>{item}</option>)}</select></label><label className="field"><span>Original source URL</span><input name="sourceUrl" type="url" required placeholder="https://" /></label><label className="field"><span>Published date</span><input name="publishedOn" type="date" /></label></div><div className="evidence-text-grid"><label className="field"><span>Source fact / paraphrase</span><textarea name="fact" required rows={4} maxLength={2000} /></label><label className="field"><span>Working interpretation</span><textarea name="interpretation" required rows={4} maxLength={2000} /></label><label className="field"><span>Limitations and missing information</span><textarea name="limitations" required rows={4} maxLength={2000} /></label></div><button className="btn primary" type="submit" disabled={creating}>{creating ? "Adding…" : "Add as unverified evidence"}</button></form></section>;
}

function formatDate(value: string) { return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(`${value.slice(0, 10)}T00:00:00Z`)); }
function formatDateTime(value: string) { return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
