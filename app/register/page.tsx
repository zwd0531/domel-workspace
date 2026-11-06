import Link from "next/link";
import { signUp } from "@/app/actions/auth";
import { AuthStory } from "@/components/auth/auth-story";
import { AuthTabs } from "@/components/auth/auth-tabs";
import { LanguageToggle } from "@/components/i18n/language-toggle";
import { SIGNUP_PASSWORD_MIN_LENGTH } from "@/server/auth/config";

export const dynamic = "force-dynamic";

type RegisterPageProps = {
  searchParams: Promise<{ error?: string; status?: string }>;
};

const ERROR_MESSAGES: Record<string, string> = {
  "invalid-form": "Enter your name, a valid email and a password of at least 8 characters.",
  "password-mismatch": "The passwords do not match.",
  "rate-limited": "Too many registration attempts. Please try again later.",
  "email-not-authorized": "Confirmation email could not be sent to this address. Please contact the administrator.",
  "already-registered": "An account with this email already exists. Sign in instead.",
  "signup-failed": "We could not create your account. Please try again later.",
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;
  const errorMessage = params.error ? ERROR_MESSAGES[params.error] : null;

  return (
    <main className="auth-main">
      <div className="auth-language"><LanguageToggle /></div>
      <div className="login-layout">
        <AuthStory />
        <section className="panel login-form">
          <AuthTabs active="register" />
          <span className="eyebrow">EMPLOYEE WORKSPACE</span>
          <h2>Create your account</h2>
          <p className="muted small">Create a Domel account with your email. An administrator will then assign your workspace role.</p>
          {params.status === "check-email" ? <div className="auth-message ok" role="status"><p>Check your inbox and spam folder for the confirmation link. After confirming, sign in and wait for a role assignment.</p><Link href="/register">Use another email</Link></div> : null}
          {errorMessage ? <p className="auth-message error" role="alert">{errorMessage}</p> : null}
          {params.status !== "check-email" ? <form action={signUp}>
            <div className="auth-fields">
              <div className="field"><label htmlFor="register-name">Your name</label><input id="register-name" name="displayName" type="text" autoComplete="name" required minLength={1} maxLength={120} /></div>
              <div className="field"><label htmlFor="register-email">Email address</label><input id="register-email" name="email" type="email" autoComplete="email" required maxLength={160} placeholder="name@example.com" /></div>
              <div className="field"><label htmlFor="register-password">Create password</label><input id="register-password" name="password" type="password" autoComplete="new-password" required minLength={SIGNUP_PASSWORD_MIN_LENGTH} maxLength={200} /><small className="muted">Use at least 8 characters.</small></div>
              <div className="field"><label htmlFor="register-confirm">Confirm password</label><input id="register-confirm" name="confirmPassword" type="password" autoComplete="new-password" required minLength={SIGNUP_PASSWORD_MIN_LENGTH} maxLength={200} /></div>
            </div>
            <button className="btn primary full auth-submit" type="submit">Create account →</button>
          </form> : null}
          <p className="auth-note">Your account is created in Supabase Auth. Application access begins after an administrator assigns your role.</p>
        </section>
      </div>
    </main>
  );
}
