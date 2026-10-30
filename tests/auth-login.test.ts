import { describe, expect, it } from "vitest";
import { AUTH_PASSWORD_MIN_LENGTH } from "@/server/auth/config";

describe("formal login", () => {
  it("matches the default Supabase minimum password length", () => {
    expect(AUTH_PASSWORD_MIN_LENGTH).toBe(6);
  });
});
