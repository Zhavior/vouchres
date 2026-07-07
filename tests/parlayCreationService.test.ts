import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "../server/errors/AppError";
import { saveUserParlay } from "../server/services/parlays/parlayCreationService";
import { SaveMeParlaySchema } from "../server/validators/parlaySchemas";

const repository = vi.hoisted(() => ({
  createParlayWithLegsRpc: vi.fn(),
  deleteParlayById: vi.fn(),
  findLegsForPick: vi.fn(),
  findUserParlayByClientRef: vi.fn(),
  insertParlayLegRows: vi.fn(),
  insertParlayParent: vi.fn(),
}));

vi.mock("../server/repositories/parlayRepository", () => repository);

const baseLegs = [
  {
    sport: "mlb",
    event_id: "745001",
    teamId: 147,
    playerId: 592450,
    market: "hr",
    marketCode: "HR",
    selection: "Aaron Judge HR",
    odds: 150,
  },
  {
    sport: "mlb",
    event_id: "745001",
    teamId: 147,
    playerId: 519317,
    market: "hits",
    marketCode: "HIT",
    selection: "Giancarlo Stanton Hit",
    odds_decimal: 1.8,
  },
];

describe("SaveMeParlaySchema", () => {
  it("rejects fake generated legacy game ids", () => {
    const parsed = SaveMeParlaySchema.safeParse({
      legs: [{ event_id: "leg-123", selection: "Bad generated leg", odds: 150 }],
    });

    expect(parsed.success).toBe(false);
    expect(parsed.success ? [] : parsed.error.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ["legs", 0, "event_id"],
          message: expect.stringContaining("Fake generated leg IDs cannot be saved"),
        }),
      ])
    );
  });
});

describe("saveUserParlay", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repository.findUserParlayByClientRef.mockResolvedValue(null);
    repository.findLegsForPick.mockResolvedValue([{ id: "leg-row-1" }, { id: "leg-row-2" }]);
    repository.createParlayWithLegsRpc.mockResolvedValue({
      id: "pick-1",
      user_id: "user-1",
      status: "pending",
      leg_type: "parlay",
    });
  });

  it("uses the RPC save path with canonical grading identity and server-owned status", async () => {
    const result = await saveUserParlay({
      userId: "user-1",
      body: SaveMeParlaySchema.parse({
        id: "local-slip-1",
        title: "Yankees HR slip",
        mode: "REAL",
        source: "command_center",
        status: "won",
        clientRef: "client-ref-1",
        wagerAmount: 10,
        edgeScore: 68,
        legs: baseLegs,
      }),
    });

    expect(result.statusCode).toBe(201);
    expect(result.body.combined_odds).toBe(4.5);
    expect(result.body.deduped).toBe(false);
    expect(repository.createParlayWithLegsRpc).toHaveBeenCalledWith(
      expect.objectContaining({
        p_user_id: "user-1",
        p_sport: "mlb",
        p_event_id: "745001",
        p_odds_decimal: 4.5,
        p_stake_units: 10,
        p_confidence: 68,
        p_is_demo: false,
        p_source: "command_center",
        p_client_ref: "client-ref-1",
      })
    );

    const rpcPayload = repository.createParlayWithLegsRpc.mock.calls[0][0];
    expect(rpcPayload).not.toHaveProperty("p_status");
    expect(rpcPayload.p_legs[0]).toEqual(
      expect.objectContaining({
        event_id: "745001",
        game_id: "745001",
        team_id: "147",
        player_id: 592450,
        market_code: "ANYTIME_HR",
        stat_target: 1,
        comparator: ">=",
        event_key: "MLB_745001_147_592450_ANYTIME_HR_1_GTE",
        popularity_key: "MLB_592450_ANYTIME_HR_1_GTE",
      })
    );
  });

  it("does not fabricate combined odds when any leg is unpriced", async () => {
    await saveUserParlay({
      userId: "user-1",
      body: SaveMeParlaySchema.parse({
        clientRef: "client-ref-2",
        legs: [{ ...baseLegs[0], odds: undefined }, baseLegs[1]],
      }),
    });

    expect(repository.createParlayWithLegsRpc).toHaveBeenCalledWith(
      expect.objectContaining({
        p_odds_decimal: null,
        p_legs: expect.arrayContaining([
          expect.objectContaining({ odds_decimal: null }),
        ]),
      })
    );
  });

  it("returns an existing client_ref parlay without writing again", async () => {
    repository.findUserParlayByClientRef.mockResolvedValue({
      id: "existing-pick",
      user_id: "user-1",
      status: "pending",
      leg_type: "parlay",
    });

    const result = await saveUserParlay({
      userId: "user-1",
      body: SaveMeParlaySchema.parse({ clientRef: "same-slip", legs: baseLegs }),
    });

    expect(result.statusCode).toBe(200);
    expect(result.body.id).toBe("existing-pick");
    expect(result.body.deduped).toBe(true);
    expect(repository.createParlayWithLegsRpc).not.toHaveBeenCalled();
    expect(repository.insertParlayParent).not.toHaveBeenCalled();
  });

  it("falls back to legacy parent columns when source/client_ref columns are missing", async () => {
    repository.createParlayWithLegsRpc.mockRejectedValue({ code: "42883", message: "function not found" });
    repository.insertParlayParent
      .mockRejectedValueOnce({ code: "42703", message: "column does not exist" })
      .mockResolvedValueOnce({ id: "fallback-pick", status: "pending", leg_type: "parlay" });
    repository.insertParlayLegRows.mockResolvedValue([
      { id: "inserted-1", leg_index: 0 },
      { id: "inserted-2", leg_index: 1 },
    ]);

    const result = await saveUserParlay({
      userId: "user-1",
      body: SaveMeParlaySchema.parse({
        clientRef: "legacy-slip",
        status: "lost",
        legs: baseLegs,
      }),
    });

    expect(result.statusCode).toBe(201);
    expect(repository.insertParlayParent).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        status: "pending",
        source: "manual",
        client_ref: "legacy-slip",
      })
    );
    expect(repository.insertParlayParent).toHaveBeenNthCalledWith(
      2,
      expect.not.objectContaining({
        source: expect.anything(),
        client_ref: expect.anything(),
      })
    );
  });

  it("rolls back the fallback parent when leg insert count mismatches", async () => {
    repository.createParlayWithLegsRpc.mockRejectedValue({ code: "42883", message: "function not found" });
    repository.insertParlayParent.mockResolvedValue({ id: "orphan-risk-pick", status: "pending", leg_type: "parlay" });
    repository.insertParlayLegRows.mockResolvedValue([{ id: "only-one-leg", leg_index: 0 }]);

    await expect(
      saveUserParlay({
        userId: "user-1",
        body: SaveMeParlaySchema.parse({ clientRef: "rollback-slip", legs: baseLegs }),
      })
    ).rejects.toBeInstanceOf(AppError);

    expect(repository.deleteParlayById).toHaveBeenCalledWith("orphan-risk-pick");
  });
});
