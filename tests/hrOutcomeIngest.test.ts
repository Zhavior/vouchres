import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The MLB feed is mocked at the client boundary, so these tests exercise the
 * real schedule -> filter -> boxscore -> build -> write path without a network
 * call. The Supabase client is a minimal in-memory stand-in that enforces the
 * one property that matters: (game_pk, player_id) is unique and conflicts are
 * ignored rather than overwritten.
 */
const getScheduleByDate = vi.fn();
const getBoxscore = vi.fn();

vi.mock("../server/services/mlb/mlbClient", () => ({
  getScheduleByDate: (date: string) => getScheduleByDate(date),
  getBoxscore: (gamePk: number) => getBoxscore(gamePk),
  getScheduleForLiveBoard: vi.fn(),
  getTodayGames: vi.fn(),
  getProbablePitchers: vi.fn(),
  getGameFeed: vi.fn(),
  getLinescore: vi.fn(),
  getPlayerBasics: vi.fn(),
}));

const { ingestOutcomesForDate } = await import("../server/services/hr-history/outcomeIngest");
const { slateDatesToIngest, parseFlags } = await import("../server/cron/hrOutcomeIngest");

/** Minimal fake of the two Supabase calls the writer makes. */
function fakeDb() {
  const rows: Array<Record<string, unknown>> = [];
  const keys = new Set<string>();

  return {
    rows,
    insertCalls: 0,
    from(table: string) {
      if (table !== "hr_game_outcomes") throw new Error(`unexpected table ${table}`);
      const self = this as ReturnType<typeof fakeDb>;
      return {
        select(_columns: string) {
          let date: string | null = null;
          const chain = {
            eq(_column: string, value: string) {
              date = value;
              return chain;
            },
            range(_from: number, _to: number) {
              return Promise.resolve({
                data: rows.filter((row) => row.game_date === date).map((row) => ({ game_pk: row.game_pk })),
                error: null,
              });
            },
          };
          return chain;
        },
        upsert(payload: Array<Record<string, unknown>>, options: { ignoreDuplicates?: boolean }) {
          self.insertCalls += 1;
          expect(options.ignoreDuplicates).toBe(true);
          for (const row of payload) {
            const key = `${row.game_pk}:${row.player_id}`;
            // ON CONFLICT DO NOTHING — an existing key is left untouched.
            if (keys.has(key)) continue;
            keys.add(key);
            rows.push(row);
          }
          return Promise.resolve({ error: null });
        },
      };
    },
  };
}

function game(gamePk: number, status: string) {
  return { gamePk, status };
}

function boxscoreFor(awayIds: number[], homeIds: number[], hrBy: number[] = []) {
  const side = (teamId: number, ids: number[]) => ({
    team: { id: teamId },
    batters: ids,
    players: Object.fromEntries(
      ids.map((id, index) => [
        `ID${id}`,
        {
          person: { id },
          battingOrder: `${index + 1}00`,
          stats: { batting: { plateAppearances: 4, homeRuns: hrBy.includes(id) ? 1 : 0 } },
        },
      ]),
    ),
  });
  return { teams: { away: side(119, awayIds), home: side(121, homeIds) } };
}

beforeEach(() => {
  getScheduleByDate.mockReset();
  getBoxscore.mockReset();
});

describe("slateDatesToIngest — window", () => {
  it("covers the previous slate and re-checks the one before it", () => {
    expect(slateDatesToIngest(new Date("2026-08-10T09:00:00.000Z"), null)).toEqual([
      "2026-08-09",
      "2026-08-08",
    ]);
  });

  it("steps across a month boundary", () => {
    expect(slateDatesToIngest(new Date("2026-09-01T09:00:00.000Z"), null)).toEqual([
      "2026-08-31",
      "2026-08-30",
    ]);
  });

  it("steps across a year boundary", () => {
    expect(slateDatesToIngest(new Date("2027-01-01T09:00:00.000Z"), null)).toEqual([
      "2026-12-31",
      "2026-12-30",
    ]);
  });

  it("is unaffected by the hour of the run, as long as it is the day after the slate", () => {
    const early = slateDatesToIngest(new Date("2026-08-10T00:05:00.000Z"), null);
    const late = slateDatesToIngest(new Date("2026-08-10T23:55:00.000Z"), null);
    expect(early).toEqual(late);
  });

  it("does not touch the neighbouring slate when --date is explicit", () => {
    expect(slateDatesToIngest(new Date("2026-08-10T09:00:00.000Z"), "2026-05-01")).toEqual([
      "2026-05-01",
    ]);
  });
});

describe("parseFlags", () => {
  it("reads --dry-run and --date", () => {
    expect(parseFlags(["--dry-run", "--date=2026-08-08"])).toEqual({
      dryRun: true,
      date: "2026-08-08",
    });
    expect(parseFlags([])).toEqual({ dryRun: false, date: null });
  });
});

