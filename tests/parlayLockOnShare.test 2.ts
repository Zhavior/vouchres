import { beforeEach, describe, expect, it, vi } from "vitest";
import { lockParlayOnFeedShare } from "../server/services/parlays/userParlayService";

const parlayRepository = vi.hoisted(() => ({
  lockPickForFeedShare: vi.fn(),
  findLegsForPick: vi.fn(),
  updatePickProofHash: vi.fn(),
}));

vi.mock("../server/services/trust/pickProofAnchorService", () => ({
  anchorParlayProofOpenTimestamp: vi.fn(async () => ({ anchored: false })),
}));

const pickAuditRepository = vi.hoisted(() => ({
  insertPickAuditLog: vi.fn(),
}));

vi.mock("../server/repositories/parlayRepository", () => parlayRepository);
vi.mock("../server/repositories/pickAuditRepository", () => pickAuditRepository);

describe("lockParlayOnFeedShare", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pickAuditRepository.insertPickAuditLog.mockResolvedValue({ id: "audit-1" });
    parlayRepository.findLegsForPick.mockResolvedValue([
      {
        leg_index: 0,
        event_key: "MLB_123_TEAM_PLAYER_ANYTIME_HR_1_GTE",
        market_code: "ANYTIME_HR",
        player_id: "660271",
        stat_target: 1,
        comparator: ">=",
      },
    ]);
    parlayRepository.updatePickProofHash.mockResolvedValue(undefined);
  });

  it("locks pick and writes audit entry", async () => {
    parlayRepository.lockPickForFeedShare.mockResolvedValueOnce({
      id: "pick-1",
      locked_at: "2026-07-10T12:00:00.000Z",
      created_at: "2026-07-10T10:00:00.000Z",
      odds_decimal: 2.5,
      stake_units: 1,
    });

    const result = await lockParlayOnFeedShare({
      userId: "user-1",
      parlayId: "pick-1",
      postId: "post-1",
      lockedAt: "2026-07-10T12:00:00.000Z",
    });

    expect(result?.locked_at).toBe("2026-07-10T12:00:00.000Z");
    expect(result?.proof_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(parlayRepository.updatePickProofHash).toHaveBeenCalled();
    expect(pickAuditRepository.insertPickAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "lock_feed_share",
        pickId: "pick-1",
        userId: "user-1",
      }),
    );
  });
});
