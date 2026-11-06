"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/server/supabase/server";
import { isDemoMode } from "@/server/demo/config";
import { AUTH_PASSWORD_MIN_LENGTH, SIGNUP_PASSWORD_MIN_LENGTH } from "@/server/auth/config";

const signInSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(AUTH_PASSWORD_MIN_LENGTH).max(200),
  next: z.string().optional(),
});

const signUpSchema = z.object({
  displayName: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(SIGNUP_PASSWORD_MIN_LENGTH).max(200),
  confirmPassword: z.string(),
});

function safeReturnPath(value: string | undefined) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}

export async function signIn(formData: FormData) {
  if (isDemoMode()) redirect("/dashboard");
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

  if (error?.code === "email_not_confirmed") redirect("/login?error=email-not-confirmed");
  if (error) redirect("/login?error=invalid-credentials");
  redirect(safeReturnPath(parsed.data.next));
}

export async function signUp(formData: FormData) {
  if (isDemoMode()) redirect("/dashboard");
  const parsed = signUpSchema.safeParse({
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) redirect("/register?error=invalid-form");
  if (parsed.data.password !== parsed.data.confirmPassword) redirect("/register?error=password-mismatch");
  if (!isSupabaseConfigured()) redirect("/setup");

  const origin = (await headers()).get("origin");
  const emailRedirectTo = origin ? new URL("/login?confirmed=1", origin).toString() : undefined;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { display_name: parsed.data.displayName, domel_registration: "public" },
      emailRedirectTo,
    },
  });

  if (error?.status === 429 || error?.code === "over_email_send_rate_limit") redirect("/register?error=rate-limited");
  if (error?.code === "email_address_not_authorized") redirect("/register?error=email-not-authorized");
  if (error?.code === "user_already_exists" || error?.code === "email_exists") redirect("/register?error=already-registered");
  if (error || !data.user) redirect("/register?error=signup-failed");
  if (data.session) redirect("/dashboard");
  redirect("/register?status=check-email");
}

export async function signOut() {
  if (isDemoMode()) redirect("/dashboard");
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }
  redirect("/login");
}
