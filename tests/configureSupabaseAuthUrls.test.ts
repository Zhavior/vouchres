import { describe, expect, it } from "vitest";
import {
  buildAuthUrlConfig,
  extractProjectRef,
  normalizeOrigin,
} from "../scripts/configureSupabaseAuthUrls";

describe("configureSupabaseAuthUrls", () => {
  it("normalizes origins without trailing slash", () => {
    expect(normalizeOrigin("https://vouchedge.app/")).toBe("https://vouchedge.app");
    expect(normalizeOrigin("https://www.vouchedge.app")).toBe("https://www.vouchedge.app");
  });

  it("extracts project ref from Supabase URL", () => {
    expect(extractProjectRef("https://abcdefgh.supabase.co")).toBe("abcdefgh");
    expect(extractProjectRef("not-a-url")).toBeNull();
  });

  it("builds production site URL and callback allow-list", () => {
    const config = buildAuthUrlConfig({
      frontendUrl: "https://vouchedge.app",
      stagingUrl: "https://staging.vouchedge.app",
    });

    expect(config.siteUrl).toBe("https://vouchedge.app");
    expect(config.redirectEntries).toContain("https://vouchedge.app/**");
    expect(config.redirectEntries).toContain("https://vouchedge.app/auth/callback");
    expect(config.redirectEntries).toContain("https://www.vouchedge.app/**");
    expect(config.redirectEntries).toContain("https://staging.vouchedge.app/**");
    expect(config.redirectEntries).toContain("http://localhost:3000/auth/callback");
    expect(config.redirectEntries).toContain("https://*.vercel.app/**");
    expect(config.uriAllowList).toContain("https://vouchedge.app/**");
  });
});