describe("ingestOutcomesForDate — idempotency", () => {
  it("writes rows on the first run and zero on an immediate re-run", async () => {
    getScheduleByDate.mockResolvedValue([game(1, "Final"), game(2, "Final")]);
    getBoxscore.mockImplementation((gamePk: number) =>
      Promise.resolve(
        gamePk === 1 ? boxscoreFor([10, 11], [20, 21], [10]) : boxscoreFor([30], [40], []),
      ),
    );

    const db = fakeDb();
    const first = await ingestOutcomesForDate({
      date: "2026-08-08",
      dryRun: false,
      db: db as never,
      requestDelayMs: 0,
    });

    expect(first.rowsWritten).toBe(6);
    expect(db.rows).toHaveLength(6);
    expect(first.hrRows).toBe(1);

    const second = await ingestOutcomesForDate({
      date: "2026-08-08",
      dryRun: false,
      db: db as never,
      requestDelayMs: 0,
    });

    expect(second.rowsWritten).toBe(0);
    expect(second.skipCounts.already_ingested).toBe(2);
    expect(db.rows).toHaveLength(6);
    // Already-ingested games are not re-fetched, so a nightly re-run costs one
    // schedule call rather than a boxscore call per game.
    expect(getBoxscore).toHaveBeenCalledTimes(2);
  });

  it("does not treat another date's rows as already ingested", async () => {
    getScheduleByDate.mockResolvedValue([game(1, "Final")]);
    getBoxscore.mockResolvedValue(boxscoreFor([10], [20], []));

    const db = fakeDb();
    await ingestOutcomesForDate({ date: "2026-08-08", dryRun: false, db: db as never, requestDelayMs: 0 });
    const other = await ingestOutcomesForDate({
      date: "2026-08-09",
      dryRun: false,
      db: db as never,
      requestDelayMs: 0,
    });

    expect(other.skipCounts.already_ingested).toBeUndefined();
  });
});

describe("ingestOutcomesForDate — unfinished games", () => {
  it("skips a game that is not final and never fetches its boxscore", async () => {
    getScheduleByDate.mockResolvedValue([
      game(1, "Final"),
      game(2, "In Progress"),
      game(3, "Suspended: Rain"),
    ]);
    getBoxscore.mockResolvedValue(boxscoreFor([10], [20], []));

    const db = fakeDb();
    const report = await ingestOutcomesForDate({
      date: "2026-08-08",
      dryRun: false,
      db: db as never,
      requestDelayMs: 0,
    });

    expect(report.skipCounts.not_final).toBe(2);
    expect(getBoxscore).toHaveBeenCalledTimes(1);
    expect(report.games.filter((g) => g.skipReason === "not_final").map((g) => g.gamePk)).toEqual([
      "2",
      "3",
    ]);
  });

  it("picks up a previously unfinished game once it reports Final", async () => {
    getBoxscore.mockResolvedValue(boxscoreFor([10], [20], [10]));
    const db = fakeDb();

    getScheduleByDate.mockResolvedValue([game(1, "Suspended: Rain")]);
    const firstPass = await ingestOutcomesForDate({
      date: "2026-08-08",
      dryRun: false,
      db: db as never,
      requestDelayMs: 0,
    });
    expect(firstPass.rowsWritten).toBe(0);

    // The nightly re-check: same date, game now complete. Nothing was recorded
    // for it, so it is not in the already-ingested set.
    getScheduleByDate.mockResolvedValue([game(1, "Final")]);
    const recheck = await ingestOutcomesForDate({
      date: "2026-08-08",
      dryRun: false,
      db: db as never,
      requestDelayMs: 0,
    });
    expect(recheck.rowsWritten).toBe(2);
    expect(recheck.skipCounts.already_ingested).toBeUndefined();
  });

  it("reports a final game whose boxscore is unavailable and leaves it retryable", async () => {
    getScheduleByDate.mockResolvedValue([game(1, "Final")]);
    getBoxscore.mockResolvedValue(null);

    const db = fakeDb();
    const report = await ingestOutcomesForDate({
      date: "2026-08-08",
      dryRun: false,
      db: db as never,
      requestDelayMs: 0,
    });

    expect(report.skipCounts.boxscore_unavailable).toBe(1);
    expect(db.rows).toHaveLength(0);
  });
});

describe("ingestOutcomesForDate — dry run", () => {
  it("builds rows, writes nothing, and never touches the client", async () => {
    getScheduleByDate.mockResolvedValue([game(1, "Final")]);
    getBoxscore.mockResolvedValue(boxscoreFor([10, 11], [20], []));

    const report = await ingestOutcomesForDate({
      date: "2026-08-08",
      dryRun: true,
      db: null,
      requestDelayMs: 0,
    });

    expect(report.rowsBuilt).toBe(3);
    expect(report.rowsWritten).toBe(0);
  });

  it("refuses a writing run without a client rather than silently dropping rows", async () => {
    await expect(
      ingestOutcomesForDate({ date: "2026-08-08", dryRun: false, db: null, requestDelayMs: 0 }),
    ).rejects.toThrow(/requires a Supabase client/);
  });
});

describe("ingestOutcomesForDate — upstream failure", () => {
  it("propagates a schedule failure instead of recording an empty slate", async () => {
    getScheduleByDate.mockRejectedValue(new Error("statsapi 503"));
    await expect(
      ingestOutcomesForDate({ date: "2026-08-08", dryRun: true, db: null, requestDelayMs: 0 }),
    ).rejects.toThrow("statsapi 503");
  });
});
