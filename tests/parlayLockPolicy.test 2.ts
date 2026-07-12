import { describe, expect, it } from "vitest";
import { isPickLocked, lockedParlayMessage, pickLockReason } from "../server/lib/parlayLockPolicy";

describe("parlayLockPolicy", () => {
  it("detects locked picks", () => {
    expect(isPickLocked(null)).toBe(false);
    expect(isPickLocked({ locked_at: null })).toBe(false);
    expect(isPickLocked({ locked_at: "2026-07-10T12:00:00.000Z" })).toBe(true);
  });

  it("returns reason-specific locked messages", () => {
    expect(lockedParlayMessage({ lock_reason: "feed_share", locked_at: "t" })).toMatch(/feed/i);
    expect(lockedParlayMessage({ lock_reason: "trust_ledger", locked_at: "t" })).toMatch(/trust ledger/i);
    expect(pickLockReason({ committed_at: "t", locked_at: "t2" })).toBe("trust_ledger");
  });
});
