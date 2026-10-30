import { FORMULA_VERSION } from "@/domain/scenario/calculate";

export default function HomePage() {
  return (
    <main>
      <section className="status-card">
        <p>DOMEL · FORMAL PROJECT FOUNDATION</p>
        <h1>The production foundation is ready for interface migration.</h1>
        <p>
          Authentication adapters, database migrations, server-side permissions and the versioned
          scenario calculation core now have dedicated modules.
        </p>
        <p>
          Current formula version: <code>{FORMULA_VERSION}</code>
        </p>
      </section>
    </main>
  );
}
