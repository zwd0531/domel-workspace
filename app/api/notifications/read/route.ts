import { notificationReadSchema } from "@/domain/scenario/schema";
import { getAuthorizationContext } from "@/server/auth/context";
import { createSupabaseServerClient } from "@/server/supabase/server";

export async function POST(request: Request) {
  const auth = await getAuthorizationContext();
  if (!auth) return Response.json({ error: "Authentication required." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = notificationReadSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid notification record." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("workflow_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", parsed.data.notificationId)
    .eq("user_id", auth.userId);

  if (error) {
    return Response.json({ error: "Unable to mark the notification as read." }, { status: 400 });
  }

  return Response.json({ ok: true });
}
