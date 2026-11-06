# Vercel deployment

This is the recommended lightweight production path for the formal Supabase-backed project. Vercel hosts the Next.js application; Supabase remains the authentication and PostgreSQL service.

## 1. Source repository

Create a private GitHub repository and push the current `main` branch. Confirm that `.env.local`, runtime SQLite files and generated `.next` output are ignored before pushing.

## 2. Import into Vercel

Import the GitHub repository as a new Vercel project. Keep the detected framework as Next.js and use the repository root as the project root. The default build command (`pnpm build`) and install command are sufficient.

The Supabase project's Settings > Infrastructure screen confirms that its primary database is in South Asia (Mumbai), `ap-south-1`. `vercel.json` therefore runs the application's dynamic functions in Vercel's Mumbai region (`bom1`). Keep the function close to the database. Static assets continue to use Vercel's global CDN.

## 3. Runtime environment

Configure these values for Production, Preview and Development as appropriate:

| Variable | Visibility | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser-safe | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser-safe | Supabase publishable key |
| `DOMEL_DEMO_MODE` | Server | Must be `false` |
| `DEEPSEEK_API_KEY` | Secret | Scenario analysis and live research |
| `DEEPSEEK_MODEL` | Server | `deepseek-flash` for the current integration |

Do not configure `SUPABASE_SERVICE_ROLE_KEY`; the current application does not need it. Never prefix the DeepSeek key with `NEXT_PUBLIC_`.

## 4. Deploy and verify

Deploy the imported project, then verify:

1. `GET /api/health` returns `status: ok` and `mode: supabase_formal`.
2. The existing Supabase Authentication user can log in.
3. Dashboard, Scenario Planning, Industry Intelligence and Administration load the expected cloud records.
4. Scenario assumption analysis reports the `deepseek` engine.
5. One research-agent run returns cited sources and appears in research history.
6. The `X-Vercel-Id` response header for `/api/health` ends its region chain with `bom1` before the request identifier, confirming that the function runs in Mumbai.

For public registration, configure the Supabase Site URL and confirmation redirect described in `public-registration.md`. Verify a new email account and assign its role through `/admin` before sharing the registration link widely.

Keep the first deployment private or share the URL only with intended reviewers until real operational data and role-boundary UAT are approved.
