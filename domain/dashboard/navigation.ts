export type DashboardLocation = { role: string; month: string; product?: string | null; analysis?: boolean };

export function dashboardUrl({ role, month, product, analysis }: DashboardLocation, scrollToAnalysis = false) {
  const params = new URLSearchParams({ role, month });
  if (product) params.set("product", product);
  if (product && analysis) params.set("analysis", "1");
  return `/dashboard?${params.toString()}${product && analysis && scrollToAnalysis ? "#product-analysis" : ""}`;
}
