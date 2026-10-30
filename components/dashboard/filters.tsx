"use client";

import { useRouter } from "next/navigation";
import type { DashboardProduct } from "@/domain/dashboard/types";
import { DASHBOARD_MONTHS } from "@/domain/dashboard/constants";
import { formatDashboardMonth } from "@/domain/dashboard/format";

export function DashboardFilters({ products, month, productId }: { products: DashboardProduct[]; month: string; productId: string | null }) {
  const router = useRouter();

  function update(key: "month" | "product", value: string) {
    const params = new URLSearchParams();
    params.set("month", key === "month" ? value : month);
    const nextProduct = key === "product" ? value : productId ?? "";
    if (nextProduct) params.set("product", nextProduct);
    router.push(`/dashboard?${params.toString()}`);
  }

  return (
    <section className="scope-bar" aria-label="Suzhou dashboard filters">
      <span className="scope-lead">SUZHOU<br />OPERATIONS</span>
      <div className="field"><label htmlFor="dashboard-product">Product family</label><select id="dashboard-product" value={productId ?? ""} onChange={(event) => update("product", event.target.value)}><option value="">All vacuum units</option>{products.map((product) => <option key={product.id} value={product.id}>{product.family}</option>)}</select></div>
      <div className="field"><label htmlFor="dashboard-month">Reporting month</label><select id="dashboard-month" value={month} onChange={(event) => update("month", event.target.value)}>{DASHBOARD_MONTHS.map((value) => <option key={value} value={value}>{formatDashboardMonth(value)}</option>)}</select></div>
      <div className="scope-tail"><span className="badge">Suzhou plant</span><br /><span>Permission-filtered database records</span></div>
    </section>
  );
}

