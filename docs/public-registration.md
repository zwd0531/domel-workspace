# Public account registration

Domel has a real email-and-password registration form at `/register`, linked from `/login`. It calls Supabase Auth from a server action. The existing `on_auth_user_created` database trigger creates a profile using the supplied display name. Registration never accepts an application role from the browser.

## Account journey

1. A visitor enters a name, email address and a new password of at least 8 characters. Existing six-character passwords still work for sign-in.
2. With email confirmation enabled, Supabase sends a confirmation link. The visitor follows it and signs in with their password. If confirmation is disabled, the new session enters `/access-pending` immediately.
3. The new profile appears in the Administrator's User access directory with no roles. An Administrator assigns the appropriate role there. Until then, the visitor sees `/access-pending` and cannot load business pages.

## Supabase project settings

In Authentication > Providers > Email, enable email signup and keep Confirm email enabled. In Authentication > URL Configuration, set the Site URL to `https://domel-workspace.vercel.app` and allow `https://domel-workspace.vercel.app/login?confirmed=1` as a redirect URL. Add a localhost redirect for local email tests only if needed.

The default Supabase confirmation template can stay in place. After verification it redirects to Domel's login page, where the visitor signs in normally. No custom template or service-role key is needed.

Supabase's built-in email sender only delivers to addresses belonging to the project's organization team and is limited to 2 emails per hour. It cannot complete confirmation for arbitrary public users. **Enable custom SMTP (or a Send Email Auth Hook) before inviting anyone outside the Supabase team.** The sign-up form reports an explicit error when Supabase rejects an unauthorized recipient. Keep SMTP credentials in the Supabase dashboard, never in this repository.

### No-domain demo option

If external users must register before an SMTP sender is available, an Administrator may turn off **Authentication > Sign In / Providers > Confirm email** in Supabase. The sign-up action already handles the resulting immediate session and sends a new, roleless user to `/access-pending`; no email is sent and no custom domain is needed. This setting means Supabase treats any submitted address as confirmed even when the registrant does not control it. Keep role assignment Administrator-only and use this mode only for a limited demonstration. Re-enable confirmation after SMTP is available; earlier accounts are not retroactively verified.

## Acceptance check

Use an email inbox you control. Register from `/register`, verify that the confirmation email arrives, follow its link, sign in, and confirm `/access-pending` appears. As an Administrator, find the new profile under `/admin`, assign a role, then refresh `/dashboard` as the new user and confirm only the assigned view is available. An invalid form, mismatched passwords and an unconfirmed email should show clear messages. Do not reuse the Administrator account as the registration test.
