import { describe, expect, it } from "vitest";
import { isPickLocked, PARLAY_LOCKED_MESSAGE } from "../server/lib/parlayLockPolicy";

describe("parlayLockPolicy", () => {
  it("detects locked picks", () => {
    expect(isPickLocked(null)).toBe(false);
    expect(isPickLocked({ locked_at: null })).toBe(false);
    expect(isPickLocked({ locked_at: "2026-07-10T12:00:00.000Z" })).toBe(true);
  });

  it("documents the locked message", () => {
    expect(PARLAY_LOCKED_MESSAGE).toMatch(/shared to the feed/i);
  });
});
