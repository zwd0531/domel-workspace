import { redirect } from "next/navigation";
import { DashboardFilters } from "@/components/dashboard/filters";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { WorkspaceHeader } from "@/components/workspace-header";
import { getAuthorizationContext } from "@/server/auth/context";
import { loadDashboardData } from "@/server/dashboard/data";
import { resolveDashboardRole } from "@/domain/dashboard/role";

export const dynamic = "force-dynamic";

type DashboardPageProps = {
  searchParams: Promise<{ month?: string; product?: string; record?: string }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const auth = await getAuthorizationContext();
  if (!auth) redirect("/login");
  if (!resolveDashboardRole(auth.roles)) redirect("/access-pending");

  const params = await searchParams;
  const data = await loadDashboardData(auth, { month: params.month, productId: params.product });

  return (
    <>
      <WorkspaceHeader displayName={data.displayName} roles={auth.roles} />
      <DashboardFilters products={data.products} month={data.month} productId={data.productId} />
      <DashboardView data={data} selectedRecord={params.record} />
      <footer className="site-footer"><span>© 2026 · Domel decision workspace</span><span>Server-authorized · Database-backed</span></footer>
    </>
  );
}
