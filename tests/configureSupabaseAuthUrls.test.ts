import { describe, expect, it } from "vitest";
import {
  buildAuthUrlConfig,
  extractProjectRef,
  normalizeOrigin,
} from "../scripts/configureSupabaseAuthUrls";

describe("configureSupabaseAuthUrls", () => {
  it("normalizes origins without trailing slash", () => {
    expect(normalizeOrigin("https://vouchedge.xyz/")).toBe("https://vouchedge.xyz");
    expect(normalizeOrigin("https://www.vouchedge.xyz")).toBe("https://www.vouchedge.xyz");
  });

  it("adds https when scheme is missing", () => {
    expect(normalizeOrigin("vouchres.vercel.app")).toBe("https://vouchres.vercel.app");
    expect(normalizeOrigin("vouchedge.xyz")).toBe("https://vouchedge.xyz");
  });

  it("extracts project ref from Supabase URL", () => {
    expect(extractProjectRef("https://abcdefgh.supabase.co")).toBe("abcdefgh");
    expect(extractProjectRef("not-a-url")).toBeNull();
  });

  it("builds production site URL and callback allow-list", () => {
    const config = buildAuthUrlConfig({
      frontendUrl: "https://vouchedge.xyz",
      stagingUrl: "https://staging.vouchedge.xyz",
    });

    expect(config.siteUrl).toBe("https://vouchedge.xyz");
    expect(config.redirectEntries).toContain("https://vouchedge.xyz/**");
    expect(config.redirectEntries).toContain("https://vouchedge.xyz/auth/callback");
    expect(config.redirectEntries).toContain("https://vouchedge.xyz/auth/reset-password");
    expect(config.redirectEntries).toContain("https://www.vouchedge.xyz/**");
    expect(config.redirectEntries).toContain("https://staging.vouchedge.xyz/**");
    expect(config.redirectEntries).toContain("http://localhost:3000/auth/callback");
    expect(config.redirectEntries).toContain("http://localhost:3000/auth/reset-password");
    expect(config.redirectEntries).toContain("https://*.vercel.app/**");
    expect(config.uriAllowList).toContain("https://vouchedge.xyz/**");
  });
});
