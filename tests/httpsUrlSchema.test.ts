import { describe, expect, it } from "vitest";
import { HttpsUrlSchema } from "../server/lib/httpsUrlSchema";

describe("HttpsUrlSchema", () => {
  it("accepts https URLs", () => {
    expect(HttpsUrlSchema.safeParse("https://cdn.example.com/a.png").success).toBe(true);
  });

  it("rejects http, data, and javascript URLs", () => {
    expect(HttpsUrlSchema.safeParse("http://example.com/a.png").success).toBe(false);
    expect(HttpsUrlSchema.safeParse("data:image/png;base64,abc").success).toBe(false);
    expect(HttpsUrlSchema.safeParse("javascript:alert(1)").success).toBe(false);
  });
});
