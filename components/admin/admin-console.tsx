"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IMPORT_DEFINITIONS } from "@/domain/admin/imports";
import { IMPORT_DATASETS, type AdminUser, type AdminWorkspaceData, type ImportDataset, type ImportRow } from "@/domain/admin/types";
import { APP_ROLES, type AppRole } from "@/domain/permissions/policy";

type ImportPreview = {
  dataset: ImportDataset;
  headers: string[];
  rows: ImportRow[];
  rowCount: number;
  errors: string[];
};

const ROLE_LABELS: Record<AppRole, string> = {
  sales: "Sales Coordinator",
  production_planner: "Production Planner",
  quality_engineer: "Quality Engineer",
  decision_owner: "Decision Owner",
  admin: "Administrator",
};

export function AdminConsole({ data }: { data: AdminWorkspaceData }) {
  const router = useRouter();
  const [dataset, setDataset] = useState<ImportDataset>("sales");
  const [sourceName, setSourceName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [busy, setBusy] = useState<"preview" | "commit" | null>(null);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  async function sendImport(mode: "preview" | "commit") {
    if (!file || !sourceName.trim()) return;
    setBusy(mode);
    setMessage(null);
    const form = new FormData();
    form.set("dataset", dataset);
    form.set("sourceName", sourceName.trim());
    form.set("mode", mode);
    form.set("file", file);
    try {
      const response = await fetch("/api/admin/imports", { method: "POST", body: form });
      const payload = await response.json();
      if (payload.headers) setPreview({
        dataset: payload.dataset,
        headers: payload.headers,
        rows: payload.rows,
        rowCount: payload.rowCount,
        errors: payload.errors,
      });
      if (!response.ok) throw new Error(payload.error ?? "Unable to validate the import.");
      if (mode === "preview") {
        setMessage({ tone: "ok", text: `${payload.rowCount} rows passed structural validation. Review the preview before committing.` });
      } else {
        setMessage({ tone: "ok", text: `${payload.rowsImported} rows imported atomically. Import run ${payload.id} was audited.` });
        setPreview(null);
        setFile(null);
        router.refresh();
      }
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Unable to process the import." });
    } finally {
      setBusy(null);
    }
  }

  function resetPreview() {
    setPreview(null);
    setMessage(null);
  }

  const completedImports = data.importRuns.filter((run) => run.status === "completed").length;
  return <main id="main" className="admin-main">
    <div className="page-head"><div><span className="eyebrow">05 / CONTROLLED OPERATIONS</span><h1>Administration and data imports</h1><p className="lead">Validate operational CSV files before an atomic database upsert, inspect the audit history and assign application roles without exposing direct table writes.</p></div><span className="badge red">Administrator only</span></div>

    <section className="admin-summary">
      <article className="panel"><span>Active plants</span><strong>{data.plantCount}</strong></article>
      <article className="panel"><span>Products</span><strong>{data.productCount}</strong></article>
      <article className="panel"><span>User profiles</span><strong>{data.users.length}</strong></article>
      <article className="panel"><span>Completed imports</span><strong>{completedImports}</strong></article>
    </section>

    {message ? <div className={`scenario-message ${message.tone}`} role="status">{message.text}</div> : null}

    <div className="admin-layout">
      <section className="panel panel-pad admin-import">
        <div className="row"><div><h2>Operational CSV import</h2><p className="small muted">Preview performs no write. Commit reparses the same file and calls the audited database transaction.</p></div><a className="btn small" href={IMPORT_DEFINITIONS[dataset].template} download>Download template</a></div>
        <div className="admin-import-fields">
          <label className="field"><span>Dataset</span><select value={dataset} onChange={(event) => { setDataset(event.target.value as ImportDataset); resetPreview(); }}>{IMPORT_DATASETS.map((item) => <option value={item} key={item}>{IMPORT_DEFINITIONS[item].label}</option>)}</select></label>
          <label className="field"><span>Source name</span><input value={sourceName} maxLength={180} placeholder="ERP export 2026-10 approved" onChange={(event) => { setSourceName(event.target.value); resetPreview(); }} /></label>
          <label className="field"><span>CSV file · max 1 MB / 500 rows</span><input key={file ? `${file.name}-${file.lastModified}` : "empty"} type="file" accept=".csv,text/csv" onChange={(event) => { setFile(event.target.files?.[0] ?? null); resetPreview(); }} /></label>
        </div>
        <div className="button-row admin-import-actions"><button className="btn" type="button" disabled={!file || !sourceName.trim() || Boolean(busy)} onClick={() => sendImport("preview")}>{busy === "preview" ? "Validating…" : "Preview and validate"}</button><button className="btn primary" type="button" disabled={!preview || preview.errors.length > 0 || Boolean(busy)} onClick={() => sendImport("commit")}>{busy === "commit" ? "Importing…" : "Commit validated import"}</button></div>
        {preview ? <ImportPreviewTable preview={preview} /> : <div className="notice"><span>ⓘ</span><span>Existing product-month records are updated only after validation; any database error rolls back the entire file.</span></div>}
      </section>

      <section className="panel panel-pad admin-users">
        <div><h2>User access directory</h2><p className="small muted">Role changes are database-audited. The final active Administrator cannot be removed.</p></div>
        <div className="admin-user-list">{data.users.map((user) => <UserRoleEditor key={`${user.id}-${user.roles.join("-")}`} user={user} currentUserId={data.currentUserId} />)}</div>
      </section>
    </div>

    <section className="panel data-section admin-history">
      <div className="panel-head"><h2>Import history</h2><p>Latest 30 attempts. Failed database transactions preserve no partial fact rows.</p></div>
      <div className="table-wrap"><table className="data-table"><thead><tr><th>Created</th><th>Dataset</th><th>Source</th><th>Status</th><th>Received</th><th>Imported</th><th>Run ID</th></tr></thead><tbody>{data.importRuns.length ? data.importRuns.map((run) => <tr key={run.id}><td>{formatDate(run.createdAt)}</td><td>{run.sourceType}</td><td className="wrap-cell">{run.sourceName}</td><td><span className={run.status === "completed" ? "badge green" : run.status === "failed" ? "badge red" : "badge amber"}>{run.status}</span></td><td>{run.rowsReceived}</td><td>{run.rowsImported}</td><td><code>{run.id.slice(0, 8)}</code></td></tr>) : <tr><td colSpan={7} className="muted">No imports have been committed.</td></tr>}</tbody></table></div>
    </section>
  </main>;
}

function ImportPreviewTable({ preview }: { preview: ImportPreview }) {
  return <div className="import-preview">
    <div className="row"><h3>Validated preview</h3><span className={preview.errors.length ? "badge red" : "badge green"}>{preview.rowCount} rows · {preview.errors.length} errors</span></div>
    {preview.errors.length ? <ul className="import-errors">{preview.errors.map((error) => <li key={error}>{error}</li>)}</ul> : null}
    {preview.rows.length ? <div className="table-wrap"><table className="data-table"><thead><tr>{preview.headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{preview.rows.map((row, index) => <tr key={index}>{preview.headers.map((header) => <td key={header}>{String(row[header] ?? "")}</td>)}</tr>)}</tbody></table></div> : null}
    {preview.rowCount > preview.rows.length ? <p className="small muted">Showing the first {preview.rows.length} rows.</p> : null}
  </div>;
}

function UserRoleEditor({ user, currentUserId }: { user: AdminUser; currentUserId: string }) {
  const router = useRouter();
  const [roles, setRoles] = useState<AppRole[]>(user.roles);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function toggle(role: AppRole) {
    setRoles((current) => current.includes(role) ? current.filter((item) => item !== role) : [...current, role]);
    setMessage(null);
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/users/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, roles }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to update roles.");
      setMessage("Roles saved and audited.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update roles.");
    } finally {
      setSaving(false);
    }
  }

  const changed = [...roles].sort().join() !== [...user.roles].sort().join();
  return <article className={!user.active ? "inactive" : ""}>
    <div className="admin-user-head"><div><strong>{user.displayName}{user.id === currentUserId ? " · You" : ""}</strong><small>{user.id.slice(0, 8)} · joined {formatDate(user.createdAt)}</small></div><span className={user.active ? "badge green" : "badge red"}>{user.active ? "active" : "inactive"}</span></div>
    <div className="role-checks">{APP_ROLES.map((role) => <label key={role}><input type="checkbox" checked={roles.includes(role)} onChange={() => toggle(role)} disabled={!user.active || saving} /><span>{ROLE_LABELS[role]}</span></label>)}</div>
    <div className="admin-user-foot"><small className={message?.includes("Unable") || message?.includes("cannot") ? "role-error" : "muted"}>{message ?? `${roles.length} role${roles.length === 1 ? "" : "s"} selected`}</small><button className="btn small" type="button" onClick={save} disabled={!changed || saving || !user.active}>{saving ? "Saving…" : "Save roles"}</button></div>
  </article>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
