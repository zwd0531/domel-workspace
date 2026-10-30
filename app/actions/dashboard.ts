"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isAppRole } from "@/domain/permissions/policy";
import { getAuthorizationContext } from "@/server/auth/context";
import { createSupabaseServerClient } from "@/server/supabase/server";

const workItemIdSchema = z.string().min(1).max(100);

export async function toggleWorkItem(formData: FormData) {
  const id = workItemIdSchema.safeParse(formData.get("id"));
  if (!id.success) return;

  const auth = await getAuthorizationContext();
  if (!auth) redirect("/login");

  const supabase = await createSupabaseServerClient();
  const { data: item, error } = await supabase
    .from("work_items")
    .select("assigned_role,assigned_user_id,status")
    .eq("id", id.data)
    .single();

  if (error || !item || !isAppRole(String(item.assigned_role))) return;

  const authorized = item.assigned_user_id === auth.userId || auth.roles.includes(item.assigned_role) ||
    auth.roles.includes("decision_owner") || auth.roles.includes("admin");
  if (!authorized) return;

  await supabase.from("work_items").update({
    status: item.status === "completed" ? "open" : "completed",
    updated_at: new Date().toISOString(),
  }).eq("id", id.data);

  revalidatePath("/dashboard");
}
