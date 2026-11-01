import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getClaims: vi.fn(),
  from: vi.fn(),
}));

vi.mock("@/server/demo/config", () => ({ isDemoMode: () => false }));
vi.mock("@/server/supabase/server", () => ({
  createSupabaseServerClient: async () => ({ auth: { getClaims: mocks.getClaims }, from: mocks.from }),
}));

import { getAuthorizationContext } from "@/server/auth/context";

describe("server authorization context", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects an unverified session before reading roles", async () => {
    mocks.getClaims.mockResolvedValue({ data: null, error: new Error("invalid token") });
    expect(await getAuthorizationContext()).toBeNull();
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("uses verified identity and database-assigned roles", async () => {
    mocks.getClaims.mockResolvedValue({ data: { claims: { sub: "verified-user", email: "user@example.com" } }, error: null });
    const eq = vi.fn().mockResolvedValue({ data: [{ role: "sales" }, { role: "unknown" }], error: null });
    mocks.from.mockReturnValue({ select: () => ({ eq }) });

    expect(await getAuthorizationContext()).toEqual({
      userId: "verified-user",
      email: "user@example.com",
      roles: ["sales"],
    });
    expect(mocks.from).toHaveBeenCalledWith("user_roles");
    expect(eq).toHaveBeenCalledWith("user_id", "verified-user");
  });
});
