import { redirect } from "next/navigation";
import { WorkspaceHeader } from "@/components/workspace-header";
import { ScenarioWorkspace } from "@/components/scenarios/scenario-workspace";
import { canAny } from "@/domain/permissions/policy";
import { getAuthorizationContext } from "@/server/auth/context";
import { loadScenarioWorkspaceData } from "@/server/scenarios/data";

export const dynamic = "force-dynamic";

export default async function ScenariosPage({
  searchParams,
}: {
  searchParams: Promise<{ scenario?: string }>;
}) {
  const auth = await getAuthorizationContext();
  if (!auth) redirect("/login");
  if (!canAny(auth.roles, "scenario:save")) redirect("/access-pending");

  const [params, data] = await Promise.all([searchParams, loadScenarioWorkspaceData(auth)]);
  const selectedScenarioId = data.scenarios.some((scenario) => scenario.id === params.scenario)
    ? params.scenario ?? null
    : null;

  return (
    <>
      <WorkspaceHeader displayName={data.displayName} roles={data.roles} active="scenarios" />
      <ScenarioWorkspace key={selectedScenarioId ?? "new"} data={data} selectedScenarioId={selectedScenarioId} />
      <footer className="site-footer"><span>© 2026 · Domel decision workspace</span><span>Server-recalculated · Snapshot-audited</span></footer>
    </>
  );
}
