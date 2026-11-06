import Link from "next/link";

export function AuthTabs({ active }: { active: "login" | "register" }) {
  return (
    <nav className="auth-tabs" aria-label="Account access">
      <Link href="/login" aria-current={active === "login" ? "page" : undefined}>Sign in</Link>
      <Link href="/register" aria-current={active === "register" ? "page" : undefined}>Create account</Link>
    </nav>
  );
}
