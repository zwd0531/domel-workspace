import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const envPath = resolve(root, ".env.local");
const requiredMigrations = [
  "0001_initial_schema.sql",
  "0002_auth_profile_trigger.sql",
  "0003_split_operational_permissions.sql",
  "0004_secure_scenario_workspace.sql",
  "0005_industry_intelligence_review.sql",
  "0006_conditional_decision_workflow.sql",
  "0007_admin_import_console.sql",
];

const failures = [];
if (!existsSync(envPath)) {
  failures.push(".env.local is missing.");
} else {
  const values = Object.fromEntries(readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .filter((line) => /^[A-Za-z_][A-Za-z0-9_]*=/.test(line))
    .map((line) => line.split(/=(.*)/s).slice(0, 2)));
  const url = values.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const key = values.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? "";
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url) || url.includes("your-project")) {
    failures.push("NEXT_PUBLIC_SUPABASE_URL is missing or still a placeholder.");
  }
  if (key.length < 20 || key.includes("replace-with")) {
    failures.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is missing or still a placeholder.");
  }
}

const migrations = new Set(readdirSync(resolve(root, "db", "migrations")));
for (const migration of requiredMigrations) {
  if (!migrations.has(migration)) failures.push(`Required migration is missing: ${migration}.`);
}

if (failures.length) {
  console.error("Domel environment preflight: BLOCKED");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log("Domel environment preflight: READY");
  console.log(`- Supabase browser configuration is present (values hidden).`);
  console.log(`- ${requiredMigrations.length} required migrations are present.`);
}
