import { beforeEach, describe, expect, it, vi } from "vitest";

const maybeSingle = vi.fn();
const selectEq2 = vi.fn(() => ({ maybeSingle }));
const selectEq1 = vi.fn(() => ({ eq: selectEq2, maybeSingle }));
const select = vi.fn(() => ({ eq: selectEq1 }));
const upsert = vi.fn(async () => ({ error: null }));

vi.mock("../server/middleware/auth", () => ({
  getSupabaseAdmin: vi.fn(async () => ({
    from: () => ({ select, upsert }),
  })),
}));

vi.mock("../server/repositories/parlayRepository", () => ({
  findLegsForPick: vi.fn(async () => []),
}));

vi.mock("../server/services/parlays/parlayCreationService", () => ({
  saveUserParlay: vi.fn(),
}));

vi.mock("../server/services/social/followService", () => ({
  upsertFollow: vi.fn(async () => undefined),
}));

vi.mock("../server/services/notifications/notificationService", () => ({
  createParlayTailedNotification: vi.fn(async () => undefined),
}));

describe("parlay tail IDOR", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("forbids non-owners from tailing a private parlay", async () => {
    maybeSingle.mockResolvedValueOnce({
      data: {
        id: "pick_private",
        user_id: "owner_1",
        visibility: "private",
        leg_type: "parlay",
        explanation: "secret",
        sport: "MLB",
        selection: "secret",
      },
      error: null,
    });

    const { tailParlayForUser } = await import("../server/services/social/parlayTailService");
    await expect(
      tailParlayForUser({ userId: "follower_1", sourcePickId: "pick_private" }),
    ).rejects.toMatchObject({ status: 403, code: "forbidden" });
  });

  it("allows public parlays", async () => {
    maybeSingle.mockResolvedValueOnce({
      data: {
        id: "pick_public",
        user_id: "owner_1",
        visibility: "public",
        leg_type: "parlay",
        explanation: "open slate",
        sport: "MLB",
        selection: "open",
        stake_units: 1,
      },
      error: null,
    });

    const { findLegsForPick } = await import("../server/repositories/parlayRepository");
    vi.mocked(findLegsForPick).mockResolvedValueOnce([
      { event_id: "g1", market: "hr", selection: "Judge", sport: "MLB" },
    ] as any);

    const { saveUserParlay } = await import("../server/services/parlays/parlayCreationService");
    vi.mocked(saveUserParlay).mockResolvedValueOnce({
      body: { id: "tailed_1" },
    } as any);

    const { tailParlayForUser } = await import("../server/services/social/parlayTailService");
    const result = await tailParlayForUser({
      userId: "follower_1",
      sourcePickId: "pick_public",
    });
    expect(result.tailedPickId).toBe("tailed_1");
  });
});
