import { roleAssignmentSchema } from "@/domain/admin/schema";
import { canAny } from "@/domain/permissions/policy";
import { getAuthorizationContext } from "@/server/auth/context";
import { createSupabaseServerClient } from "@/server/supabase/server";

export async function POST(request: Request) {
  const auth = await getAuthorizationContext();
  if (!auth) return Response.json({ error: "Authentication required." }, { status: 401 });
  if (!canAny(auth.roles, "users:manage")) {
    return Response.json({ error: "Administrator user-management permission required." }, { status: 403 });
  }

  const parsed = roleAssignmentSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid role assignment.", details: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("set_user_roles", {
    p_user_id: parsed.data.userId,
    p_roles: parsed.data.roles,
  });
  if (error) {
    return Response.json(
      { error: error.code === "42501" ? "Administrator user-management permission denied." : "Unable to update user roles." },
      { status: error.code === "42501" ? 403 : 400 },
    );
  }
  return Response.json(data);
}
