import { describe, expect, it } from "vitest";
import { buildApiMeta } from "../server/lib/apiResponseMeta";

describe("API response metadata", () => {
  it("builds a stable metadata envelope", () => {
    expect(buildApiMeta({
      source: "mlb_statsapi_schedule",
      dataQuality: "official_mlb_schedule",
      updatedAt: "2026-07-08T01:00:00.000Z",
      warnings: ["informational"],
      cache: { strategy: "ttl_cache", ttlMs: 45000 },
    })).toEqual({
      source: "mlb_statsapi_schedule",
      dataQuality: "official_mlb_schedule",
      updatedAt: "2026-07-08T01:00:00.000Z",
      warnings: ["informational"],
      cache: { strategy: "ttl_cache", ttlMs: 45000 },
    });
  });
});
