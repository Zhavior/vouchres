import { afterEach, describe, expect, it, vi } from "vitest";
import { validateProductionEnvAtBoot } from "../server/lib/validateProductionEnv";

describe("validateProductionEnvAtBoot", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("does not throw in development when required production config is missing", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(() => validateProductionEnvAtBoot()).not.toThrow();
  });

  it("throws in production when CRON_SECRET is missing", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("CRON_SECRET", "");
    vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");

    expect(() => validateProductionEnvAtBoot()).toThrow(/CRON_SECRET/);
  });

  it("passes in production when required config is present", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("CRON_SECRET", "cron-secret");
    vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");

    expect(() => validateProductionEnvAtBoot()).not.toThrow();
  });
});
