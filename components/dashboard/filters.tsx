"use client";

import { useRouter } from "next/navigation";
import type { DashboardProduct } from "@/domain/dashboard/types";
import { DASHBOARD_MONTHS } from "@/domain/dashboard/constants";
import { formatDashboardMonth } from "@/domain/dashboard/format";
import type { DashboardRole } from "@/domain/dashboard/types";
import { dashboardUrl } from "@/domain/dashboard/navigation";
import Link from "next/link";

export function DashboardFilters({ products, month, productId, role, analysisOpen }: { products: DashboardProduct[]; month: string; productId: string | null; role: DashboardRole; analysisOpen: boolean }) {
  const router = useRouter();

  function update(key: "month" | "product", value: string) {
    const nextProduct = key === "product" ? value : productId ?? "";
    router.push(dashboardUrl({ role, month: key === "month" ? value : month, product: nextProduct, analysis: analysisOpen }), { scroll: false });
  }

  return (
    <section className="scope-bar" aria-label="Suzhou dashboard filters">
      <span className="scope-lead">SUZHOU<br />OPERATIONS</span>
      <div className="field product-filter"><label htmlFor="dashboard-product">Product</label><select id="dashboard-product" value={productId ?? ""} onChange={(event) => update("product", event.target.value)}><option value="">All products</option>{productId && !products.some(product => product.id === productId) ? <option value={productId}>Unavailable product</option> : null}{products.map((product) => <option key={product.id} value={product.id}>{product.name} · {product.code}</option>)}</select></div>
      <div className="field"><label htmlFor="dashboard-month">Reporting month</label><select id="dashboard-month" value={month} onChange={(event) => update("month", event.target.value)}>{DASHBOARD_MONTHS.map((value) => <option key={value} value={value}>{formatDashboardMonth(value)}</option>)}</select></div>
      <Link className="btn small" scroll={false} href={dashboardUrl({ role, month })}>View all products</Link>
      <div className="scope-tail"><span className="badge">Suzhou plant</span><br /><span>Permission-filtered database records</span></div>
    </section>
  );
}

