import { signOut } from "@/app/actions/auth";

export const dynamic = "force-dynamic";

export default function AccessPendingPage() {
  return (
    <main>
      <section className="status-card">
        <span className="eyebrow">ACCESS PENDING</span>
        <h1>Your account has no Domel workspace role yet.</h1>
        <p>An administrator must assign Sales, Production Planner, Quality Engineer, Decision Owner or Admin access.</p>
        <form action={signOut}><button className="btn" type="submit">Sign out</button></form>
      </section>
    </main>
  );
}
