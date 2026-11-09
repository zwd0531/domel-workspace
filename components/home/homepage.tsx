"use client";

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/components/i18n/language-provider";
import { LanguageToggle } from "@/components/i18n/language-toggle";

const copy = {
  en: {
    brand: "Domel Workspace home",
    eyebrow: "DOMEL WORKSPACE · DECISION SUPPORT",
    headline: "Turn business data into",
    highlight: "clearer operational decisions.",
    problem: "Scattered sales, production and quality information makes it hard to compare options and agree on the next step.",
    action: "Open workspace",
    accountNote: "Log in or create an account to continue.",
    publicNote: "Explore this page without an account.",
    previewLabel: "Overview of the three workspace tools",
    previewHeading: "One workspace.",
    previewSubheading: "Three decision tools.",
    dashboard: "Business Dashboard",
    dashboardNote: "Understand your product",
    intelligence: "Industry Intelligence",
    intelligenceNote: "Review evidence and sources",
    scenarios: "Scenario Planning",
    scenariosNote: "Compare your assumptions",
    from: "FROM DATA",
    to: "TO DECISIONS",
    stepsEyebrow: "A SIMPLE WORKFLOW",
    stepsTitle: "How it works",
    steps: [
      { title: "Review your product", text: "Choose your role, product and month to see the business data relevant to your work." },
      { title: "Gather industry evidence", text: "Research a business question and review the sources behind the industry signals." },
      { title: "Compare scenarios", text: "Adjust assumptions, compare outcomes and use AI feedback to review your analysis." },
    ],
    teamEyebrow: "THE PROJECT TEAM",
    teamTitle: "Who we are",
    teamLines: [
      "We are the project team behind Domel Workspace.",
      "We build decision-support tools for the Domel Suzhou operations case.",
    ],
    footer: "Project prototype · Domel Suzhou case",
  },
  zh: {
    brand: "Domel Workspace 首页",
    eyebrow: "DOMEL WORKSPACE · 决策支持",
    headline: "让业务数据帮助你",
    highlight: "做出更清晰的运营决策。",
    problem: "销售、生产和质量信息分散，导致团队难以比较方案、确定下一步行动。",
    action: "进入工作台",
    accountNote: "登录或创建账号后即可继续。",
    publicNote: "无需账号，即可浏览本页。",
    previewLabel: "工作台三项工具概览",
    previewHeading: "一个工作台，",
    previewSubheading: "三项决策工具。",
    dashboard: "业务看板",
    dashboardNote: "了解产品的业务表现",
    intelligence: "行业情报",
    intelligenceNote: "查看证据与信息来源",
    scenarios: "场景规划",
    scenariosNote: "比较不同假设的结果",
    from: "从业务数据",
    to: "到清晰决策",
    stepsEyebrow: "简单三步",
    stepsTitle: "如何使用",
    steps: [
      { title: "查看产品表现", text: "选择岗位、产品和月份，查看与你的工作相关的业务数据。" },
      { title: "收集行业证据", text: "围绕业务问题搜索行业信息，查看相关信号及其来源。" },
      { title: "比较场景方案", text: "调整假设、比较结果，并借助 AI 反馈检查自己的分析。" },
    ],
    teamEyebrow: "项目团队",
    teamTitle: "我们是谁",
    teamLines: [
      "我们是 Domel Workspace 项目的开发团队。",
      "我们围绕 Domel 苏州运营案例，开发帮助团队理解数据、比较方案的决策支持工具。",
    ],
    footer: "项目原型 · Domel 苏州运营案例",
  },
};

export function Homepage() {
  const { locale } = useLanguage();
  const content = copy[locale];

  return (
    <main className="landing-page" data-no-translate>
      <header className="landing-header">
        <Link className="landing-brand" href="/" aria-label={content.brand}>
          <Image src="/domel-logo.png" alt="Domel" width={1800} height={578} sizes="(max-width: 680px) 108px, 132px" priority />
          <span>Workspace</span>
        </Link>
        <div className="landing-header-meta">
          <span className="landing-status"><i aria-hidden="true" /> Domel Suzhou</span>
          <LanguageToggle />
        </div>
      </header>

      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-hero-copy">
          <p className="landing-eyebrow">{content.eyebrow}</p>
          <h1 id="landing-title">{content.headline} <em>{content.highlight}</em></h1>
          <p className="landing-lead">{content.problem}</p>
          <div className="landing-actions">
            <Link className="landing-primary" href="/login">{content.action} <span aria-hidden="true">→</span></Link>
          </div>
          <p className="landing-account-note">{content.accountNote}</p>
          <p className="landing-note">{content.publicNote}</p>
        </div>

        <div className="landing-visual" role="group" aria-label={content.previewLabel}>
          <div className="visual-topline"><span>DOMEL WORKSPACE</span><span>SUZHOU</span></div>
          <div className="visual-heading">{content.previewHeading}<br /><strong>{content.previewSubheading}</strong></div>
          <div className="visual-grid">
            <div className="visual-card visual-card-large"><span className="visual-index">01</span><strong>{content.dashboard}</strong><div className="visual-bars" aria-hidden="true"><i /><i /><i /></div><small>{content.dashboardNote}</small></div>
            <div className="visual-card visual-card-orange"><span className="visual-index">02</span><strong>{content.intelligence}</strong><small>{content.intelligenceNote}</small></div>
            <div className="visual-card visual-card-outline"><span className="visual-index">03</span><strong>{content.scenarios}</strong><small>{content.scenariosNote}</small></div>
          </div>
          <div className="visual-footer"><span>{content.from}</span><b aria-hidden="true">→</b><span>{content.to}</span></div>
        </div>
      </section>

      <section className="landing-how" aria-labelledby="how-it-works-title">
        <p className="landing-eyebrow">{content.stepsEyebrow}</p>
        <h2 id="how-it-works-title">{content.stepsTitle}</h2>
        <ol className="landing-steps">
          {content.steps.map((step, index) => (
            <li className="landing-step" key={index}>
              <span className="landing-step-number" aria-hidden="true">0{index + 1}</span>
              <div><h3>{step.title}</h3><p>{step.text}</p></div>
            </li>
          ))}
        </ol>
      </section>

      <section className="landing-team" aria-labelledby="team-title">
        <div><p className="landing-eyebrow">{content.teamEyebrow}</p><h2 id="team-title">{content.teamTitle}</h2></div>
        <div className="landing-team-copy">{content.teamLines.map((line, index) => <p key={index}>{line}</p>)}</div>
      </section>

      <footer className="landing-footer"><span>© 2026 Domel Workspace</span><span>{content.footer}</span></footer>
    </main>
  );
}
