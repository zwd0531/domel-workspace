import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { assumptionAnalysisRequestSchema } from "@/domain/ai/assumption-analysis";

describe("local SQLite demonstration mode", () => {
  it("remains explicitly opt-in and separate from formal Supabase mode", () => {
    const config = readFileSync(new URL("../server/demo/config.ts", import.meta.url), "utf8");
    const proxy = readFileSync(new URL("../server/supabase/proxy.ts", import.meta.url), "utf8");
    expect(config).toContain('process.env.DOMEL_DEMO_MODE === "true"');
    expect(proxy).toContain("if (isDemoMode())");
    expect(proxy).toContain("NEXT_PUBLIC_SUPABASE_URL");
  });

  it("persists demonstration records in ignored SQLite runtime files", () => {
    const database = readFileSync(new URL("../server/demo/database.ts", import.meta.url), "utf8");
    const ignore = readFileSync(new URL("../.gitignore", import.meta.url), "utf8");
    expect(database).toContain('new DatabaseSync(join(directory, "domel-demo.sqlite"))');
    expect(database).toContain("create table if not exists scenario_snapshots");
    expect(database).toContain("create table if not exists research_runs");
    expect(ignore).toContain("data/*.sqlite");
  });

  it("ships a persistent Docker presentation profile without embedded credentials", () => {
    const dockerfile = readFileSync(new URL("../Dockerfile", import.meta.url), "utf8");
    const nextConfig = readFileSync(new URL("../next.config.ts", import.meta.url), "utf8");
    const compose = readFileSync(new URL("../deploy/docker-compose.demo.yml", import.meta.url), "utf8");
    expect(dockerfile).toContain("DOMEL_STANDALONE_BUILD=true");
    expect(dockerfile).toContain('VOLUME ["/app/data"]');
    expect(dockerfile).toContain("/api/health");
    expect(compose).toContain("domel-demo-data:/app/data");
    expect(compose).toContain("${DEEPSEEK_API_KEY:-}");
    expect(compose).not.toMatch(/sk-[a-z0-9]{16,}/i);
    expect(nextConfig).toContain('process.env.DOMEL_STANDALONE_BUILD === "true"');
  });

  it("accepts the project database UUID format for saved demo scenarios", () => {
    const parsed = assumptionAnalysisRequestSchema.safeParse({
      text: "Demand is expected to grow 12% during 2027 based on the named market report.",
      scenarioId: "50000000-0000-0000-0000-000000000001",
      snapshotId: "60000000-0000-0000-0000-000000000001",
      inputs: { quantity: 8200, price: 86, cost: 54, fixed: 118000, capacity: 9000, capex: 0, demand: 12 },
    });
    expect(parsed.success).toBe(true);
  });

  it("keeps the formal Supabase seed aligned with the current demo path", () => {
    const seed = readFileSync(new URL("../db/seed/demo.sql", import.meta.url), "utf8");
    expect(seed).toContain("EC Ventilation Motor 180");
    expect(seed).toContain("Germany HVAC growth case");
    expect(seed).toContain("Confirm November capacity");
    expect(seed).toContain("'50000000-0000-0000-0000-000000000001'");
    expect(seed).toContain("'60000000-0000-0000-0000-000000000001'");
  });
});
