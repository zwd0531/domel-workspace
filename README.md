# Domel Decision Workspace

This directory is the formal project foundation for the existing offline Feature 2 demo. The original HTML remains unchanged and available for demonstrations while the production system is migrated by vertical slice.

## First milestone completed in source

- Next.js and TypeScript project structure;
- versioned, framework-independent scenario calculation module;
- explicit permission matrix for five application roles;
- server-side scenario calculation endpoint protected by authentication and permissions;
- Supabase server client and authorization-context adapter;
- PostgreSQL schema with separated operations, sales and cost data;
- Row Level Security policies, audit records and immutable scenario snapshots;
- fictional seed data kept separate from migrations;
- unit tests for formulas and sensitive permissions;
- Docker standalone deployment configuration and health endpoint.

## Second milestone completed in source

- formal email/password login using Supabase Auth cookies;
- no public registration or role selection on the login page;
- Next.js Proxy session refresh with secure authorization repeated in the data layer;
- database-backed Sales, Production Planner and Quality Engineer dashboards;
- role-specific KPIs, product records, work queues, filters and CSV export;
- server-authorized work-item status updates;
- sales, production, quality and cost facts split into separate permission boundaries;
- weighted production and quality summary calculations;
- responsive visual styling retained from the offline demo.

## Third milestone completed in source

- Decision Owner and Admin-only scenario planning workspace;
- database-derived sales, capacity and cost baselines;
- live transparent formula preview with rule-based risks and evidence gaps;
- PostgreSQL-controlled scenario saving that recalculates every result server-side;
- immutable versioned snapshots with rationale and audit events;
- saved-scenario loading and snapshot history;
- controlled evidence creation with publisher, URL, fact, interpretation and limitations;
- evidence-to-scenario linking committed in the same transaction as the snapshot;
- direct browser inserts blocked for calculated snapshots and evidence creation.

## Third main feature completed in source

- authenticated Industry Intelligence workspace for every application role;
- evidence search plus topic and review-status filters;
- fact, working interpretation and limitation fields kept visibly separate;
- source-review states with reviewer notes, timestamps and audit events;
- Decision Owner and Admin-only evidence creation and review;
- server-authorized CSV export with spreadsheet-formula neutralization;
- scenario-link usage counts for authorized decision roles;
- eleven attributed public-source records migrated from the offline prototype as UAT seed data.

## Fourth milestone completed in source

- conditional decision submission bound to one selected immutable scenario snapshot;
- scenario-owner or Admin submission with a single pending decision per scenario;
- four-eyes approval that blocks the submitter from approving or rejecting their own decision;
- mandatory rejection notes and preserved decision history;
- submitted, approved and archived scenarios locked against additional snapshots;
- database-controlled state transitions, audit events and workflow notifications;
- per-user notification read state with Row Level Security;
- role-denial, self-approval and workflow-integrity tests;
- two-account Supabase UAT procedure in `docs/decision-workflow-uat.md`.

## Fifth milestone completed in source

- Administrator-only operations console and navigation;
- monthly sales, production, quality and cost CSV templates;
- server-side CSV parsing with strict columns, ranges, duplicate detection, 1 MB and 500-row limits;
- explicit preview with no database mutation before commit;
- atomic PostgreSQL upserts with completed/failed import-run records and audit events;
- direct authenticated writes revoked from operational fact, import-run and role-assignment tables;
- controlled role assignment with audit notification and final-active-Administrator protection;
- environment preflight that checks Supabase configuration without printing secrets;
- production/UAT evidence checklist in `docs/production-readiness.md`.

## Scenario AI assumption MVP completed in source

- interactive assumption analysis inside Scenario Planning;
- English and Chinese local parsing for demand, price, variable cost, fixed cost, capacity and capex statements;
- completeness score, confidence, strengths, concerns, missing information and suggested wording;
- recognized percentage changes can be applied to editable scenario fields before saving;
- DeepSeek JSON analysis using the same server-only provider configuration as Industry Intelligence;
- automatic fallback to the local analyzer when no API key is configured or the provider is unavailable;
- simple database history linked to saved scenarios and snapshots.

## Industry Intelligence research-agent MVP completed in source

- user-defined research briefs inside the existing Industry Intelligence workspace;
- live public-web discovery through DeepSeek Search with attributed URLs, dates and source metadata;
- DeepSeek JSON synthesis that keeps source facts, working interpretation and limitations separate;
- search-only fallback that preserves useful sources if model synthesis is unavailable;
- Decision Owner and Admin one-click promotion of selected findings into the existing unverified evidence workflow;
- saved findings automatically appear in Scenario Planning's existing evidence bridge;
- simple creator-owned database history for research briefs and structured results;
- API credentials kept server-only through runtime environment variables.

## Local SQLite demonstration mode

The formal Supabase implementation remains the deployment target. For immediate presentation and local review, an explicitly opt-in SQLite mode now provides:

- automatic fictional seed data for products, monthly facts, work queues, evidence and a saved scenario;
- a local demonstration Administrator session without a login dependency;
- persistent evidence, scenario snapshots, AI analyses and Industry Intelligence research history;
- live DeepSeek research when `DEEPSEEK_API_KEY` is supplied only to the server process;
- a visible `LOCAL SQLITE DEMO` environment label so demonstration data cannot be mistaken for a formal deployment.

Start it with:

```text
pnpm demo
```

The runtime database is created at `data/domel-demo.sqlite` and is excluded from Git. Delete that file while the server is stopped to reset the fictional seed data.

For a Linux/Docker presentation server, follow `deploy/README.md`. The Compose profile mounts `/app/data` as a persistent named volume and reads DeepSeek credentials only from the runtime environment.

## Local setup

1. Copy `.env.example` to `.env.local` and fill in the Supabase URL and publishable key.
2. Configure `DEEPSEEK_API_KEY` as a server runtime secret to enable live Industry Intelligence research; do not expose it with a `NEXT_PUBLIC_` name.
3. Apply every SQL file under `db/migrations` in filename order to a new Supabase/PostgreSQL environment.
4. Create the first user, insert its `profiles` row, and assign the `admin` role through a trusted SQL/admin session.
5. Run `db/seed/demo.sql` only in a development or UAT database.
6. Install and validate:

```text
pnpm install
pnpm preflight:env
pnpm test
pnpm typecheck
pnpm lint
pnpm build
pnpm dev
```

Open `/api/health` to verify the running service and formula version.

## Security rules

- Do not put service-role keys in browser code or commit them to the repository.
- Do not allow public self-registration to assign application roles.
- Financial fields live in a separate table and require `decision_owner` or `admin` access.
- Scenario results submitted by a browser are never authoritative; the server recalculates them.
- The permission matrix and data definitions must be reviewed with the business owner before real data is imported.

## Next implementation slice

Configure the simple Supabase environment, apply migrations `0001` through `0010`, seed demonstration data and run the first authenticated end-to-end UAT path.
