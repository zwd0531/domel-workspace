# Public account registration

Domel has a real email-and-password registration form at `/register`, linked from `/login`. It calls Supabase Auth from a server action. The `on_auth_user_created` database trigger creates a profile using the supplied display name and, after migration `0011`, atomically assigns Sales Coordinator, Production Planner and Quality Engineer to Domel public signups. Registration never accepts a requested role from the browser; Decision Owner and Administrator remain administrator-assigned.

## Account journey

1. A visitor enters a name, email address and a new password of at least 8 characters. Existing six-character passwords still work for sign-in.
2. With email confirmation enabled, Supabase sends a confirmation link. The visitor follows it and signs in with their password. If confirmation is disabled, the new session enters `/dashboard` immediately.
3. The new profile appears in the Administrator's User access directory with the three operational roles. The user can switch among those dashboard views; the server checks the selected role on every request and export. An Administrator may later change roles, including granting Decision Owner or Administrator access.

## Supabase project settings

In Authentication > Providers > Email, enable email signup and keep Confirm email enabled. In Authentication > URL Configuration, set the Site URL to `https://domel-workspace.vercel.app` and allow `https://domel-workspace.vercel.app/login?confirmed=1` as a redirect URL. Add a localhost redirect for local email tests only if needed.

The default Supabase confirmation template can stay in place. After verification it redirects to Domel's login page, where the visitor signs in normally. No custom template or service-role key is needed.

Supabase's built-in email sender only delivers to addresses belonging to the project's organization team and is limited to 2 emails per hour. It cannot complete confirmation for arbitrary public users. **Enable custom SMTP (or a Send Email Auth Hook) before inviting anyone outside the Supabase team.** The sign-up form reports an explicit error when Supabase rejects an unauthorized recipient. Keep SMTP credentials in the Supabase dashboard, never in this repository.

### No-domain demo option

If external users must register before an SMTP sender is available, an Administrator may turn off **Authentication > Sign In / Providers > Confirm email** in Supabase. The sign-up action handles the resulting immediate session and sends a new user to `/dashboard`; no email is sent and no custom domain is needed. This setting means Supabase treats any submitted address as confirmed even when the registrant does not control it. Use this mode only for a limited demonstration. Re-enable confirmation after SMTP is available; earlier accounts are not retroactively verified.

## Acceptance check

Use an email address you control. Register from `/register`. With email confirmation on, follow the email link and sign in; with confirmation off, check that registration signs you in immediately. Confirm the three roles appear under `/admin`, switch among the three dashboard views, and check that Scenario Planning and Administration stay unavailable. An invalid form and mismatched passwords should show clear messages. Do not reuse the Administrator account as the registration test.
