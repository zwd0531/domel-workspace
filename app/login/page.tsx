import { signIn } from "@/app/actions/auth";
import { AUTH_PASSWORD_MIN_LENGTH } from "@/server/auth/config";

export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams: Promise<{ error?: string; next?: string }>;
};

const ERROR_MESSAGES: Record<string, string> = {
  "invalid-form": `Enter a valid work email and a password of at least ${AUTH_PASSWORD_MIN_LENGTH} characters.`,
  "invalid-credentials": "The email or password is incorrect, or this account is not active.",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const errorMessage = params.error ? ERROR_MESSAGES[params.error] : null;

  return (
    <main className="auth-main">
      <div className="login-layout">
        <section className="login-story">
          <span className="eyebrow">DOMEL SUZHOU · EMPLOYEE WORKSPACE</span>
          <h1>
            One workspace.
            <br />Three employee views.
          </h1>
          <p className="lead">
            Explore the same household vacuum product records through the information each role needs.
          </p>
          <LoginFeature number="01" title="Sales Coordinator" description="Orders, prices and customer shipments" />
          <LoginFeature number="02" title="Production Planner" description="Plans, output and delivery performance" />
          <LoginFeature number="03" title="Quality Engineer" description="Testing, defects and product risks" />
        </section>

        <section className="panel login-form">
          <span className="eyebrow">EMPLOYEE WORKSPACE</span>
          <h2>Log in to your view</h2>
          <p className="muted small">Your role is assigned by an administrator.</p>
          {errorMessage ? <p className="auth-message error" role="alert">{errorMessage}</p> : null}
          <form action={signIn}>
            <input type="hidden" name="next" value={params.next ?? "/dashboard"} />
            <div className="auth-fields">
              <div className="field">
                <label htmlFor="auth-email">Work or university email</label>
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

function LoginFeature({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="login-feature">
      <span>{number}</span>
      <div><strong>{title}</strong><p>{description}</p></div>
    </div>
  );
}
