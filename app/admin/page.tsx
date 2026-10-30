import { redirect } from "next/navigation";
import { AdminConsole } from "@/components/admin/admin-console";
import { WorkspaceHeader } from "@/components/workspace-header";
import { canAny } from "@/domain/permissions/policy";
import { getAuthorizationContext } from "@/server/auth/context";
import { loadAdminWorkspaceData } from "@/server/admin/data";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const auth = await getAuthorizationContext();
  if (!auth) redirect("/login");
  if (!canAny(auth.roles, "imports:manage") || !canAny(auth.roles, "users:manage")) redirect("/access-pending");

  const data = await loadAdminWorkspaceData(auth);
  return <>
    <WorkspaceHeader displayName={data.displayName} roles={data.roles} active="admin" />
    <AdminConsole data={data} />
    <footer className="site-footer"><span>© 2026 · Domel decision workspace</span><span>Admin-only · Import-audited</span></footer>
  </>;
}
