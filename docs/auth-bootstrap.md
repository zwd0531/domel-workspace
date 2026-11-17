# Authentication bootstrap

The application offers public email-and-password registration. After migration `0012`, new Domel public signups automatically receive all five application roles, including Decision Owner and Administrator. See `public-registration.md` for the current signup flow and email settings.

## Initial environment

1. Create a separate development or UAT Supabase project.
2. Copy `.env.example` to `.env.local` and add the project URL and publishable key.
3. Apply the SQL migrations in filename order.
4. Create the first Administrator account through a trusted Supabase administrator surface. Subsequent users can register at `/register`.
5. The `0002_auth_profile_trigger.sql` migration automatically creates each user's `profiles` row. Migration `0012` assigns all five roles to new Domel public signups.
6. Assign roles from a trusted SQL/admin session.

Example role assignment after the account exists:

```sql
insert into public.user_roles (user_id, role, assigned_by)
values (
  '<employee-auth-user-id>',
  'sales',
  '<administrator-profile-id>'
);
```

Allowed roles are `sales`, `production_planner`, `quality_engineer`, `decision_owner` and `admin`.

## Bootstrap rule

The all-role signup default is configured by migration `0012` in a trusted database/admin session. Without that migration, the first administrator must be assigned through a trusted database/admin session. The registration form does not accept a requested role, and no new browser role-promotion endpoint is added.

After that first trusted assignment and migration `0007`, Administrators can use `/admin` to assign application roles. Every change is written through `set_user_roles`, audited and protected against removing the final active Administrator.

## Verification checklist

- A new Domel public signup has all five roles and can open every workspace module. Existing users retain their previous assignments; a separately created account with no role reaches `/access-pending`.
- Sales can query `monthly_sales` but receives no production, quality or cost rows.
- Production Planner can query `monthly_production` but receives no sales, quality or cost rows.
- Quality Engineer can query `monthly_quality` but receives no sales, production or cost rows.
- Decision Owner can read the required baseline tables and use scenario functions.
- Decision Owner can create evidence and save an owned scenario through the controlled database functions.
- A Decision Owner can inspect another owner's scenario but cannot save a new snapshot to it; an Admin can.
- Direct inserts into `scenario_snapshots`, `scenario_evidence`, `evidence_records` and `audit_events` are denied.
- Saving a scenario creates a recalculated snapshot, replaces its evidence links and writes an audit event in one transaction.
- Every assigned role can read and export Industry Intelligence records.
- Only Decision Owner and Admin can create or review evidence; follow-up and rejection require a reviewer note.
- Run `db/seed/demo.sql` after assigning the first Admin or Decision Owner so the eleven attributed UAT evidence records receive a valid creator and reviewer.
- The CSV export contains only the signed-in role's authorized fields.
