"use client";

import { useRouter } from "next/navigation";
import type { DashboardProduct } from "@/domain/dashboard/types";
import { DASHBOARD_MONTHS } from "@/domain/dashboard/constants";
import { useLanguage } from "@/components/i18n/language-provider";
import type { DashboardRole } from "@/domain/dashboard/types";
import { dashboardUrl } from "@/domain/dashboard/navigation";
import Link from "next/link";

export function DashboardFilters({ products, month, productId, role, analysisOpen }: { products: DashboardProduct[]; month: string; productId: string | null; role: DashboardRole; analysisOpen: boolean }) {
  const router = useRouter();
  const { locale } = useLanguage();
  const t = (en: string, zh: string) => locale === "zh" ? zh : en;

  function update(key: "month" | "product", value: string) {
    const nextProduct = key === "product" ? value : productId ?? "";
    router.push(dashboardUrl({ role, month: key === "month" ? value : month, product: nextProduct, analysis: analysisOpen }), { scroll: false });
  }

  return (
    <section className="scope-bar" aria-label={t("Suzhou dashboard filters", "苏州看板筛选")} data-no-translate>
      <span className="scope-lead">{t("SUZHOU", "苏州")}<br />{t("OPERATIONS", "运营")}</span>
      <div className="field product-filter"><label htmlFor="dashboard-product">{t("Product", "产品")}</label><select id="dashboard-product" value={productId ?? ""} onChange={(event) => update("product", event.target.value)}><option value="">{t("All products", "全部产品")}</option>{productId && !products.some(product => product.id === productId) ? <option value={productId}>{t("Unavailable product", "产品已不可用")}</option> : null}{products.map((product) => <option key={product.id} value={product.id}>{product.name} · {product.code}</option>)}</select></div>
      <div className="field"><label htmlFor="dashboard-month">{t("Reporting month", "统计月份")}</label><select id="dashboard-month" value={month} onChange={(event) => update("month", event.target.value)}>{DASHBOARD_MONTHS.map((value) => <option key={value} value={value}>{new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-GB", { year: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${value}-01T00:00:00Z`))}</option>)}</select></div>
      <Link className="btn small" scroll={false} href={dashboardUrl({ role, month })}>{t("View all products", "查看全部产品")}</Link>
      <div className="scope-tail"><span className="badge">{t("Suzhou plant", "苏州工厂")}</span><br /><span>{t("Permission-filtered database records", "按权限筛选的数据库记录")}</span></div>
    </section>
  );
}

