const target = process.argv.slice(2).find((value) => value !== "--");
const baseUrl = new URL(target ?? "http://127.0.0.1:3000");

const checks = [
  { path: "/dashboard", contains: ["LOCAL SQLITE DEMO", "EC Ventilation Motor 180"] },
  { path: "/scenarios", contains: ["Scenario planning workspace", "Germany HVAC growth case"] },
  { path: "/intelligence", contains: ["Industry Intelligence", "Run research agent"] },
  { path: "/admin", contains: ["Administration and data imports", "Domel Demo Administrator"] },
];

const failures = [];
const healthResponse = await fetch(new URL("/api/health", baseUrl));
const health = await healthResponse.json().catch(() => null);
if (!healthResponse.ok || health?.status !== "ok" || health?.mode !== "local_sqlite_demo") {
  failures.push(`health expected local_sqlite_demo, received HTTP ${healthResponse.status}`);
}

for (const check of checks) {
  const response = await fetch(new URL(check.path, baseUrl), { redirect: "manual" });
  const body = await response.text();
  if (response.status !== 200) failures.push(`${check.path} returned HTTP ${response.status}`);
  for (const marker of check.contains) {
    if (!body.includes(marker)) failures.push(`${check.path} is missing marker: ${marker}`);
  }
}

if (failures.length) {
  console.error("Domel demo deployment verification: FAILED");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log("Domel demo deployment verification: PASSED");
  console.log(`- ${checks.length} protected workspace pages returned the expected demo content.`);
  console.log("- Health endpoint confirmed the local_sqlite_demo runtime profile.");
}
