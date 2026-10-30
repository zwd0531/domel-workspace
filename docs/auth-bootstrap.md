# Authentication bootstrap

The application intentionally has no public sign-up or role selector.

## Initial environment

1. Create a separate development or UAT Supabase project.
2. Copy `.env.example` to `.env.local` and add the project URL and publishable key.
3. Apply the SQL migrations in filename order.
4. Create employee accounts through a trusted Supabase administrator surface.
5. The `0002_auth_profile_trigger.sql` migration automatically creates each user's `profiles` row.
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

The first administrator must be assigned through a trusted database/admin session. Never add a browser endpoint that can promote the current user to `admin`.

## Verification checklist

- An account with no role reaches `/access-pending`.
- Sales can query `monthly_sales` but receives no production, quality or cost rows.
- Production Planner can query `monthly_production` but receives no sales, quality or cost rows.
- Quality Engineer can query `monthly_quality` but receives no sales, production or cost rows.
- Decision Owner can read the required baseline tables and use scenario functions.
- The CSV export contains only the signed-in role's authorized fields.
