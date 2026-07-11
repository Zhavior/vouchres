import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "../server/errors/AppError";
import { updateParlaySummary } from "../server/services/parlays/userParlayService";

const parlayRepository = vi.hoisted(() => ({
  findUserParlayById: vi.fn(),
  updateUserParlay: vi.fn(),
}));

const pickAuditRepository = vi.hoisted(() => ({
  insertPickAuditLog: vi.fn(),
  listPickAuditLogs: vi.fn(),
}));

vi.mock("../server/repositories/parlayRepository", () => parlayRepository);
vi.mock("../server/repositories/pickAuditRepository", () => pickAuditRepository);

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
