import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "../server/errors/AppError";
import { repairUserParlayIdentity, updateParlaySummary } from "../server/services/parlays/userParlayService";

const parlayRepository = vi.hoisted(() => ({
  findUserParlayById: vi.fn(),
  findLegsForPick: vi.fn(),
  updateUserParlay: vi.fn(),
}));

const pickAuditRepository = vi.hoisted(() => ({
  insertPickAuditLog: vi.fn(),
  listPickAuditLogs: vi.fn(),
}));

const repairParlayIdentityForPick = vi.hoisted(() => vi.fn());

vi.mock("../server/repositories/parlayRepository", () => parlayRepository);
vi.mock("../server/repositories/pickAuditRepository", () => pickAuditRepository);
vi.mock("../server/routes/parlay/parlayRepairHelpers", () => ({
  repairParlayIdentityForPick,
}));

describe("updateParlaySummary audit trail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    parlayRepository.findUserParlayById.mockResolvedValue({
      id: "pick-1",
      explanation: "Old title",
      stake_units: 1,
    });
    parlayRepository.updateUserParlay.mockResolvedValue({
      id: "pick-1",
      explanation: "New title",
      stake_units: 2,
      updated_at: "2026-07-10T12:00:00.000Z",
    });
    pickAuditRepository.insertPickAuditLog.mockResolvedValue({ id: "audit-1" });
  });

  it("writes an audit log entry when summary fields change", async () => {
    const result = await updateParlaySummary({
      userId: "user-1",
      parlayId: "pick-1",
      title: "New title",
      stakeUnits: 2,
    });

    expect(result.explanation).toBe("New title");
    expect(pickAuditRepository.insertPickAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        pickId: "pick-1",
        userId: "user-1",
        action: "update_summary",
        fieldChanges: expect.objectContaining({
          explanation: { before: "Old title", after: "New title" },
          stake_units: { before: 1, after: 2 },
        }),
      }),
    );
  });

  it("rejects edits when parlay is locked", async () => {
    parlayRepository.findUserParlayById.mockResolvedValueOnce({
      id: "pick-1",
      explanation: "Locked slip",
      stake_units: 1,
      locked_at: "2026-07-10T12:00:00.000Z",
    });

    await expect(updateParlaySummary({
      userId: "user-1",
      parlayId: "pick-1",
      title: "New title",
    })).rejects.toMatchObject({
      status: 403,
      code: "parlay_locked",
    });

    expect(parlayRepository.updateUserParlay).not.toHaveBeenCalled();
  });

  it("rejects empty updates", async () => {
    await expect(updateParlaySummary({
      userId: "user-1",
      parlayId: "pick-1",
    })).rejects.toBeInstanceOf(AppError);
  });
});

describe("repairUserParlayIdentity audit trail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repairParlayIdentityForPick.mockResolvedValue({
      pickId: "pick-1",
      scanned: 2,
      repairedCount: 2,
      skippedCount: 0,
    });
    parlayRepository.findUserParlayById.mockResolvedValue({
      id: "pick-1",
      explanation: "Slip",
      created_at: "2026-07-10T10:00:00.000Z",
    });
    parlayRepository.findLegsForPick.mockResolvedValue([
      {
        id: "leg-1",
        leg_index: 0,
        event_key: "MLB_123_TEAM_PLAYER_ANYTIME_HR_1_GTE",
        market_code: "ANYTIME_HR",
        player_id: "660271",
        stat_target: 1,
        comparator: ">=",
      },
    ]);
    pickAuditRepository.insertPickAuditLog.mockResolvedValue({ id: "audit-2" });
  });

  it("writes an audit log entry after identity repair", async () => {
    const payload = await repairUserParlayIdentity({
      userId: "user-1",
      parlayId: "pick-1",
    });

    expect(repairParlayIdentityForPick).toHaveBeenCalledWith({
      pickId: "pick-1",
      userId: "user-1",
      externalProvider: "user_repair_identity",
    });
    expect(pickAuditRepository.insertPickAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        pickId: "pick-1",
        userId: "user-1",
        action: "repair_identity",
      }),
    );
    expect(payload.parlay.identity?.complete).toBe(true);
  });
});
