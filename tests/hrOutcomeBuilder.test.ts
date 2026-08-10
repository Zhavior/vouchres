import { describe, expect, it } from "vitest";
import {
  buildOutcomeRows,
  isIngestibleGameState,
} from "../server/services/hr-history/outcomeBuilder";

/**
 * Shape mirrors the live MLB boxscore payload: `players` is keyed "ID<id>",
 * `battingOrder` is a string ("300" = starting 3rd, "301" = the sub who
 * replaced them), and a player who never batted carries `stats.batting = {}`.
 */
interface PlayerSpec {
  id: number;
  battingOrder?: string;
  pa?: number;
  hr?: number;
  /** Set to true to emit `stats.batting = {}` — the did-not-bat shape. */
  didNotBat?: boolean;
}

function team(teamId: number | null, players: PlayerSpec[]) {
  const map: Record<string, unknown> = {};
  for (const spec of players) {
    map[`ID${spec.id}`] = {
      person: { id: spec.id },
      battingOrder: spec.battingOrder,
      stats: {
        batting: spec.didNotBat
          ? {}
          : {
              ...(spec.pa === undefined ? {} : { plateAppearances: spec.pa }),
              ...(spec.hr === undefined ? {} : { homeRuns: spec.hr }),
            },
      },
    };
  }
  return {
    team: teamId === null ? {} : { id: teamId },
    batters: players.map((p) => p.id),
    players: map,
  };
}

function boxscore(away: unknown, home: unknown) {
  return { teams: { away, home } };
}

const BASE = { gamePk: "775296", gameDate: "2026-08-08", gameState: "Final" };

describe("label definition — a row requires >= 1 plate appearance", () => {
  it("produces no row for a player who did not bat", () => {
    const result = buildOutcomeRows({
      ...BASE,
      boxscore: boxscore(
        team(119, [
          { id: 1, battingOrder: "100", pa: 4, hr: 0 },
          { id: 2, didNotBat: true },
        ]),
        team(121, [{ id: 3, battingOrder: "100", pa: 4, hr: 0 }]),
      ),
    });

    expect(result.rows.map((r) => r.player_id)).toEqual(["1", "3"]);
    expect(result.noPlateAppearance).toBe(1);
  });

  it("produces no row for a batter with an explicit 0 plate appearances", () => {
    const result = buildOutcomeRows({
      ...BASE,
      boxscore: boxscore(
        team(119, [
          { id: 1, battingOrder: "100", pa: 4, hr: 1 },
          // Pinch runner: on the roster, in the batters array, never batted.
          { id: 2, battingOrder: "401", pa: 0, hr: 0 },
        ]),
        team(121, [{ id: 3, battingOrder: "100", pa: 3, hr: 0 }]),
      ),
    });

    expect(result.rows.map((r) => r.player_id)).toEqual(["1", "3"]);
    expect(result.rows.every((r) => r.plate_appearances >= 1)).toBe(true);
  });

  it("never emits a zero row for a non-participant, even when the whole bench is listed", () => {
    const bench: PlayerSpec[] = Array.from({ length: 12 }, (_, i) => ({
      id: 100 + i,
      didNotBat: true,
    }));
    const result = buildOutcomeRows({
      ...BASE,
      boxscore: boxscore(
        team(119, [{ id: 1, battingOrder: "100", pa: 4, hr: 0 }, ...bench]),
        team(121, [{ id: 3, battingOrder: "100", pa: 4, hr: 0 }]),
      ),
    });

    expect(result.rows).toHaveLength(2);
    expect(result.noPlateAppearance).toBe(12);
  });
});

