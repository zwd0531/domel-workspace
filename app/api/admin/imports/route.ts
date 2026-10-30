import { canAny } from "@/domain/permissions/policy";
import { isImportDataset, validateImportCsv } from "@/domain/admin/imports";
import { getAuthorizationContext } from "@/server/auth/context";
import { createSupabaseServerClient } from "@/server/supabase/server";

const MAX_FILE_BYTES = 1_000_000;

export async function POST(request: Request) {
  const auth = await getAuthorizationContext();
  if (!auth) return Response.json({ error: "Authentication required." }, { status: 401 });
  if (!canAny(auth.roles, "imports:manage")) {
    return Response.json({ error: "Administrator import permission required." }, { status: 403 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_FILE_BYTES + 100_000) {
    return Response.json({ error: "Import request is too large." }, { status: 413 });
  }

  const form = await request.formData().catch(() => null);
  if (!form) return Response.json({ error: "Invalid multipart request." }, { status: 400 });
  const datasetValue = String(form.get("dataset") ?? "");
  const mode = String(form.get("mode") ?? "preview");
  const sourceName = String(form.get("sourceName") ?? "").trim();
  const file = form.get("file");

  if (!isImportDataset(datasetValue) || !["preview", "commit"].includes(mode)) {
    return Response.json({ error: "Invalid import type or mode." }, { status: 400 });
  }
  if (!(file instanceof File) || file.size === 0 || file.size > MAX_FILE_BYTES) {
    return Response.json({ error: "Select a non-empty CSV file no larger than 1 MB." }, { status: file instanceof File && file.size > MAX_FILE_BYTES ? 413 : 400 });
  }
  if (sourceName.length < 1 || sourceName.length > 180) {
    return Response.json({ error: "Source name must contain 1 to 180 characters." }, { status: 400 });
  }

  const validation = validateImportCsv(datasetValue, await file.text());
  const summary = {
    dataset: validation.dataset,
    headers: validation.headers,
    rows: validation.rows.slice(0, 10),
    rowCount: validation.rows.length,
    errors: validation.errors.slice(0, 50),
  };
  if (validation.errors.length) {
    return Response.json({ error: "CSV validation failed.", ...summary }, { status: 400 });
  }
  if (mode === "preview") return Response.json({ ok: true, ...summary });

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("import_operational_dataset", {
    p_source_type: datasetValue,
    p_source_name: sourceName,
    p_rows: validation.rows,
  });
  if (error) {
    return Response.json(
      { error: error.code === "42501" ? "Administrator import permission denied." : "Database import failed validation." },
      { status: error.code === "42501" ? 403 : 400 },
    );
  }
  if (data?.status === "failed") {
    return Response.json({ error: "Database import failed validation.", runId: data.id }, { status: 400 });
  }
  return Response.json({ ok: true, ...data });
}
