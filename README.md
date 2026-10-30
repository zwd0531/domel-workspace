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

## Local setup

1. Copy `.env.example` to `.env.local` and fill in the Supabase URL and publishable key.
2. Apply every SQL file under `db/migrations` in filename order to a new Supabase/PostgreSQL environment.
3. Create the first user, insert its `profiles` row, and assign the `admin` role through a trusted SQL/admin session.
4. Run `db/seed/demo.sql` only in a development or UAT database.
5. Install and validate:

```text
pnpm install
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

Add conditional decision submission and approval on top of a selected immutable snapshot, followed by workflow notifications and end-to-end role-denial tests.