describe("hr_flag", () => {
  it("is false for a batter who did not homer", () => {
    const result = buildOutcomeRows({
      ...BASE,
      boxscore: boxscore(
        team(119, [{ id: 1, battingOrder: "100", pa: 4, hr: 0 }]),
        team(121, [{ id: 3, battingOrder: "100", pa: 4, hr: 0 }]),
      ),
    });
    expect(result.rows[0]).toMatchObject({ home_runs: 0, hr_flag: false });
  });

  it("is true for a single home run", () => {
    const result = buildOutcomeRows({
      ...BASE,
      boxscore: boxscore(
        team(119, [{ id: 1, battingOrder: "100", pa: 4, hr: 1 }]),
        team(121, [{ id: 3, battingOrder: "100", pa: 4, hr: 0 }]),
      ),
    });
    expect(result.rows[0]).toMatchObject({ home_runs: 1, hr_flag: true });
  });

  it("stays true for a multi-homer game and keeps the count", () => {
    const result = buildOutcomeRows({
      ...BASE,
      boxscore: boxscore(
        team(119, [{ id: 1, battingOrder: "100", pa: 5, hr: 3 }]),
        team(121, [{ id: 3, battingOrder: "100", pa: 4, hr: 0 }]),
      ),
    });
    expect(result.rows[0]).toMatchObject({ home_runs: 3, hr_flag: true });
  });
});

describe("game state gating", () => {
  const played = boxscore(
    team(119, [{ id: 1, battingOrder: "100", pa: 4, hr: 1 }]),
    team(121, [{ id: 3, battingOrder: "100", pa: 4, hr: 0 }]),
  );

  it.each(["Scheduled", "Pre-Game", "In Progress", "Warmup", "Delayed"])(
    "excludes a game in state %s",
    (state) => {
      const result = buildOutcomeRows({ ...BASE, gameState: state, boxscore: played });
      expect(result.rows).toHaveLength(0);
      expect(result.skipped).toEqual({ reason: "not_final", detail: `game_state=${state}` });
    },
  );

  it.each(["Postponed", "Suspended: Rain", "Cancelled", "Forfeit"])(
    "excludes the terminal-but-not-played state %s",
    (state) => {
      const result = buildOutcomeRows({ ...BASE, gameState: state, boxscore: played });
      expect(result.rows).toHaveLength(0);
      expect(result.skipped?.reason).toBe("not_final");
    },
  );

  it.each(["Final", "Game Over", "Completed Early: Rain"])(
    "ingests the completed state %s",
    (state) => {
      const result = buildOutcomeRows({ ...BASE, gameState: state, boxscore: played });
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0].game_state).toBe(state);
    },
  );

  it("ingests a suspended game once it resumes and reports Final", () => {
    expect(isIngestibleGameState("Suspended: Rain")).toBe(false);
    expect(isIngestibleGameState("Final")).toBe(true);
  });
});

describe("doubleheaders", () => {
  it("stores the same player twice under two distinct game_pks", () => {
    const box = boxscore(
      team(119, [{ id: 1, battingOrder: "100", pa: 4, hr: 1 }]),
      team(121, [{ id: 3, battingOrder: "100", pa: 4, hr: 0 }]),
    );
    const game1 = buildOutcomeRows({ ...BASE, gamePk: "775296", boxscore: box });
    const game2 = buildOutcomeRows({ ...BASE, gamePk: "775297", boxscore: box });

    const keys = [...game1.rows, ...game2.rows].map((r) => `${r.game_pk}:${r.player_id}`);
    expect(keys).toEqual(["775296:1", "775296:3", "775297:1", "775297:3"]);
    expect(new Set(keys).size).toBe(keys.length);
    expect(game1.rows[0].game_date).toBe(game2.rows[0].game_date);
  });
});

