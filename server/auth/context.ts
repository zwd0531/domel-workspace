import { isAppRole, type AppRole } from "@/domain/permissions/policy";
import { createSupabaseServerClient } from "@/server/supabase/server";

export type AuthorizationContext = {
  userId: string;
  email: string | null;
  roles: AppRole[];
};

export async function getAuthorizationContext(): Promise<AuthorizationContext | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const { data: rows, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  if (roleError) throw new Error(`Unable to load user roles: ${roleError.message}`);

  const roles = (rows ?? [])
    .map((row) => String(row.role))
    .filter(isAppRole);

  return { userId: user.id, email: user.email ?? null, roles };
}
