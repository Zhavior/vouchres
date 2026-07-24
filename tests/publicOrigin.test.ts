import { afterEach, describe, expect, it } from "vitest";
import { getSafePublicOrigin } from "../server/lib/publicOrigin";

describe("getSafePublicOrigin", () => {
  const keys = [
    "FRONTEND_URL",
    "CLIENT_URL",
    "SITE_URL",
    "PUBLIC_SITE_URL",
    "APP_URL",
  ] as const;
  const previous = new Map<string, string | undefined>();

  afterEach(() => {
    for (const key of keys) {
      const value = previous.get(key);
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    previous.clear();
  });

  function clearOrigins() {
    for (const key of keys) {
      previous.set(key, process.env[key]);
      delete process.env[key];
    }
  }

  it("prefers FRONTEND_URL and strips trailing slash", () => {
    clearOrigins();
    process.env.FRONTEND_URL = "https://vouchedge.com/";
    expect(getSafePublicOrigin()).toBe("https://vouchedge.com");
  });

  it("rejects non-http(s) values", () => {
    clearOrigins();
    process.env.FRONTEND_URL = "javascript:alert(1)";
    expect(getSafePublicOrigin()).toBe("http://localhost:3000");
  });

  it("falls back when unset (does not trust Host header)", () => {
    clearOrigins();
    expect(getSafePublicOrigin()).toBe("http://localhost:3000");
  });
});
