import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Vercel frontend security headers", () => {
  it("sets browser security headers on the static frontend catch-all", () => {
    const config = JSON.parse(readFileSync("vercel.json", "utf8")) as {
      headers?: Array<{ source: string; headers: Array<{ key: string; value: string }> }>;
    };

    const catchAll = config.headers?.find((entry) => entry.source === "/(.*)");
    expect(catchAll).toBeTruthy();

    const headers = new Map(catchAll?.headers.map((header) => [header.key.toLowerCase(), header.value]));
    expect(headers.get("strict-transport-security")).toContain("max-age=");
    expect(headers.get("x-content-type-options")).toBe("nosniff");
    expect(headers.get("referrer-policy")).toBe("strict-origin-when-cross-origin");

    const csp = headers.get("content-security-policy") ?? "";
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("upgrade-insecure-requests");
  });
});
