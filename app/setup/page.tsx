import Link from "next/link";
import { LanguageToggle } from "@/components/i18n/language-toggle";
import { isSupabaseConfigured } from "@/server/supabase/server";
import { isDemoMode } from "@/server/demo/config";

export const dynamic = "force-dynamic";

export default function SetupPage() {
  if (isDemoMode()) return <main><section className="status-card"><div className="status-language"><LanguageToggle /></div><span className="eyebrow">LOCAL DEMONSTRATION</span><h1>SQLite demo mode is active.</h1><p>The local database is ready with fictional seed data. Formal Supabase configuration remains unchanged.</p><p><Link className="btn primary" href="/dashboard">Open the workspace</Link></p></section></main>;
  const configured = isSupabaseConfigured();
  return (
    <main>
      <section className="status-card">
        <div className="status-language"><LanguageToggle /></div>
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
