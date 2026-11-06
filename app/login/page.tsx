import { AuthStory } from "@/components/auth/auth-story";
import { AuthTabs } from "@/components/auth/auth-tabs";
import { signIn } from "@/app/actions/auth";
import { LanguageToggle } from "@/components/i18n/language-toggle";
import { AUTH_PASSWORD_MIN_LENGTH } from "@/server/auth/config";

export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams: Promise<{ error?: string; next?: string; confirmed?: string }>;
};

const ERROR_MESSAGES: Record<string, string> = {
  "invalid-form": `Enter a valid work email and a password of at least ${AUTH_PASSWORD_MIN_LENGTH} characters.`,
  "invalid-credentials": "The email or password is incorrect, or this account is not active.",
  "email-not-confirmed": "Confirm your email using the link we sent, then sign in.",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const errorMessage = params.error ? ERROR_MESSAGES[params.error] : null;

  return (
    <main className="auth-main">
      <div className="auth-language"><LanguageToggle /></div>
      <div className="login-layout">
        <AuthStory />

        <section className="panel login-form">
          <AuthTabs active="login" />
          <span className="eyebrow">EMPLOYEE WORKSPACE</span>
          <h2>Log in to your view</h2>
          <p className="muted small">Your workspace views follow your assigned roles.</p>
          {params.confirmed === "1" ? <p className="auth-message ok" role="status">Email confirmed. Sign in with the password you created.</p> : null}
          {errorMessage ? <p className="auth-message error" role="alert">{errorMessage}</p> : null}
          <form action={signIn}>
            <input type="hidden" name="next" value={params.next ?? "/dashboard"} />
            <div className="auth-fields">
              <div className="field">
                <label htmlFor="auth-email">Email address</label>
                <input id="auth-email" name="email" type="email" autoComplete="email" required maxLength={160} placeholder="name@example.com" />
              </div>
              <div className="field">
                <label htmlFor="auth-password">Password</label>
                <input id="auth-password" name="password" type="password" autoComplete="current-password" required minLength={AUTH_PASSWORD_MIN_LENGTH} maxLength={200} />
              </div>
            </div>
            <button className="btn primary full auth-submit" type="submit">Open my dashboard →</button>
          </form>
          <p className="auth-note">
            Formal account access. Passwords are verified by the authentication service, and application roles cannot be selected on this page.
          </p>
        </section>
      </div>
    </main>
  );
}
