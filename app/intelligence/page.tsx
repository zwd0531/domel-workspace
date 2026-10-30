import { redirect } from "next/navigation";
import { WorkspaceHeader } from "@/components/workspace-header";
import { IntelligenceWorkspace } from "@/components/intelligence/intelligence-workspace";
import { canAny } from "@/domain/permissions/policy";
import { getAuthorizationContext } from "@/server/auth/context";
import { loadIntelligenceData } from "@/server/intelligence/data";

export const dynamic = "force-dynamic";

export default async function IntelligencePage() {
  const auth = await getAuthorizationContext();
  if (!auth) redirect("/login");
  if (!canAny(auth.roles, "evidence:read")) redirect("/access-pending");

  const data = await loadIntelligenceData(auth);
  return (
    <>
      <WorkspaceHeader displayName={data.displayName} roles={data.roles} active="intelligence" />
      <IntelligenceWorkspace data={data} />
      <footer className="site-footer"><span>© 2026 · Domel decision workspace</span><span>Attributed sources · Review state audited</span></footer>
    </>
  );
}
