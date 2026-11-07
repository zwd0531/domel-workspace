import { redirect } from "next/navigation";
import { DashboardFilters } from "@/components/dashboard/filters";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { DashboardRoleSwitch } from "@/components/dashboard/role-switch";
import { WorkspaceHeader } from "@/components/workspace-header";
import { getAuthorizationContext } from "@/server/auth/context";
import { loadDashboardData } from "@/server/dashboard/data";
import { availableDashboardRoles, resolveDashboardRole } from "@/domain/dashboard/role";
import { dashboardUrl } from "@/domain/dashboard/navigation";

export const dynamic = "force-dynamic";

type DashboardPageProps = {
  searchParams: Promise<{ month?: string; product?: string; record?: string; role?: string; analysis?: string }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const auth = await getAuthorizationContext();
  if (!auth) redirect("/login");
  if (!resolveDashboardRole(auth.roles)) redirect("/access-pending");

  const params = await searchParams;
  if (params.record) redirect(dashboardUrl({ role: resolveDashboardRole(auth.roles, params.role)!, month: params.month ?? "2026-10", product: params.product || params.record, analysis: true }, true));
  const data = await loadDashboardData(auth, { month: params.month, productId: params.product, role: params.role });
  const analysisOpen = params.analysis === "1" && Boolean(data.productId);

  return (
    <>
      <WorkspaceHeader displayName={data.displayName} roles={auth.roles} dashboardRole={data.role} />
      <DashboardRoleSwitch availableRoles={availableDashboardRoles(auth.roles)} role={data.role} month={data.month} productId={data.productId} analysisOpen={analysisOpen} />
      <DashboardFilters products={data.products} month={data.month} productId={data.productId} role={data.role} analysisOpen={analysisOpen} />
      <DashboardView data={data} analysisOpen={analysisOpen} />
      <footer className="site-footer"><span>© 2026 · Domel decision workspace</span><span>Server-authorized · Database-backed</span></footer>
    </>
  );
}
