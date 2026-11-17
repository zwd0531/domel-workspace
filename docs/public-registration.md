# Public account registration

Domel has a real email-and-password registration form at `/register`, linked from `/login`. It calls Supabase Auth from a server action. After migration `0012`, the `on_auth_user_created` database trigger creates a profile and atomically assigns all five application roles to each new Domel public signup: Sales Coordinator, Production Planner, Quality Engineer, Decision Owner and Administrator. The browser cannot choose a different role policy. This is the project owner's full-access registration policy.

## Apply the full-access policy

Run `db/migrations/0012_public_registration_all_roles.sql` once in the connected Supabase project's SQL Editor after migrations `0001` through `0011`. Apply this database migration before publishing the updated registration page. A Git push or Vercel deployment does not execute Supabase SQL migrations.

The change applies to future signups made through Domel (`domel_registration = public`). It does not change existing users or separately created Auth accounts. Reapplying the migration is safe. To restore the earlier default for future signups, run `0011_public_registration_default_roles.sql`; this does not remove roles already granted by `0012`.

## Account journey

1. A visitor enters a name, email address and a new password of at least 8 characters. Existing six-character passwords still work for sign-in.
2. With email confirmation enabled, Supabase sends a confirmation link. The visitor follows it and signs in with their password. If confirmation is disabled, the new session enters `/dashboard` immediately.
3. The new profile appears in the Administrator's User access directory with all five roles. The user can switch among the three operational dashboards, use Industry Intelligence and Scenario Planning, and open Administration. Database role checks and controlled write functions continue to enforce the assigned permissions.

## Supabase project settings

In Authentication > Providers > Email, enable email signup and keep Confirm email enabled. In Authentication > URL Configuration, set the Site URL to `https://domel-workspace.vercel.app` and allow `https://domel-workspace.vercel.app/login?confirmed=1` as a redirect URL. Add a localhost redirect for local email tests only if needed.

The default Supabase confirmation template can stay in place. After verification it redirects to Domel's login page, where the visitor signs in normally. No custom template or service-role key is needed.

Supabase's built-in email sender only delivers to addresses belonging to the project's organization team and is limited to 2 emails per hour. It cannot complete confirmation for arbitrary public users. **Enable custom SMTP (or a Send Email Auth Hook) before inviting anyone outside the Supabase team.** The sign-up form reports an explicit error when Supabase rejects an unauthorized recipient. Keep SMTP credentials in the Supabase dashboard, never in this repository.

### No-domain demo option

If external users must register before an SMTP sender is available, an Administrator may turn off **Authentication > Sign In / Providers > Confirm email** in Supabase. The sign-up action handles the resulting immediate session and sends a new user to `/dashboard`; no email is sent and no custom domain is needed. This setting means Supabase treats any submitted address as confirmed even when the registrant does not control it. Use this mode only for a limited demonstration. Re-enable confirmation after SMTP is available; earlier accounts are not retroactively verified.

## Acceptance check

Use an email address you control. Register from `/register`. With email confirmation on, follow the email link and sign in; with confirmation off, check that registration signs you in immediately. Confirm all five roles appear under `/admin`; check all three dashboard views, Industry Intelligence, Scenario Planning and Administration. Sign out and sign in again with the same credentials. Invalid forms and mismatched passwords should show clear messages. Do not reuse an existing account as the new-registration test.
