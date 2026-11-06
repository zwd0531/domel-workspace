import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  signUp: vi.fn(),
  origin: "https://domel-workspace.vercel.app",
}));

vi.mock("next/navigation", () => ({
  redirect: (path: string) => { throw new Error(`REDIRECT:${path}`); },
}));
vi.mock("next/headers", () => ({
  headers: async () => ({ get: (name: string) => name === "origin" ? mocks.origin : null }),
}));
vi.mock("@/server/demo/config", () => ({ isDemoMode: () => false }));
vi.mock("@/server/supabase/server", () => ({
  isSupabaseConfigured: () => true,
  createSupabaseServerClient: async () => ({ auth: { signUp: mocks.signUp } }),
}));

import { signUp } from "@/app/actions/auth";

function registration(values: Record<string, string> = {}) {
  const form = new FormData();
  const fields = {
    displayName: "  Test User  ",
    email: "  TEST@example.com  ",
    password: "example-password-123",
    confirmPassword: "example-password-123",
    ...values,
  };
  Object.entries(fields).forEach(([key, value]) => form.set(key, value));
  form.set("role", "admin");
  return form;
}

describe("public registration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.origin = "https://domel-workspace.vercel.app";
  });

  it("creates an Auth user with normalized profile metadata and no self-selected role", async () => {
    mocks.signUp.mockResolvedValue({ data: { user: { id: "new-user" }, session: null }, error: null });
    await expect(signUp(registration())).rejects.toThrow("REDIRECT:/register?status=check-email");
    expect(mocks.signUp).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "example-password-123",
      options: {
        data: { display_name: "Test User", domel_registration: "public" },
        emailRedirectTo: "https://domel-workspace.vercel.app/login?confirmed=1",
      },
    });
  });

  it("rejects mismatched passwords before contacting Supabase", async () => {
    await expect(signUp(registration({ confirmPassword: "different-password" }))).rejects.toThrow("REDIRECT:/register?error=password-mismatch");
    expect(mocks.signUp).not.toHaveBeenCalled();
  });

  it("sends an immediately authenticated new user to the dashboard", async () => {
    mocks.signUp.mockResolvedValue({ data: { user: { id: "new-user" }, session: { access_token: "test" } }, error: null });
    await expect(signUp(registration())).rejects.toThrow("REDIRECT:/dashboard");
  });

  it("explains when the default mailer rejects an external address", async () => {
    mocks.signUp.mockResolvedValue({ data: { user: null, session: null }, error: { code: "email_address_not_authorized" } });
    await expect(signUp(registration())).rejects.toThrow("REDIRECT:/register?error=email-not-authorized");
  });

  it("directs an existing account to sign in", async () => {
    mocks.signUp.mockResolvedValue({ data: { user: null, session: null }, error: { code: "user_already_exists" } });
    await expect(signUp(registration())).rejects.toThrow("REDIRECT:/register?error=already-registered");
  });
});
