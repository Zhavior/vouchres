import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("admin user search sanitization", () => {
  it("does not interpolate raw search into PostgREST .or()", () => {
    const source = readFileSync(
      resolve(__dirname, "../server/routes/adminRoutes.ts"),
      "utf8",
    );
    expect(source.includes("username.ilike.%${search}%")).toBe(false);
    expect(source.includes("cleaned")).toBe(true);
    expect(source.includes('replace(/[%_,.()\\\\]/g')).toBe(true);
  });
});
