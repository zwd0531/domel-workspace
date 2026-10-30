import Link from "next/link";
import { isSupabaseConfigured } from "@/server/supabase/server";

export const dynamic = "force-dynamic";

export default function SetupPage() {
  const configured = isSupabaseConfigured();
  return (
    <main>
      <section className="status-card">
        <span className="eyebrow">FORMAL PROJECT SETUP</span>
        <h1>{configured ? "Authentication is configured." : "Connect the project database."}</h1>
        {configured ? (
          <p><Link className="btn primary" href="/login">Continue to login</Link></p>
        ) : (
          <>
            <p>Copy <code>.env.example</code> to <code>.env.local</code> and enter the Supabase project URL and publishable key.</p>
            <p>Then apply the SQL files under <code>db/migrations</code> and create the first administrator account.</p>
          </>
        )}
      </section>
    </main>
  );
}