describe("batting order", () => {
  it("keeps the official starter spot and leaves substitutes null", () => {
    const result = buildOutcomeRows({
      ...BASE,
      boxscore: boxscore(
        team(119, [
          { id: 1, battingOrder: "300", pa: 3, hr: 0 },
          { id: 2, battingOrder: "301", pa: 1, hr: 1 },
        ]),
        team(121, [{ id: 3, battingOrder: "900", pa: 4, hr: 0 }]),
      ),
    });

    expect(result.rows.map((r) => [r.player_id, r.batting_order])).toEqual([
      ["1", 3],
      ["2", null],
      ["3", 9],
    ]);
  });

  it("is null when the boxscore omits the order entirely", () => {
    const result = buildOutcomeRows({
      ...BASE,
      boxscore: boxscore(
        team(119, [{ id: 1, pa: 2, hr: 0 }]),
        team(121, [{ id: 3, battingOrder: "100", pa: 4, hr: 0 }]),
      ),
    });
    expect(result.rows[0].batting_order).toBeNull();
  });
});

describe("team attribution", () => {
  it("assigns each batter their own team and the other side as opponent", () => {
    const result = buildOutcomeRows({
      ...BASE,
      boxscore: boxscore(
        team(119, [{ id: 1, battingOrder: "100", pa: 4, hr: 0 }]),
        team(121, [{ id: 3, battingOrder: "100", pa: 4, hr: 0 }]),
      ),
    });

    expect(result.rows[0]).toMatchObject({ team_id: "119", opponent_team_id: "121" });
    expect(result.rows[1]).toMatchObject({ team_id: "121", opponent_team_id: "119" });
  });
});

describe("missing input is never substituted", () => {
  it("skips the game when a team id is absent rather than inventing one", () => {
    const result = buildOutcomeRows({
      ...BASE,
      boxscore: boxscore(
        team(null, [{ id: 1, battingOrder: "100", pa: 4, hr: 1 }]),
        team(121, [{ id: 3, battingOrder: "100", pa: 4, hr: 0 }]),
      ),
    });
    expect(result.rows).toHaveLength(0);
    expect(result.skipped?.reason).toBe("missing_team_ids");
  });

  it("skips the game when the boxscore has no teams", () => {
    const result = buildOutcomeRows({ ...BASE, boxscore: null });
    expect(result.rows).toHaveLength(0);
    expect(result.skipped?.reason).toBe("boxscore_unavailable");
  });

  it("drops a batter whose home run count is missing instead of labelling them 0", () => {
    const result = buildOutcomeRows({
      ...BASE,
      boxscore: boxscore(
        team(119, [{ id: 1, battingOrder: "100", pa: 4 }]),
        team(121, [{ id: 3, battingOrder: "100", pa: 4, hr: 0 }]),
      ),
    });

    expect(result.rows.map((r) => r.player_id)).toEqual(["3"]);
    expect(result.malformed).toEqual([
      "775296:1 has 4 PA but no home_runs",
    ]);
  });

  it("reports a final game that produced no labelled batter at all", () => {
    const result = buildOutcomeRows({
      ...BASE,
      boxscore: boxscore(team(119, [{ id: 1, didNotBat: true }]), team(121, [])),
    });
    expect(result.rows).toHaveLength(0);
    expect(result.skipped?.reason).toBe("no_batters_with_pa");
  });
});

describe("row invariants", () => {
  it("every emitted row satisfies the frozen definition", () => {
    const result = buildOutcomeRows({
      ...BASE,
      boxscore: boxscore(
        team(119, [
          { id: 1, battingOrder: "100", pa: 5, hr: 2 },
          { id: 2, battingOrder: "200", pa: 4, hr: 0 },
          { id: 4, didNotBat: true },
        ]),
        team(121, [{ id: 3, battingOrder: "100", pa: 4, hr: 1 }]),
      ),
    });

    expect(result.skipped).toBeNull();
    for (const row of result.rows) {
      expect(row.plate_appearances).toBeGreaterThanOrEqual(1);
      expect(row.home_runs).toBeGreaterThanOrEqual(0);
      expect(row.hr_flag).toBe(row.home_runs >= 1);
      expect(row.game_date).toBe("2026-08-08");
      expect(row.source).toBe("mlb_statsapi");
      expect(row.team_id).not.toBe(row.opponent_team_id);
    }
  });
});
