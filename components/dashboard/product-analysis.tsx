"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useLanguage } from "@/components/i18n/language-provider";
import type { DashboardProduct, DashboardRole, DashboardRow } from "@/domain/dashboard/types";
import { known, notPassed, outstanding, rate, salesValue } from "@/domain/dashboard/analysis";
import { dashboardUrl } from "@/domain/dashboard/navigation";
import { scrollToProductAnalysis } from "./analysis-link";

export function ProductAnalysis({ product, row, role, month, salesTotal }: {
  product: DashboardProduct;
  row?: DashboardRow;
  role: DashboardRole;
  month: string;
  salesTotal: number | null;
}) {
  const { locale } = useLanguage();
  const zh = locale === "zh";
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (window.location.hash !== "#product-analysis") return;
    scrollToProductAnalysis();
  }, [product.id, month, role]);

  const t = (en: string, cn: string) => zh ? cn : en;
  const n = (value: unknown) => known(value) ? new Intl.NumberFormat(zh ? "zh-CN" : "en-GB", { maximumFractionDigits: 2 }).format(value) : "—";
  const pct = (value: number | null) => value === null ? "—" : `${value.toFixed(1)}%`;
  const money = (value: number | null) => value === null ? "—" : new Intl.NumberFormat(zh ? "zh-CN" : "en-IE", { style: "currency", currency: row?.currency ?? "EUR", maximumFractionDigits: 2 }).format(value);
  const roleName = role === "sales" ? t("Sales Coordinator", "销售协调员") : role === "production_planner" ? t("Production Planner", "生产计划员") : t("Quality Engineer", "质量工程师");
  const location = { role, month, product: product.id };
  const fields: [string, string][] = [];
  let interpretation = "";
  let chart = null;

  if (row && role === "sales") {
    const revenue = salesValue(row), share = rate(revenue, salesTotal);
    fields.push([t("Unit price", "单价"), money(row.unitPrice ?? null)], [t("Orders (orders)", "订单数（单）"), n(row.orderCount)], [t("Units shipped (pieces)", "出货量（件）"), n(row.shippedUnits)], [t("Sales value", "销售额"), money(revenue)]);
    interpretation = t(`This month records ${n(row.orderCount)} orders and ${n(row.shippedUnits)} shipped pieces. Sales value is ${money(revenue)}. Order count and shipped piece count measure different things.`, `本月记录 ${n(row.orderCount)} 单订单，出货 ${n(row.shippedUnits)} 件，销售额为 ${money(revenue)}。订单数与出货件数是不同的统计口径。`);
    chart = <>
      <div className="sales-equation"><span>{n(row.shippedUnits)}<small>{t("shipped pieces", "出货件数")}</small></span><b>×</b><span>{money(row.unitPrice ?? null)}<small>{t("per piece", "每件单价")}</small></span><b>=</b><span>{money(revenue)}<small>{t("sales value", "销售额")}</small></span></div>
      <figure className="sales-share"><div className="share-ring" style={{ background: share === null ? "var(--line)" : `conic-gradient(var(--blue) ${Math.max(0, Math.min(100, share))}%, #e7edf3 0)` }}><strong>{pct(share)}</strong></div><figcaption><strong>{t("Share of this month's sales", "本月销售额占比")}</strong><p>{t("All active products, same month and currency", "同月份、同币种全部在售产品")}</p><p>{t("Product", "本产品")}: {money(revenue)} / {t("Total", "全部")}: {money(salesTotal)}</p>{share === null ? <p>{t("Share cannot be calculated because the total is missing or zero.", "总额缺失或为零，无法计算占比。")}</p> : null}</figcaption></figure>
    </>;
  } else if (row && role === "production_planner") {
    const completion = rate(row.producedUnits, row.plannedUnits), backlog = outstanding(row);
    fields.push([t("Planned units", "计划产量（件）"), n(row.plannedUnits)], [t("Produced units", "实际产量（件）"), n(row.producedUnits)], [t("Plan completion", "完成率"), pct(completion)], [t("Uncompleted units", "未完成量（件）"), n(backlog)]);
    interpretation = t(`This month planned ${n(row.plannedUnits)} pieces and produced ${n(row.producedUnits)} pieces. Completion is ${pct(completion)}, with ${n(backlog)} pieces uncompleted. The data does not record reasons for any gap.`, `本月计划生产 ${n(row.plannedUnits)} 件，实际完成 ${n(row.producedUnits)} 件，完成率为 ${pct(completion)}，尚有 ${n(backlog)} 件未完成。当前数据未记录缺口原因。`);
    chart = <ComparisonBars label={t("Planned vs actual (pieces)", "计划与实际对比（件）")} items={[[t("Planned", "计划"), row.plannedUnits], [t("Actual", "实际"), row.producedUnits]]} format={n} />;
  } else if (row) {
    const pass = rate(row.passedUnits, row.testedUnits), failed = notPassed(row);
    const risk = row.risk ? zh ? ({ Low: "低", Medium: "中", High: "高" }[row.risk]) : row.risk : t("Not recorded", "未记录");
    fields.push([t("Tested units", "检测量（件）"), n(row.testedUnits)], [t("Passed units", "合格量（件）"), n(row.passedUnits)], [t("Test pass rate", "通过率"), pct(pass)], [t("Recorded defect rate", "记录缺陷率"), pct(row.defectRate ?? null)], [t("Field returns", "退货数量（件）"), n(row.fieldReturns)], [t("Risk level", "风险等级"), risk]);
    interpretation = t(`This month tested ${n(row.testedUnits)} pieces, with ${n(row.passedUnits)} passing and ${n(failed)} not passing. Pass rate is ${pct(pass)}; recorded defect rate is ${pct(row.defectRate ?? null)}. There are ${n(row.fieldReturns)} returns and the recorded risk is ${risk}. These data do not establish a cause.`, `本月检测 ${n(row.testedUnits)} 件，合格 ${n(row.passedUnits)} 件，未合格 ${n(failed)} 件，通过率为 ${pct(pass)}，记录缺陷率为 ${pct(row.defectRate ?? null)}。退货 ${n(row.fieldReturns)} 件，记录风险等级为${risk}。以上数据不用于推断原因。`);
    chart = <><ComparisonBars label={t("Inspection results (pieces)", "检测结果对比（件）")} items={[[t("Passed", "合格"), row.passedUnits], [t("Not passed", "未合格"), failed]]} format={n} /><p className="small muted">{t("Not passed = tested − passed. Returns are recorded separately; recorded defect rate uses the source's definition.", "未合格量＝检测量－合格量。退货数单独记录，缺陷率沿用原始记录口径。")}</p></>;
  }

  return <section id="product-analysis" className="panel panel-pad product-analysis" aria-labelledby="product-analysis-title" data-no-translate>
    <div className="row analysis-heading"><div><span className="eyebrow">{t("PRODUCT ANALYSIS", "产品分析")}</span><h2 id="product-analysis-title" ref={title} tabIndex={-1}>{product.name}</h2><p className="small muted">{product.code} · {roleName} · {new Intl.DateTimeFormat(zh ? "zh-CN" : "en-GB", { year: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${month}-01T00:00:00Z`))}</p></div><div className="button-row"><span className="badge amber">{t("Demo data", "演示数据")}</span><Link className="btn small" scroll={false} href={dashboardUrl(location)}>{t("Collapse analysis", "收起分析")}</Link><Link className="btn small" href={dashboardUrl({ role, month })}>{t("View all products", "查看全部产品")}</Link></div></div>
    {!row ? <div className="notice" role="status">{t("No data is recorded for this product in this month.", "该产品本月暂无数据。")}</div> : <>
      <h3>{t("Key figures", "关键数据")}</h3><dl className="analysis-metrics">{fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
      <h3>{t("Visual comparison", "直观对比")}</h3>{chart}
      {fields.some(([, value]) => value === "—") ? <p className="small muted">{t("— means missing data or a rate with a zero denominator. It does not mean zero.", "— 表示数据缺失或比例的分母为零，不代表数值为零。")}</p> : null}
      <div className="analysis-reading"><h3>{t("Data interpretation", "数据解读")}</h3><p>{interpretation}</p></div>
      {role === "quality_engineer" ? <div className="quality-record-note"><h3>{t("Recorded quality note", "已有质量备注")}</h3><p>{row.qualityNote?.trim() || t("Not recorded", "未记录")}</p></div> : null}
    </>}
  </section>;
}

function ComparisonBars({ label, items, format }: { label: string; items: [string, number | null | undefined][]; format: (value: unknown) => string }) {
  const max = Math.max(1, ...items.map(([, value]) => known(value) ? value : 0));
  return <figure className="analysis-bars"><figcaption>{label}</figcaption>{items.map(([name, value], index) => <div className="analysis-bar-row" key={name}><div className="row"><span>{name}</span><strong>{format(value)}</strong></div><div className="analysis-bar-track"><span className={index ? "secondary" : ""} style={{ width: `${known(value) ? Math.max(0, value / max * 100) : 0}%` }} /></div></div>)}</figure>;
}
