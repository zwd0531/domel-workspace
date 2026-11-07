import Image from "next/image";
import Link from "next/link";

const capabilities = [
  {
    number: "01",
    title: "Role-based dashboard",
    text: "Give sales, production, and quality teams the metrics that matter to their work.",
    accent: "blue",
  },
  {
    number: "02",
    title: "Scenario planning",
    text: "Adjust demand, price, cost, and capacity assumptions to compare possible outcomes.",
    accent: "orange",
  },
  {
    number: "03",
    title: "Industry intelligence",
    text: "Organise external information around business questions and connect signals to decisions.",
    accent: "green",
  },
];

export function Homepage() {
  return (
    <main className="landing-page">
      <header className="landing-header">
        <Link className="landing-brand" href="/" aria-label="Domel Workspace 首页">
          <Image src="/domel-logo.png" alt="Domel" width={1800} height={578} priority />
          <span>Workspace</span>
        </Link>
        <div className="landing-header-meta">
          <span className="landing-status"><i aria-hidden="true" /> Domel Suzhou</span>
          <Link className="landing-login-link" href="/login">Log in <span aria-hidden="true">↗</span></Link>
        </div>
      </header>

      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-hero-copy">
          <p className="landing-eyebrow"><span aria-hidden="true" /> DOMEL SUZHOU · DECISION WORKSPACE</p>
          <h1 id="landing-title">Turn insight into<br /><em>clearer action.</em></h1>
          <p className="landing-lead">Domel Workspace brings dashboards, scenario planning, and industry intelligence into one focused space for faster, better-informed decisions.</p>
          <div className="landing-actions">
            <Link className="landing-primary" href="/login">Open workspace <span aria-hidden="true">→</span></Link>
            <a className="landing-secondary" href="#capabilities">Explore capabilities <span aria-hidden="true">↓</span></a>
          </div>
          <p className="landing-note"><span aria-hidden="true">i</span> Internal decision support for Domel Suzhou operations</p>
        </div>

        <div className="landing-visual" aria-label="Domel Workspace 三项核心能力概览">
          <div className="visual-topline"><span>DOMEL WORKSPACE</span><span>2026 / SUZHOU</span></div>
          <div className="visual-heading">One workspace.<br /><strong>Three decision views.</strong></div>
          <div className="visual-grid">
            <div className="visual-card visual-card-large"><span className="visual-index">01</span><strong>Business<br />Dashboard</strong><div className="visual-bars"><i /><i /><i /></div><small>Role-based overview</small></div>
            <div className="visual-card visual-card-orange"><span className="visual-index">02</span><strong>Scenario<br />Planning</strong><small>Compare possible outcomes</small></div>
            <div className="visual-card visual-card-outline"><span className="visual-index">03</span><strong>Industry<br />Intelligence</strong><small>Connect external signals</small></div>
          </div>
          <div className="visual-footer"><span>FROM DATA</span><b aria-hidden="true">→</b><span>TO DECISIONS</span></div>
        </div>
      </section>

      <section className="landing-capabilities" id="capabilities" aria-labelledby="capabilities-title">
        <div className="section-heading"><div><p className="landing-eyebrow">核心能力</p><h2 id="capabilities-title">A clearer way to<br />make every decision.</h2></div><p>From business visibility to scenario comparison and external signals, every step stays clear, traceable, and actionable.</p></div>
        <div className="capability-grid">
          {capabilities.map((capability) => <article className={`capability-card ${capability.accent}`} key={capability.number}><span className="capability-number">{capability.number}</span><h3>{capability.title}</h3><p>{capability.text}</p><span className="capability-arrow" aria-hidden="true">↗</span></article>)}
        </div>
      </section>

      <section className="landing-cta">
        <div><p className="landing-eyebrow">READY TO EXPLORE?</p><h2>Start with a<br />clearer view.</h2></div>
        <div className="landing-cta-side"><p>登录后，系统会根据你的岗位展示对应的业务信息与工作内容。</p><Link className="landing-primary" href="/login">登录 Domel Workspace <span aria-hidden="true">→</span></Link></div>
      </section>

      <footer className="landing-footer"><span>© 2026 Domel Workspace</span><span>内部决策支持空间 · 苏州运营</span></footer>
    </main>
  );
}
