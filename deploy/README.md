# Domel deployment profiles

## Fast presentation server: Docker + SQLite

This profile runs the explicitly labelled `LOCAL SQLITE DEMO` experience with fictional seed data. It has no formal multi-user authentication and should be placed behind a private link, VPN or reverse-proxy password if it is reachable from the public internet.

Requirements on the target server:

- Docker Engine with Compose;
- outbound HTTPS access to `api.deepseek.com` when live research is required;
- a persistent Docker volume for `/app/data`.

Set `DEEPSEEK_API_KEY` through the host shell or the hosting platform's secret manager. Do not add the value to this repository or to the Compose file. Then run from the project root:

```text
docker compose -f deploy/docker-compose.demo.yml up -d --build
node scripts/verify-demo-deployment.mjs http://127.0.0.1:3000
```

The named volume `domel-demo-data` preserves evidence, scenario snapshots, AI analyses and research history across container replacements. Removing that volume resets the fictional demo database and is destructive.

## Formal server: Supabase

For multi-user use, keep `DOMEL_DEMO_MODE=false`, configure the Supabase runtime values, apply migrations `0001` through `0010`, create the initial Administrator and follow `docs/production-readiness.md`. Do not mount or migrate the SQLite demonstration file into the formal environment.

## Health endpoint

`GET /api/health` returns the service state, formula version and active runtime profile without revealing credentials. A healthy SQLite presentation server reports `mode: local_sqlite_demo`.
