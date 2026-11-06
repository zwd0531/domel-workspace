# Production readiness and environment gate

The source project can be built without a database. A production or UAT acceptance claim cannot be made until a real Supabase project is connected and the checks below are recorded.

## Environment preflight

1. Copy `.env.example` to `.env.local`.
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from the target Supabase project. Do not send these values through chat or commit `.env.local`.
3. Run `pnpm preflight:env`. The script checks presence and shape only and never prints the values.
4. Apply migrations `0001` through `0011` in filename order.
5. Create the first account and assign its `admin` role through the trusted Supabase SQL editor as documented in `auth-bootstrap.md`.

## Required UAT evidence

- Authentication: successful login, invalid login and sign-out.
- Public registration: new email account, profile creation, automatic assignment of the three operational roles, dashboard role switching, and continued restriction of Decision Owner and Administrator roles. With email confirmation enabled, also verify the confirmation link.
- Role boundaries: one account for each operational role plus two different decision-authorized accounts.
- Decision workflow: complete every check in `decision-workflow-uat.md`.
- Administration: prove non-admin denial for `/admin`, import preview and commit APIs, and role mutation.
- Import integrity: preview a valid template, reject an invalid row, commit a valid file, confirm the dashboard result and matching `import.completed` audit event.
- Atomicity: submit a file containing one invalid database reference and confirm no rows from that file were written.
- Last-admin control: attempt to remove the only remaining active Administrator and confirm rejection.
- Notifications: confirm the affected user receives the role-update notification and can mark only their own notification as read.
- AI assumptions: run once without `DEEPSEEK_API_KEY` to verify local mode, then configure the server-only key and confirm a DeepSeek result is stored with `engine = deepseek`.
- Industry research: configure `DEEPSEEK_API_KEY` as a runtime secret, run one cited research brief, save one finding as unverified evidence and confirm the matching research-history row.

Record account IDs, HTTP statuses, database object IDs and audit-event IDs. Screenshots alone are not sufficient evidence of database authorization.

## Production data boundary

The bundled CSV templates are structural examples. The definitions in `data-decisions.md` still require business-owner approval before real ERP, production, quality or finance data is imported. Do not run `db/seed/demo.sql` in production.

## SQLite demonstration boundary

`DOMEL_DEMO_MODE=true` bypasses formal authentication and uses fictional local data. It is only for a controlled presentation environment and is not production authorization evidence. Use the Docker profile in `deploy/README.md` behind private access when a quick demonstration server is needed.
