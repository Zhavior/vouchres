// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { claimEarlyHrBoard, resetEarlyHrBoardForTests } from "../src/lib/boot/hrBoardEarlyFetch";

const wireBoard = {
  date: "2026-07-28",
  gameCount: 1,
  generatedAt: "2026-07-28T12:00:00.000Z",
  dataQuality: "projection_preview",
  disclaimer: "Research only",
  contractVersion: "hr-board.v2",
  candidates: [{ playerId: 7, playerName: "Early Hitter", lineupStatus: "confirmed" }],
};

function seedEarlyResponse(body: unknown) {
  window.__veHrBoardEarly = Promise.resolve(body);
  window.__veHrBoardEarlyCacheControl = "private, max-age=30, stale-while-revalidate=120";
}

describe("HR board early fetch", () => {
  beforeEach(() => {
    resetEarlyHrBoardForTests();
    delete window.__veHrBoardEarly;
    delete window.__veHrBoardEarlyCacheControl;
    vi.useRealTimers();
  });

  it("returns null when the inline script did not start a request", () => {
    expect(claimEarlyHrBoard()).toBeNull();
  });

  it("unwraps the API envelope into a parsed board", async () => {
    seedEarlyResponse({ ok: true, data: wireBoard });

    const board = await claimEarlyHrBoard()!;

    expect(board.rows?.[0]).toMatchObject({ playerId: 7, playerName: "Early Hitter" });
  });

  it("shares one parsed result across consumers so the board is fetched once", async () => {
    const parse = vi.fn(() => ({ ok: true, data: wireBoard }));
    window.__veHrBoardEarly = Promise.resolve(null).then(parse);

    const first = claimEarlyHrBoard();
    const second = claimEarlyHrBoard();

    expect(first).toBe(second);
    await first;
    expect(parse).toHaveBeenCalledTimes(1);
  });

  it("stops serving the early payload once it is past its freshness window", async () => {
    seedEarlyResponse({ ok: true, data: wireBoard });
    await claimEarlyHrBoard()!;

    const nowSpy = vi.spyOn(performance, "now").mockReturnValue(60_000);
    expect(claimEarlyHrBoard()).toBeNull();
    nowSpy.mockRestore();
  });

  it("surfaces a failed early request so the caller can fall back to the loader", async () => {
    window.__veHrBoardEarly = Promise.reject(new Error("hr_board_early_fetch_failed"));
    window.__veHrBoardEarly.catch(() => {});

    await expect(claimEarlyHrBoard()!).rejects.toThrow("hr_board_early_fetch_failed");
  });
});
