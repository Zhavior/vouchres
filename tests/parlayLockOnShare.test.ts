import { beforeEach, describe, expect, it, vi } from "vitest";
import { lockParlayOnFeedShare } from "../server/services/parlays/userParlayService";

const parlayRepository = vi.hoisted(() => ({
  lockPickForFeedShare: vi.fn(),
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
  });

  it("locks pick and writes audit entry", async () => {
    parlayRepository.lockPickForFeedShare.mockResolvedValueOnce({
      id: "pick-1",
      locked_at: "2026-07-10T12:00:00.000Z",
    });

    const result = await lockParlayOnFeedShare({
      userId: "user-1",
      parlayId: "pick-1",
      postId: "post-1",
      lockedAt: "2026-07-10T12:00:00.000Z",
    });

    expect(result?.locked_at).toBe("2026-07-10T12:00:00.000Z");
    expect(pickAuditRepository.insertPickAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "lock_feed_share",
        pickId: "pick-1",
        userId: "user-1",
      }),
    );
  });
});
