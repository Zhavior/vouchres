/**
 * Entitlement flags must never fail open.
 *
 * FREE_BETA_ALL_ACCESS decides whether every authenticated account is resolved to
 * BETA_ACCESS_TIER ("creator"). The old reader collapsed "absent" and
 * "unparseable" into the same null, so `FREE_BETA_ALL_ACCESS=disabled` — a plain
 * typo for `false` — silently granted the whole world the top tier with no error
 * anywhere. An unreadable switch now stops the boot instead.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("entitlement flags reject values they cannot parse", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("does not silently grant the beta tier when FREE_BETA_ALL_ACCESS is a typo", async () => {
    vi.stubEnv("FREE_BETA_ALL_ACCESS", "disabled");
    const { isFreeBetaActive } = await import("../server/lib/betaAccess");

    // The whole bug: this used to return true.
    expect(() => isFreeBetaActive()).toThrow(/FREE_BETA_ALL_ACCESS/);
    expect(() => isFreeBetaActive()).toThrow(/"disabled"/);
  });

  it("does not silently re-enable the beta grant when PAYMENTS_ENABLED is a typo", async () => {
    vi.stubEnv("FREE_BETA_ALL_ACCESS", "false");
    vi.stubEnv("PAYMENTS_ENABLED", "enabled");
    const { arePaymentsEnabled } = await import("../server/lib/betaAccess");

    expect(() => arePaymentsEnabled()).toThrow(/PAYMENTS_ENABLED/);
  });

  it("refuses to resolve an effective tier from an unreadable flag", async () => {
    vi.stubEnv("FREE_BETA_ALL_ACCESS", "yess");
    const { resolveEffectiveTier } = await import("../server/lib/betaAccess");

    expect(() => resolveEffectiveTier("free")).toThrow(/FREE_BETA_ALL_ACCESS/);
  });

  it.each([
    ["disabled", "FREE_BETA_ALL_ACCESS"],
    ["off ,true", "FREE_BETA_ALL_ACCESS"],
    ["FALSE!", "FREE_BETA_ALL_ACCESS"],
  ])("collects %s as a boot error", async (value, flag) => {
    vi.stubEnv(flag, value);
    const { collectEntitlementFlagErrors } = await import("../server/lib/betaAccess");

    const errors = collectEntitlementFlagErrors();
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain(flag);
  });

  it("accepts the documented spellings in any case, with surrounding space", async () => {
    vi.stubEnv("FREE_BETA_ALL_ACCESS", "  FALSE  ");
    vi.stubEnv("PAYMENTS_ENABLED", "On");
    const { isFreeBetaActive, arePaymentsEnabled, collectEntitlementFlagErrors } = await import(
      "../server/lib/betaAccess"
    );

    expect(collectEntitlementFlagErrors()).toEqual([]);
    expect(isFreeBetaActive()).toBe(false);
    expect(arePaymentsEnabled()).toBe(true);
  });

  it("keeps the open beta on when the flag is simply absent", async () => {
    vi.stubEnv("FREE_BETA_ALL_ACCESS", "");
    vi.stubEnv("PAYMENTS_ENABLED", "");
    const { isFreeBetaActive, collectEntitlementFlagErrors } = await import(
      "../server/lib/betaAccess"
    );

    expect(collectEntitlementFlagErrors()).toEqual([]);
    expect(isFreeBetaActive()).toBe(true);
  });
});

describe("boot refuses to start on an unreadable entitlement flag", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("throws in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("CRON_SECRET", "cron-secret");
    vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");
    vi.stubEnv("SENTRY_DSN", "https://example.ingest.sentry.io/1");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://example.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "token");
    vi.stubEnv("FREE_BETA_ALL_ACCESS", "disabled");
    const { validateProductionEnvAtBoot } = await import("../server/lib/validateProductionEnv");

    expect(() => validateProductionEnvAtBoot()).toThrow(/FREE_BETA_ALL_ACCESS/);
  });

  it("throws in development too — a mistyped grant is never environment-specific", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("FREE_BETA_ALL_ACCESS", "disabled");
    const { validateProductionEnvAtBoot } = await import("../server/lib/validateProductionEnv");

    expect(() => validateProductionEnvAtBoot()).toThrow(/Invalid entitlement flag/);
  });

  it("still boots in development when the flags are absent", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("FREE_BETA_ALL_ACCESS", "");
    vi.stubEnv("PAYMENTS_ENABLED", "");
    const { validateProductionEnvAtBoot } = await import("../server/lib/validateProductionEnv");

    expect(() => validateProductionEnvAtBoot()).not.toThrow();
  });
});
