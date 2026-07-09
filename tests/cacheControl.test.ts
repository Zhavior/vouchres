import { describe, expect, it } from "vitest";
import { cacheControlToMs, parseCacheControl } from "../src/lib/cacheControl";

describe("cacheControl", () => {
  it("parses max-age and stale-while-revalidate", () => {
    expect(
      parseCacheControl("private, max-age=30, stale-while-revalidate=120"),
    ).toEqual({
      maxAgeSec: 30,
      staleWhileRevalidateSec: 120,
    });
  });

  it("converts cache directives to milliseconds", () => {
    expect(
      cacheControlToMs({
        maxAgeSec: 30,
        staleWhileRevalidateSec: 120,
      }),
    ).toEqual({
      maxAgeMs: 30_000,
      staleWhileRevalidateMs: 120_000,
    });
  });

  it("returns empty values for missing headers", () => {
    expect(parseCacheControl(null)).toEqual({});
    expect(cacheControlToMs({})).toEqual({});
  });
});
