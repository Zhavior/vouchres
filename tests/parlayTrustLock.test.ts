import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  commitParlayTrustLedger,
  finalizeParlayTrustLock,
  finalizeDueTrustLocks,
} from "../server/services/parlays/userParlayService";

const parlayRepository = vi.hoisted(() => ({
  findUserParlayById: vi.fn(),
  findLegsForPick: vi.fn(),
  commitPickTrustPending: vi.fn(),
  lockPickForTrustLedger: vi.fn(),
  listDueTrustLockPicks: vi.fn(),
  updatePickProofHash: vi.fn(),
}));

const pickAuditRepository = vi.hoisted(() => ({
  insertPickAuditLog: vi.fn(),
}));

vi.mock("../server/repositories/parlayRepository", () => parlayRepository);
vi.mock("../server/repositories/pickAuditRepository", () => pickAuditRepository);
vi.mock("../server/services/trust/pickProofAnchorService", () => ({
  anchorParlayProofOpenTimestamp: vi.fn(async () => ({ anchored: false })),
}));

const completeLeg = {
  leg_index: 0,
  event_key: "MLB_123_TEAM_PLAYER_ANYTIME_HR_1_GTE",
  market_code: "ANYTIME_HR",
  player_id: "660271",
  stat_target: 1,
  comparator: ">=",
};

describe("parlay trust lock lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pickAuditRepository.insertPickAuditLog.mockResolvedValue({ id: "audit-1" });
    parlayRepository.findLegsForPick.mockResolvedValue([completeLeg]);
    parlayRepository.updatePickProofHash.mockResolvedValue(undefined);
  });

  it("rejects trust commit when leg identity is incomplete", async () => {
    parlayRepository.findUserParlayById.mockResolvedValueOnce({
      id: "pick-1",
      visibility: "private",
    });
    parlayRepository.findLegsForPick.mockResolvedValueOnce([{ leg_index: 0 }]);

    await expect(commitParlayTrustLedger({
      userId: "user-1",
      parlayId: "pick-1",
      audience: "private",
    })).rejects.toMatchObject({ status: 422, code: "validation_error" });
  });

  it("commits trust ledger window when identity is complete", async () => {
    parlayRepository.findUserParlayById.mockResolvedValueOnce({
      id: "pick-1",
      visibility: "private",
    });
    parlayRepository.commitPickTrustPending.mockResolvedValueOnce({
      id: "pick-1",
      committed_at: "2026-07-11T12:00:00.000Z",
      trust_lock_at: "2026-07-11T12:05:00.000Z",
      visibility: "private",
    });

    const result = await commitParlayTrustLedger({
      userId: "user-1",
      parlayId: "pick-1",
      audience: "private",
    });

    expect(result.committed_at).toBeTruthy();
    expect(pickAuditRepository.insertPickAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: "commit_trust_pending" }),
    );
  });

  it("finalizes due trust locks through repository lock path", async () => {
    parlayRepository.listDueTrustLockPicks.mockResolvedValueOnce([
      { id: "pick-1", user_id: "user-1" },
    ]);
    parlayRepository.findUserParlayById.mockResolvedValueOnce({
      id: "pick-1",
      committed_at: "2026-07-11T12:00:00.000Z",
      trust_lock_at: "2026-07-11T12:04:00.000Z",
      visibility: "private",
    });
    parlayRepository.lockPickForTrustLedger.mockResolvedValueOnce({
      id: "pick-1",
      locked_at: "2026-07-11T12:05:00.000Z",
      lock_reason: "trust_ledger",
      created_at: "2026-07-11T11:00:00.000Z",
      odds_decimal: 2.5,
      stake_units: 1,
    });

    const batch = await finalizeDueTrustLocks(10);
    expect(batch.finalized).toBe(1);
    expect(batch.ids).toEqual(["pick-1"]);
    expect(pickAuditRepository.insertPickAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: "lock_trust_ledger" }),
    );
  });

  it("returns null when finalize is called before trust lock time", async () => {
    parlayRepository.findUserParlayById.mockResolvedValueOnce({
      id: "pick-1",
      committed_at: "2026-07-11T12:00:00.000Z",
      trust_lock_at: new Date(Date.now() + 120_000).toISOString(),
      visibility: "private",
    });

    const result = await finalizeParlayTrustLock({
      userId: "user-1",
      parlayId: "pick-1",
    });

    expect(result).toBeNull();
  });
});
