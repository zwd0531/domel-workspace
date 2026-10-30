"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { canReviewDecision, canSubmitDecision } from "@/domain/decisions/policy";
import type { SavedScenario, ScenarioWorkspaceData } from "@/domain/scenario/workspace";

export function DecisionWorkflow({ data, scenario }: { data: ScenarioWorkspaceData; scenario: SavedScenario | null }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  if (!scenario) {
    return <section className="panel panel-pad decision-panel"><h2>Conditional decision</h2><p className="small muted">Save the scenario first. A decision must bind to one immutable snapshot.</p></section>;
  }

  const decisions = data.decisions.filter((decision) => decision.scenarioId === scenario.id);
  const pending = decisions.find((decision) => decision.status === "submitted");
  const actor = { userId: data.userId, roles: data.roles };
  const maySubmit = canSubmitDecision(actor, scenario.ownerId) && !pending && !["approved", "archived"].includes(scenario.status);

  async function submitDecision(formData: FormData) {
    setSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch("/api/decisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioId: scenario!.id,
          snapshotId: formData.get("snapshotId"),
          title: formData.get("title"),
          recommendation: formData.get("recommendation"),
          reviewTrigger: formData.get("reviewTrigger"),
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to submit the decision.");
      setMessage({ tone: "ok", text: "Decision submitted. It now requires review by another authorized user." });
      router.refresh();
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Unable to submit the decision." });
    } finally {
      setSubmitting(false);
    }
  }

  async function reviewDecision(formData: FormData) {
    const decisionId = String(formData.get("decisionId"));
    setReviewingId(decisionId);
    setMessage(null);
    try {
      const response = await fetch("/api/decisions/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decisionId,
          action: formData.get("action"),
          reviewNote: formData.get("reviewNote"),
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to review the decision.");
      setMessage({ tone: "ok", text: payload.status === "approved" ? "Decision approved." : "Decision rejected with a recorded note." });
      router.refresh();
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Unable to review the decision." });
    } finally {
      setReviewingId(null);
    }
  }

  return <section className="panel panel-pad decision-panel">
    <div className="row"><div><span className="eyebrow">04 / CONTROLLED COMMITMENT</span><h2>Conditional decision</h2><p className="small muted">Submit one immutable snapshot and preserve the approval conditions, reviewer and audit trail.</p></div><span className={statusBadge(scenario.status)}>Scenario · {scenario.status}</span></div>
    {message ? <div className={`scenario-message ${message.tone}`}>{message.text}</div> : null}
    {maySubmit ? <form className="decision-submit" action={submitDecision}>
      <div className="decision-form-grid">
        <label className="field"><span>Immutable snapshot</span><select name="snapshotId" defaultValue={scenario.snapshots[0]?.id} required>{scenario.snapshots.map((snapshot, index) => <option key={snapshot.id} value={snapshot.id}>v{scenario.version - index} · {formatDate(snapshot.createdAt)} · {money(snapshot.result.operatingProfit)} operating profit</option>)}</select></label>
        <label className="field"><span>Decision title</span><input name="title" required maxLength={180} defaultValue={`${scenario.name} recommendation`} /></label>
      </div>
      <div className="decision-text-grid">
        <label className="field"><span>Recommendation and conditions</span><textarea name="recommendation" required maxLength={3000} rows={4} placeholder="State the action, limits and conditions for proceeding." /></label>
        <label className="field"><span>Review trigger</span><textarea name="reviewTrigger" required maxLength={2000} rows={4} placeholder="Define what new fact, threshold or date requires this decision to be reviewed." /></label>
      </div>
      <div className="decision-submit-foot"><p className="small muted">Submission locks further snapshots until a different authorized user approves or rejects it.</p><button className="btn primary" disabled={submitting || !scenario.snapshots.length}>{submitting ? "Submitting…" : "Submit for approval"}</button></div>
    </form> : <div className="notice"><span>ⓘ</span><span>{pending ? pending.submittedBy === data.userId ? "Awaiting another authorized user. Self-approval is blocked." : "This scenario already has a decision awaiting review." : scenario.status === "approved" ? "The decision is approved and this scenario is locked." : "Only the scenario owner or an administrator may submit this decision."}</span></div>}

    <div className="decision-history">
      <h3>Decision history</h3>
      {decisions.length ? decisions.map((decision) => {
        const mayReview = canReviewDecision(actor, decision);
        return <article key={decision.id} className="decision-card">
          <div className="row"><div><strong>{decision.title}</strong><small>Submitted {formatDate(decision.createdAt)} · Snapshot {snapshotLabel(scenario, decision.snapshotId)}</small></div><span className={statusBadge(decision.status)}>{decision.status}</span></div>
          <dl className="decision-definition"><div><dt>Recommendation</dt><dd>{decision.recommendation}</dd></div><div><dt>Review trigger</dt><dd>{decision.reviewTrigger}</dd></div>{decision.reviewNote ? <div><dt>Reviewer note</dt><dd>{decision.reviewNote}</dd></div> : null}</dl>
          {decision.reviewedAt ? <p className="small muted">Reviewed {formatDate(decision.reviewedAt)} by a different authorized user.</p> : null}
          {mayReview ? <form className="decision-review" action={reviewDecision}>
            <input type="hidden" name="decisionId" value={decision.id} />
            <label className="field"><span>Review note (required when rejecting)</span><textarea name="reviewNote" maxLength={2000} rows={2} placeholder="Record the evidence and reasoning behind this review." /></label>
            <div className="button-row"><button className="btn primary" name="action" value="approved" disabled={reviewingId === decision.id}>{reviewingId === decision.id ? "Saving…" : "Approve"}</button><button className="btn danger" name="action" value="rejected" disabled={reviewingId === decision.id}>Reject</button></div>
          </form> : decision.status === "submitted" ? <p className="small muted">{decision.submittedBy === data.userId ? "You submitted this decision; another Decision Owner or Admin must review it." : "Your current role cannot review this decision."}</p> : null}
        </article>;
      }) : <p className="small muted empty-state">No decision has been submitted for this scenario.</p>}
    </div>
  </section>;
}

function snapshotLabel(scenario: SavedScenario, snapshotId: string) {
  const index = scenario.snapshots.findIndex((snapshot) => snapshot.id === snapshotId);
  return index < 0 ? "unknown" : `v${scenario.version - index}`;
}

function statusBadge(status: string) {
  if (status === "approved") return "badge green";
  if (status === "rejected") return "badge red";
  if (status === "submitted") return "badge amber";
  return "badge blue";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function money(value: number) {
  return new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
}
