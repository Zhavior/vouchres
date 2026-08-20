import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("discord OAuth2 state (signed CSRF token)", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("DISCORD_OAUTH_STATE_SECRET", "test-state-signing-secret-do-not-use-in-prod");
    // Redis unconfigured — replay checks degrade to signature+expiry only, deterministically.
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it("round-trips: verifying a freshly created state recovers the same user id", async () => {
    const { createDiscordOAuthState, verifyDiscordOAuthState } = await import("../server/services/discord/discordOAuthState");

    const state = createDiscordOAuthState("user-123");
    const result = await verifyDiscordOAuthState(state);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.userId).toBe("user-123");
    }
  });

  it("rejects a state signed with a different secret", async () => {
    vi.stubEnv("DISCORD_OAUTH_STATE_SECRET", "secret-a");
    const { createDiscordOAuthState } = await import("../server/services/discord/discordOAuthState");
    const state = createDiscordOAuthState("user-123");

    vi.resetModules();
    vi.stubEnv("DISCORD_OAUTH_STATE_SECRET", "secret-b");
    const { verifyDiscordOAuthState } = await import("../server/services/discord/discordOAuthState");

    const result = await verifyDiscordOAuthState(state);
    expect(result).toEqual({ ok: false, reason: "bad_signature" });
  });

  it("rejects a state whose payload was tampered with after signing", async () => {
    const { createDiscordOAuthState, verifyDiscordOAuthState } = await import("../server/services/discord/discordOAuthState");

    const state = createDiscordOAuthState("user-123");
    const [payloadB64, signature] = state.split(".");
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
    payload.uid = "attacker-controlled-user-id";
    const tamperedPayloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const tampered = `${tamperedPayloadB64}.${signature}`;

    const result = await verifyDiscordOAuthState(tampered);
    expect(result).toEqual({ ok: false, reason: "bad_signature" });
  });

  it("rejects a malformed state string", async () => {
    const { verifyDiscordOAuthState } = await import("../server/services/discord/discordOAuthState");
    const result = await verifyDiscordOAuthState("not-a-real-state-token");
    expect(result).toEqual({ ok: false, reason: "malformed" });
  });

  it("rejects an expired state", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const { createDiscordOAuthState, verifyDiscordOAuthState } = await import("../server/services/discord/discordOAuthState");
    const state = createDiscordOAuthState("user-123");

    vi.setSystemTime(new Date("2026-01-01T00:10:00Z")); // 10 minutes later — past the 5 minute TTL
    const result = await verifyDiscordOAuthState(state);
    expect(result).toEqual({ ok: false, reason: "expired" });
  });

  it("round-trips returnTo destination safely", async () => {
    const { createDiscordOAuthState, verifyDiscordOAuthState } = await import("../server/services/discord/discordOAuthState");

    const state = createDiscordOAuthState("user-123", "/hr-next");
    const result = await verifyDiscordOAuthState(state);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.userId).toBe("user-123");
      expect(result.returnTo).toBe("/hr-next");
    }
  });

  it("sanitizes unsafe open-redirect returnTo schemes", async () => {
    const { createDiscordOAuthState, verifyDiscordOAuthState } = await import("../server/services/discord/discordOAuthState");

    const state = createDiscordOAuthState("user-123", "//evil.com/phish");
    const result = await verifyDiscordOAuthState(state);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.userId).toBe("user-123");
      expect(result.returnTo).toBeUndefined();
    }
  });
});
