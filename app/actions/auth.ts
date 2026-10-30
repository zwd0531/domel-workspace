"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/server/supabase/server";

const signInSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(8).max(200),
  next: z.string().optional(),
});

function safeReturnPath(value: string | undefined) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}

export async function signIn(formData: FormData) {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") || undefined,
  });

  if (!parsed.success) redirect("/login?error=invalid-form");
  if (!isSupabaseConfigured()) redirect("/setup");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) redirect("/login?error=invalid-credentials");
  redirect(safeReturnPath(parsed.data.next));
}

export async function signOut() {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }
  redirect("/login");
}
