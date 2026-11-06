# Public account registration

Domel has a real email-and-password registration form at `/register`, linked from `/login`. It calls Supabase Auth from a server action. The existing `on_auth_user_created` database trigger creates a profile using the supplied display name. Registration never accepts an application role from the browser.

## Account journey

1. A visitor enters a name, email address and a new password of at least 8 characters. Existing six-character passwords still work for sign-in.
2. With email confirmation enabled, Supabase sends a confirmation link. The visitor follows it and signs in with their password. If confirmation is disabled, the new session enters `/access-pending` immediately.
3. The new profile appears in the Administrator's User access directory with no roles. An Administrator assigns the appropriate role there. Until then, the visitor sees `/access-pending` and cannot load business pages.

## Supabase project settings

In Authentication > Providers > Email, enable email signup and keep Confirm email enabled. In Authentication > URL Configuration, set the Site URL to `https://domel-workspace.vercel.app` and allow `https://domel-workspace.vercel.app/login?confirmed=1` as a redirect URL. Add a localhost redirect for local email tests only if needed.

The default Supabase confirmation template can stay in place. After verification it redirects to Domel's login page, where the visitor signs in normally. No custom template or service-role key is needed.

Supabase's default email sender is rate limited and intended for small tests. Configure a custom SMTP provider before inviting larger groups of real users. Keep the confirmation URL and sender settings in the Supabase dashboard; they are not stored in this repository.

## Acceptance check

Use an email inbox you control. Register from `/register`, verify that the confirmation email arrives, follow its link, sign in, and confirm `/access-pending` appears. As an Administrator, find the new profile under `/admin`, assign a role, then refresh `/dashboard` as the new user and confirm only the assigned view is available. An invalid form, mismatched passwords and an unconfirmed email should show clear messages. Do not reuse the Administrator account as the registration test.
