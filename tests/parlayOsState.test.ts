import { describe, expect, it } from "vitest";
import {
  inferLockReason,
  parlayLockedMessage,
  resolveParlayOsSnapshot,
  resolveParlayRecordState,
} from "../src/lib/parlayOsState";

describe("parlayOsState", () => {
  it("resolves saved vs committed vs locked record states", () => {
    expect(resolveParlayRecordState({ id: "p1" })).toBe("SAVED");
    expect(resolveParlayRecordState({ id: "p1", committed_at: "2026-07-11T12:00:00.000Z" })).toBe("COMMITTED");
    expect(resolveParlayRecordState({
      id: "p1",
      committed_at: "2026-07-11T12:00:00.000Z",
      locked_at: "2026-07-11T12:05:00.000Z",
    })).toBe("LOCKED");
    expect(resolveParlayRecordState({
      id: "p1",
      locked_at: "2026-07-11T12:05:00.000Z",
      ots_stamped_at: "2026-07-11T12:06:00.000Z",
    })).toBe("ANCHORED");
  });

  it("infers lock reason from explicit column or commit history", () => {
    expect(inferLockReason({ lock_reason: "feed_share", locked_at: "t" })).toBe("feed_share");
    expect(inferLockReason({
      locked_at: "2026-07-11T12:05:00.000Z",
      committed_at: "2026-07-11T12:00:00.000Z",
    })).toBe("trust_ledger");
    expect(inferLockReason({ locked_at: "2026-07-11T12:05:00.000Z" })).toBe("feed_share");
  });

  it("returns reason-specific locked messages", () => {
    expect(parlayLockedMessage("trust_ledger")).toMatch(/trust ledger/i);
    expect(parlayLockedMessage("feed_share")).toMatch(/feed/i);
  });

  it("builds a full snapshot for hub badges", () => {
    const snapshot = resolveParlayOsSnapshot({
      id: "p1",
      status: "pending",
      committed_at: "2026-07-11T12:00:00.000Z",
      locked_at: "2026-07-11T12:05:00.000Z",
      lock_reason: "trust_ledger",
      proof_hash: "abc123",
    });

    expect(snapshot.recordState).toBe("LOCKED");
    expect(snapshot.lockReason).toBe("trust_ledger");
    expect(snapshot.proofState).toBe("hash");
    expect(snapshot.recordLabel).toBe("Locked");
    expect(snapshot.lockReasonLabel).toBe("Trust ledger lock");
  });
});
