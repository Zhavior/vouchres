import { beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn();
const maybeSingle = vi.fn();
const selectEq = vi.fn(() => ({ maybeSingle }));
const select = vi.fn(() => ({ eq: selectEq }));

vi.mock("../server/lib/jurisdictionPolicy", () => ({
  assertJurisdictionAllowed: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    auth: { getUser },
    from: vi.fn(() => ({ select })),
  })),
}));

describe("requireAuth session cache", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role";
  });

  it("reuses a warm session without a second Auth API call", async () => {
    getUser.mockResolvedValue({
      data: {
        user: { id: "user-1", email: "a@example.com" },
      },
      error: null,
    });
    maybeSingle.mockResolvedValue({
      data: {
        id: "user-1",
        username: "ace",
        handle: "ace",
        tier: "gold",
        is_banned: false,
        is_staff: false,
        is_demo: false,
        age_confirmed_at: "2026-01-01T00:00:00.000Z",
        jurisdiction_confirmed_at: "2026-01-01T00:00:00.000Z",
        jurisdiction: "US-NY",
        discord_connected_at: "2026-01-01T00:00:00.000Z",
        discord_guild_member: true,
        discord_beta_access: true,
        deletion_scheduled_at: null,
      },
      error: null,
    });

    const auth = await import("../server/middleware/auth");
    auth.resetAuthSessionCacheForTests();

    const req1: any = { headers: { authorization: "Bearer tok_abc" }, method: "GET", originalUrl: "/a" };
    const req2: any = { headers: { authorization: "Bearer tok_abc" }, method: "GET", originalUrl: "/b" };
    const next = vi.fn();

    await auth.requireAuth(req1, {} as any, next);
    await auth.requireAuth(req2, {} as any, next);

    expect(next).toHaveBeenCalledTimes(2);
    expect(getUser).toHaveBeenCalledTimes(1);
    expect(req2.user?.id).toBe("user-1");
  });

  it("reloads profile after bumpAuthUserEpoch (ban/tier revoke)", async () => {
    getUser.mockResolvedValue({
      data: {
        user: { id: "user-1", email: "a@example.com" },
      },
      error: null,
    });
    maybeSingle
      .mockResolvedValueOnce({
        data: {
          id: "user-1",
          username: "ace",
          handle: "ace",
          tier: "gold",
          is_banned: false,
          is_staff: false,
          is_demo: false,
          age_confirmed_at: "2026-01-01T00:00:00.000Z",
          jurisdiction_confirmed_at: "2026-01-01T00:00:00.000Z",
          jurisdiction: "US-NY",
          discord_connected_at: "2026-01-01T00:00:00.000Z",
          discord_guild_member: true,
          discord_beta_access: true,
          deletion_scheduled_at: null,
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: {
          id: "user-1",
          username: "ace",
          handle: "ace",
          tier: "free",
          is_banned: true,
          is_staff: false,
          is_demo: false,
          age_confirmed_at: "2026-01-01T00:00:00.000Z",
          jurisdiction_confirmed_at: "2026-01-01T00:00:00.000Z",
          jurisdiction: "US-NY",
          discord_connected_at: "2026-01-01T00:00:00.000Z",
          discord_guild_member: true,
          discord_beta_access: true,
          deletion_scheduled_at: null,
        },
        error: null,
      });

    const auth = await import("../server/middleware/auth");
    auth.resetAuthSessionCacheForTests();

    const next1 = vi.fn();
    const next2 = vi.fn();
    const req1: any = { headers: { authorization: "Bearer tok_ban" }, method: "GET", originalUrl: "/a" };
    const req2: any = { headers: { authorization: "Bearer tok_ban" }, method: "GET", originalUrl: "/b" };

    await auth.requireAuth(req1, {} as any, next1);
    expect(next1.mock.calls[0]?.[0]).toBeUndefined();
    expect(req1.user?.profile.tier).toBe("gold");

    await auth.bumpAuthUserEpoch("user-1");
    await auth.requireAuth(req2, {} as any, next2);

    expect(getUser).toHaveBeenCalledTimes(2);
    const err = next2.mock.calls[0]?.[0];
    expect(err?.message).toMatch(/banned/i);
  });

  it("blocks unverified users from beta routes but leaves auth setup routes available", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-unverified", email: "u@example.com" } },
      error: null,
    });
    maybeSingle.mockResolvedValue({
      data: {
        id: "user-unverified",
        username: "unverified",
        handle: "unverified",
        tier: "free",
        is_banned: false,
        is_staff: false,
        is_demo: false,
        age_confirmed_at: null,
        jurisdiction_confirmed_at: null,
        jurisdiction: null,
        discord_connected_at: null,
        discord_guild_member: false,
        discord_beta_access: false,
        deletion_scheduled_at: null,
      },
      error: null,
    });

    const auth = await import("../server/middleware/auth");
    auth.resetAuthSessionCacheForTests();

    const betaNext = vi.fn();
    await auth.requireAuth(
      { headers: { authorization: "Bearer tok_unverified" }, method: "GET", originalUrl: "/api/today/preferences" } as any,
      {} as any,
      betaNext,
    );
    expect(betaNext.mock.calls[0]?.[0]).toMatchObject({
      status: 403,
      code: "discord_beta_access_required",
    });

    const setupNext = vi.fn();
    await auth.requireAuth(
      { headers: { authorization: "Bearer tok_setup" }, method: "GET", originalUrl: "/api/auth/me" } as any,
      {} as any,
      setupNext,
    );
    expect(setupNext.mock.calls[0]?.[0]).toBeUndefined();
  });

  it("skips the Discord beta wall when NODE_ENV is unset (local npm run dev)", async () => {
    const previousNodeEnv = process.env.NODE_ENV;
    delete process.env.NODE_ENV;

    getUser.mockResolvedValue({
      data: { user: { id: "user-local", email: "local@example.com" } },
      error: null,
    });
    maybeSingle.mockResolvedValue({
      data: {
        id: "user-local",
        username: "local",
        handle: "local",
        tier: "free",
        is_banned: false,
        is_staff: false,
        is_demo: false,
        age_confirmed_at: null,
        jurisdiction_confirmed_at: null,
        jurisdiction: null,
        discord_connected_at: null,
        discord_guild_member: false,
        discord_beta_access: false,
        deletion_scheduled_at: null,
      },
      error: null,
    });

    try {
      const auth = await import("../server/middleware/auth");
      auth.resetAuthSessionCacheForTests();
      const next = vi.fn();
      await auth.requireAuth(
        { headers: { authorization: "Bearer tok_local" }, method: "GET", originalUrl: "/api/today/preferences" } as any,
        {} as any,
        next,
      );
      expect(next.mock.calls[0]?.[0]).toBeUndefined();
    } finally {
      process.env.NODE_ENV = previousNodeEnv;
    }
  });

  it("skips the Discord beta wall for the founder email even with false flags", async () => {
    process.env.NODE_ENV = "test";
    getUser.mockResolvedValue({
      data: { user: { id: "user-founder", email: "zhavior@gmail.com" } },
      error: null,
    });
    maybeSingle.mockResolvedValue({
      data: {
        id: "user-founder",
        username: "boyd",
        handle: "boyd",
        tier: "free",
        is_banned: false,
        is_staff: false,
        is_demo: false,
        age_confirmed_at: null,
        jurisdiction_confirmed_at: null,
        jurisdiction: null,
        discord_connected_at: "2026-01-01T00:00:00.000Z",
        discord_guild_member: false,
        discord_beta_access: false,
        deletion_scheduled_at: null,
      },
      error: null,
    });

    const auth = await import("../server/middleware/auth");
    auth.resetAuthSessionCacheForTests();
    const next = vi.fn();
    await auth.requireAuth(
      { headers: { authorization: "Bearer tok_founder" }, method: "GET", originalUrl: "/api/today/preferences" } as any,
      {} as any,
      next,
    );
    expect(next.mock.calls[0]?.[0]).toBeUndefined();
  });
});
