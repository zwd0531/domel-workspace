import "server-only";

import { z } from "zod";
import type { AdminUser, AdminWorkspaceData, ImportRun } from "@/domain/admin/types";
import { isAppRole } from "@/domain/permissions/policy";
import type { AuthorizationContext } from "@/server/auth/context";
import { createSupabaseServerClient } from "@/server/supabase/server";

const profileSchema = z.object({
  id: z.string(), display_name: z.string(), active: z.boolean(), created_at: z.string(),
});
const roleSchema = z.object({ user_id: z.string(), role: z.string() });
const importRunSchema = z.object({
  id: z.string(), source_type: z.string(), source_name: z.string(), status: z.enum(["pending", "completed", "failed"]),
  rows_received: z.coerce.number().int(), rows_imported: z.coerce.number().int(), errors: z.array(z.string()),
  imported_by: z.string(), created_at: z.string(), completed_at: z.string().nullable(),
});

function assertQuery(error: { message: string } | null, label: string) {
  if (error) throw new Error(`${label}: ${error.message}`);
}

export async function loadAdminWorkspaceData(auth: AuthorizationContext): Promise<AdminWorkspaceData> {
  const supabase = await createSupabaseServerClient();
  const [profilesResult, rolesResult, importsResult, plantsResult, productsResult] = await Promise.all([
    supabase.from("profiles").select("id,display_name,active,created_at").order("display_name"),
    supabase.from("user_roles").select("user_id,role"),
    supabase.from("import_runs").select("id,source_type,source_name,status,rows_received,rows_imported,errors,imported_by,created_at,completed_at").order("created_at", { ascending: false }).limit(30),
    supabase.from("plants").select("id", { count: "exact", head: true }),
    supabase.from("products").select("id", { count: "exact", head: true }),
  ]);

  assertQuery(profilesResult.error, "Unable to load user directory");
  assertQuery(rolesResult.error, "Unable to load role assignments");
  assertQuery(importsResult.error, "Unable to load import history");
  assertQuery(plantsResult.error, "Unable to count plants");
  assertQuery(productsResult.error, "Unable to count products");

  const roleMap = new Map<string, AdminUser["roles"]>();
  for (const row of z.array(roleSchema).parse(rolesResult.data)) {
    if (!isAppRole(row.role)) continue;
    const current = roleMap.get(row.user_id) ?? [];
    current.push(row.role);
    roleMap.set(row.user_id, current);
  }

  const users: AdminUser[] = z.array(profileSchema).parse(profilesResult.data).map((profile) => ({
    id: profile.id,
    displayName: profile.display_name,
    active: profile.active,
    createdAt: profile.created_at,
    roles: roleMap.get(profile.id) ?? [],
  }));

  const importRuns: ImportRun[] = z.array(importRunSchema).parse(importsResult.data).map((run) => ({
    id: run.id,
    sourceType: run.source_type,
    sourceName: run.source_name,
    status: run.status,
    rowsReceived: run.rows_received,
    rowsImported: run.rows_imported,
    errors: run.errors,
    importedBy: run.imported_by,
    createdAt: run.created_at,
    completedAt: run.completed_at,
  }));

  return {
    currentUserId: auth.userId,
    displayName: users.find((user) => user.id === auth.userId)?.displayName ?? auth.email ?? "Administrator",
    roles: auth.roles,
    plantCount: plantsResult.count ?? 0,
    productCount: productsResult.count ?? 0,
    users,
    importRuns,
  };
}
