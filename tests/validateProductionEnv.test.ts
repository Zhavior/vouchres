import { afterEach, describe, expect, it, vi } from "vitest";
import { validateProductionEnvAtBoot } from "../server/lib/validateProductionEnv";

function stubRequiredProductionEnv() {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("CRON_SECRET", "cron-secret");
  vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");
  vi.stubEnv("SENTRY_DSN", "https://example.ingest.sentry.io/1");
  vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://example.upstash.io");
  vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "token");
}

describe("validateProductionEnvAtBoot", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("does not throw in development when required production config is missing", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(() => validateProductionEnvAtBoot()).not.toThrow();
  });

  it("throws in production when CRON_SECRET is missing", () => {
    stubRequiredProductionEnv();
    vi.stubEnv("CRON_SECRET", "");

    expect(() => validateProductionEnvAtBoot()).toThrow(/CRON_SECRET/);
  });

  it("throws in production when Upstash Redis is missing", () => {
    stubRequiredProductionEnv();
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");

    expect(() => validateProductionEnvAtBoot()).toThrow(/UPSTASH_REDIS/);
  });

  it("throws in production when SENTRY_DSN is missing", () => {
    stubRequiredProductionEnv();
    vi.stubEnv("SENTRY_DSN", "");

    expect(() => validateProductionEnvAtBoot()).toThrow(/SENTRY_DSN/);
    expect(() => validateProductionEnvAtBoot()).toThrow(/Vercel/);
  });

  it("notes when only VITE_SENTRY_DSN is present", () => {
    stubRequiredProductionEnv();
    vi.stubEnv("SENTRY_DSN", "");
    vi.stubEnv("VITE_SENTRY_DSN", "https://example.ingest.sentry.io/frontend");

    expect(() => validateProductionEnvAtBoot()).toThrow(/VITE_SENTRY_DSN is set/);
  });

  it("passes in production when required config is present", () => {
    stubRequiredProductionEnv();

    expect(() => validateProductionEnvAtBoot()).not.toThrow();
  });
});
