import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../server/services/mlb/hrPipeline", () => ({
  buildValidatedHrBoard: vi.fn(),
}));

vi.mock("../server/lib/upstashRedis", () => ({
  isUpstashEnabled: vi.fn(() => false),
  redisGetJson: vi.fn(),
  redisSetJson: vi.fn(),
}));

import { buildValidatedHrBoard } from "../server/services/mlb/hrPipeline";
import { isUpstashEnabled, redisGetJson, redisSetJson } from "../server/lib/upstashRedis";
import {
  expireValidatedHrBoardHubCacheForTests,
  getCachedValidatedHrBoard,
  resetValidatedHrBoardHubForTests,
} from "../server/services/hubs/hrBoardHub";

const sampleBoard = {
  date: "2026-07-08",
  gameCount: 2,
  candidates: [
    {
      playerId: 1,
      playerName: "Aaron Judge",
      team: "NYY",
      dataQuality: "partial",
      warnings: [],
    },
  ],
  projectedCandidates: [
    {
      playerId: 2,
      playerName: "Preview Player",
      team: "BOS",
      dataQuality: "projection_preview",
      warnings: ["Official lineup not posted yet. Do not treat as confirmed."],
    },
  ],
  pool: {
    totalPlayersChecked: 10,
    confirmedStarters: 1,
    projectedStarters: 1,
    benchOrUnknown: 0,
    injuredScratchedBlocked: 0,
    hrCandidatesScored: 1,
  },
  debug: {
    staleDataWarnings: [],
    lastRefresh: "2026-07-08T12:00:00.000Z",
  },
} as Awaited<ReturnType<typeof buildValidatedHrBoard>>;

describe("getCachedValidatedHrBoard last-good fallback", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.mocked(isUpstashEnabled).mockReturnValue(false);
    resetValidatedHrBoardHubForTests();
  });

  it("serves stale validated board immediately while refreshing after TTL expires", async () => {
    vi.useFakeTimers();
    try {
      vi.mocked(buildValidatedHrBoard)
        .mockResolvedValueOnce(sampleBoard)
        .mockResolvedValueOnce({
          ...sampleBoard,
          candidates: [{ ...sampleBoard.candidates[0], playerName: "Refreshed Player" }],
        });

      const first = await getCachedValidatedHrBoard();
      expect(first.candidates[0]?.playerName).toBe("Aaron Judge");

      vi.advanceTimersByTime(901_000);

      const second = await getCachedValidatedHrBoard();
      expect(second.candidates[0]?.playerName).toBe("Aaron Judge");

      await vi.runAllTimersAsync();

      const third = await getCachedValidatedHrBoard();
      expect(third.candidates[0]?.playerName).toBe("Refreshed Player");
    } finally {
      vi.useRealTimers();
      resetValidatedHrBoardHubForTests();
    }
  });

  it("serves last-good validated board when upstream build fails", async () => {
    vi.mocked(buildValidatedHrBoard)
      .mockResolvedValueOnce(sampleBoard)
      .mockRejectedValueOnce(new Error("MLB Stats API circuit open"));

    const first = await getCachedValidatedHrBoard();
    expect(first.candidates).toHaveLength(1);

    expireValidatedHrBoardHubCacheForTests();

    const second = await getCachedValidatedHrBoard();
    expect(second.servedFromLastGood).toBe(true);
    expect(second.lastGoodWarnings).toContain(
      "Serving last good snapshot — upstream temporarily unavailable",
    );
    expect(second.candidates).toEqual(first.candidates);
    expect(second.projectedCandidates[0]?.dataQuality).toBe("projection_preview");
    expect(second.debug?.staleDataWarnings).toContain(
      "Serving last good snapshot — upstream temporarily unavailable",
    );
  });

  it("throws an honest error when upstream fails and no last-good snapshot exists", async () => {
    vi.mocked(buildValidatedHrBoard).mockRejectedValueOnce(new Error("MLB Stats API down"));

    await expect(getCachedValidatedHrBoard()).rejects.toThrow("MLB Stats API down");
  });

  it("serves validated board from Redis hot cache when local L1 is empty", async () => {
    vi.mocked(isUpstashEnabled).mockReturnValue(true);
    const expiresAt = Date.now() + 600_000;
    vi.mocked(redisGetJson).mockResolvedValueOnce({ board: sampleBoard, expiresAt });
    vi.mocked(buildValidatedHrBoard).mockResolvedValue(sampleBoard);

    const result = await getCachedValidatedHrBoard();
    expect(result.candidates[0]?.playerName).toBe("Aaron Judge");
    expect(buildValidatedHrBoard).not.toHaveBeenCalled();
    expect(redisGetJson).toHaveBeenCalledWith("validated-hr-board:hot:validated-hr-board:today");
  });

  it("serves last-good validated board from Redis when local L1 is empty", async () => {
    vi.mocked(isUpstashEnabled).mockReturnValue(true);
    vi.mocked(redisGetJson).mockResolvedValue(null);
    vi.mocked(buildValidatedHrBoard)
      .mockResolvedValueOnce(sampleBoard)
      .mockRejectedValueOnce(new Error("MLB Stats API circuit open"));

    await getCachedValidatedHrBoard();
    expect(redisSetJson).toHaveBeenCalled();

    resetValidatedHrBoardHubForTests();
    expireValidatedHrBoardHubCacheForTests();

    const storedAt = Date.now() - 5_000;
    vi.mocked(redisGetJson)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ board: sampleBoard, storedAt });

    const fallback = await getCachedValidatedHrBoard();
    expect(fallback.servedFromLastGood).toBe(true);
    expect(fallback.lastGoodWarnings).toContain(
      "Serving last good snapshot — upstream temporarily unavailable",
    );
    expect(redisGetJson).toHaveBeenCalled();
  });
});
