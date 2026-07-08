/**
 * Pro Pitcher Matchup Drawer service.
 *
 * Builds the per-pitcher matchup payload: pitcher card + opponent projected
 * lineup with batter-vs-pitcher history. All data is sourced from
 * statsapi.mlb.com via the existing clients — no synthetic numbers. When data
 * is unavailable, fields are null and the caller renders "No data yet".
 *
 * This is a NEW module so the existing matchup-matrix logic is untouched.
 */
import { getScheduleByDate, getBoxscore, getPlayerBasics, todayISO } from "./mlbClient";
import { getActiveHittersByTeam } from "./teamRosterClient";
import {
  getHitterStats,
  getPitcherStats,
  getBatterVsPitcher,
  type BatterVsPitcher,
} from "./statsClient";
import { headshotUrl, type NormalizedPlayer, type NormalizedTeam } from "./mlbTypes";
import { reportCache } from "./mlbCache";
import { limitConcurrency } from "../../lib/cache";
import { getStatcastBatterMap, type StatcastBatterQuality } from "./statcastClient";
import { sportsFetchJson } from "../../lib/sports/sportsHttpClient";

const MAX_BATTERS = 13;
const STATS_BASE = (process.env.MLB_API_BASE_URL || "https://statsapi.mlb.com/api").replace(/\/$/, "");

function shiftYmd(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day + days));
  return utc.toISOString().slice(0, 10);
}

async function findGameByPkNearDate(gamePk: number, date: string) {
  const candidateDates = [date, shiftYmd(date, -1), shiftYmd(date, 1)];

  for (const candidateDate of candidateDates) {
    const games = await getScheduleByDate(candidateDate);
    const game = games.find((g) => g.gamePk === gamePk);
    if (game) return { game, resolvedDate: candidateDate };
  }

  return null;
}

/** Batch-fetch batSide codes for a set of player ids in one /people call. */
async function fetchPeopleBatSides(ids: number[]): Promise<Map<number, "L" | "R" | "S">> {
  const out = new Map<number, "L" | "R" | "S">();
  if (ids.length === 0) return out;
  try {
    const json = await sportsFetchJson<any>(`${STATS_BASE}/v1/people?personIds=${ids.join(",")}`, {
      cacheKey: `pitcherMatchup:people:${[...ids].sort((a, b) => a - b).join(",")}`,
      ttlMs: 10 * 60_000,
      timeoutMs: 8_000,
      retries: 1,
      debugLabel: "pitcherMatchup",
    });
    for (const p of json?.people ?? []) {
      const code = p?.batSide?.code;
      if (p?.id && (code === "L" || code === "R" || code === "S")) out.set(p.id, code);
    }
  } catch {
    return out;
  }
  return out;
}

export interface PitcherMatchupBatter {
  id: number;
  name: string;
  bats: "L" | "R" | "S" | "U";
  position: string;
  lineupSpot: number | null;
  headshotUrl: string;
  recentForm: { games: number; hr: number; hits: number; atBats: number; strikeOuts: number } | null;
  vsPitcher: (BatterVsPitcher & { avgText: string | null; slgText: string | null; opsText: string | null }) | null;
  /** Real season batting line. iso/obp are derived (slg-avg, ops-slg) — not separate API fields. */
  seasonStats: { pa: number; avg: number; obp: number; slg: number; iso: number; ops: number; hr: number } | null;
  /** Real Baseball Savant Statcast season quality. Null when the player is under Savant's PA threshold — never estimated. */
  statcast: StatcastBatterQuality | null;
  tags: string[];
}

export interface PitcherMatchupResponse {
  gamePk: number;
  pitcher: {
    id: number;
    name: string;
    team: string;
    throws: "L" | "R" | "U";
    headshotUrl: string;
    seasonStats: unknown | null;
    recentStarts: unknown[];
  };
  opponent: {
    team: string;
    projectedLineup: PitcherMatchupBatter[];
  };
  warnings: string[];
}

/** Official batting order for a team from a boxscore, if posted. */
function lineupFromBoxscore(
  boxscore: any,
  teamId: number
): Array<{ id: number; battingOrder: number | null; position: string; bats: "L" | "R" | "S" | "U"; name: string }> {
  const out: Array<{ id: number; battingOrder: number | null; position: string; bats: "L" | "R" | "S" | "U"; name: string }> = [];
  const teams = boxscore?.teams;
  if (!teams) return out;
  const side = teams.away?.team?.id === teamId ? teams.away : teams.home?.team?.id === teamId ? teams.home : null;
  if (!side) return out;
  const players = side.players ?? {};
  const batterIds: number[] = Array.isArray(side.batters) ? side.batters : [];
  for (const pid of batterIds) {
    const entry = players[`ID${pid}`];
    if (!entry) continue;
    const battingOrder =
      typeof entry.battingOrder === "string" || typeof entry.battingOrder === "number"
        ? parseInt(String(entry.battingOrder), 10)
        : null;
    out.push({
      id: pid,
      battingOrder: Number.isFinite(battingOrder as number) && (battingOrder as number) > 0 ? (battingOrder as number) : null,
      position: entry.position?.abbreviation ?? "—",
      bats: (entry.person?.batSide?.code ?? "U") as "L" | "R" | "S" | "U",
      name: entry.person?.fullName ?? `Player ${pid}`,
    });
  }
  // Starters have battingOrder like 100,200,... Keep those with a real order, sorted.
  const starters = out.filter((b) => b.battingOrder != null).sort((a, b) => (a.battingOrder! - b.battingOrder!));
  return starters.length > 0 ? starters : out;
}

function lineupSpot(battingOrder: number | null): number | null {
  if (battingOrder == null) return null;
  // MLB encodes order as 100=1st, 101=sub; map the hundreds digit to 1-9.
  const spot = Math.floor(battingOrder / 100);
  return spot >= 1 && spot <= 9 ? spot : null;
}

/** Research tags — context only, never advice. */
function buildTags(
  bvp: BatterVsPitcher | null,
  batSide: "L" | "R" | "S" | "U",
  throws: "L" | "R" | "U"
): string[] {
  const tags: string[] = [];

  if (!bvp || bvp.ab === 0) {
    tags.push("No history");
  } else {
    const ab = bvp.ab;
    if (ab < 6) tags.push("Small sample");
    if (bvp.hr > 0) tags.push("Power history");
    if (ab >= 6 && bvp.avg != null && bvp.avg >= 0.3) tags.push("Contact history");
    if (ab >= 6 && bvp.k / ab >= 0.3) tags.push("K risk");
  }

  // Platoon context (switch hitters always have the platoon edge).
  if (batSide === "S") {
    tags.push("Platoon edge");
  } else if (batSide === "L" || batSide === "R") {
    if (throws === "L" || throws === "R") {
      if (batSide !== throws) tags.push("Platoon edge");
      else tags.push("Same-side challenge");
    }
  }

  return tags;
}

export async function getPitcherMatchup(
  gamePk: number,
  pitcherId: number,
  date = todayISO()
): Promise<PitcherMatchupResponse | null> {
  return reportCache.getOrSet(
    `pitcher_matchup_v1:${gamePk}:${pitcherId}:${date}`,
    async () => {
      const resolved = await findGameByPkNearDate(gamePk, date);
      if (!resolved) return null;
      const { game, resolvedDate } = resolved;

      const warnings: string[] = [];
      if (resolvedDate !== date) {
        warnings.push(`Game found on ${resolvedDate}; requested date was ${date}.`);
      }

      // Determine which side the pitcher is on → opponent is the other team.
      const away = game.probablePitchers.away;
      const home = game.probablePitchers.home;
      let pitcherTeam: NormalizedTeam;
      let opponentTeam: NormalizedTeam;

      if (away?.pitcherId === pitcherId) {
        pitcherTeam = game.awayTeam;
        opponentTeam = game.homeTeam;
      } else if (home?.pitcherId === pitcherId) {
        pitcherTeam = game.homeTeam;
        opponentTeam = game.awayTeam;
      } else {
        // Pitcher isn't a listed probable for this game — best-effort: infer from basics.
        warnings.push("Pitcher is not the listed probable for this game");
        const basics = await getPlayerBasics(pitcherId);
        const name = basics?.team ?? "";
        if (name && name === game.awayTeam.name) {
          pitcherTeam = game.awayTeam;
          opponentTeam = game.homeTeam;
        } else if (name && name === game.homeTeam.name) {
          pitcherTeam = game.homeTeam;
          opponentTeam = game.awayTeam;
        } else {
          // Can't confidently determine opponent — default to home team's opponent (away).
          pitcherTeam = game.homeTeam;
          opponentTeam = game.awayTeam;
        }
      }

      // ---- Pitcher card ----
      const [pitcherBasics, pitcherStats] = await Promise.all([
        getPlayerBasics(pitcherId),
        getPitcherStats(pitcherId),
      ]);
      // Prefer a real L/R from the schedule, else fall back to /people basics
      // (the schedule's probablePitcher hydrate often omits pitchHand).
      const scheduleThrows =
        away?.pitcherId === pitcherId ? away.throws
        : home?.pitcherId === pitcherId ? home?.throws
        : undefined;
      const basicsThrows = pitcherBasics?.throws as "L" | "R" | "U" | undefined;
      const throws: "L" | "R" | "U" =
        scheduleThrows === "L" || scheduleThrows === "R" ? scheduleThrows
        : basicsThrows === "L" || basicsThrows === "R" ? basicsThrows
        : "U";

      const pitcher = {
        id: pitcherId,
        name:
          pitcherBasics?.playerName ??
          (away?.pitcherId === pitcherId ? away.pitcherName : home?.pitcherId === pitcherId ? home!.pitcherName : `Pitcher ${pitcherId}`),
        team: pitcherTeam.name,
        throws,
        headshotUrl: headshotUrl(pitcherId),
        seasonStats: pitcherStats.season,
        recentStarts: pitcherStats.recentGames,
      };

      // ---- Opponent projected lineup ----
      const boxscore = await getBoxscore(gamePk);
      let lineupRaw = boxscore ? lineupFromBoxscore(boxscore, opponentTeam.teamId) : [];
      let official = lineupRaw.some((b) => b.battingOrder != null);

      if (lineupRaw.length === 0) {
        // Fallback: active roster hitters (order not official).
        warnings.push("Projected lineup may change");
        const byTeam = await getActiveHittersByTeam([opponentTeam.teamId]);
        const roster: NormalizedPlayer[] = byTeam.get(opponentTeam.teamId) ?? [];
        lineupRaw = roster.slice(0, MAX_BATTERS).map((p) => ({
          id: p.playerId,
          battingOrder: null,
          position: p.position,
          bats: p.bats,
          name: p.playerName,
        }));
      } else if (!official) {
        warnings.push("Projected lineup may change");
      }
      warnings.push("BvP can be small sample");

      const batters = lineupRaw.slice(0, MAX_BATTERS);

      // Enrich handedness for batters whose bat side is unknown (the active-roster
      // fallback doesn't carry batSide). One batched /people call — cheap + cached-ish.
      const unknownBats = batters.filter((b) => b.bats === "U").map((b) => b.id);
      if (unknownBats.length > 0) {
        try {
          const people = await fetchPeopleBatSides(unknownBats);
          for (const b of batters) {
            if (b.bats === "U" && people.has(b.id)) b.bats = people.get(b.id)!;
          }
        } catch {
          // leave as "U" — UI renders "—"
        }
      }

      const statcastMap = await getStatcastBatterMap().catch(() => ({} as Record<number, StatcastBatterQuality>));

      const projectedLineup = await limitConcurrency<PitcherMatchupBatter, typeof batters[number]>(
        batters,
        4,
        async (b) => {
          const [hitter, bvpRaw] = await Promise.all([
            getHitterStats(b.id).catch(() => null),
            getBatterVsPitcher(b.id, pitcherId).catch(() => null),
          ]);

          const recent = hitter?.recentGames ?? [];
          const recentForm =
            recent.length > 0
              ? {
                  games: recent.length,
                  hr: recent.reduce((s, g) => s + g.homeRuns, 0),
                  hits: recent.reduce((s, g) => s + g.hits, 0),
                  atBats: recent.reduce((s, g) => s + g.atBats, 0),
                  strikeOuts: recent.reduce((s, g) => s + g.strikeOuts, 0),
                }
              : null;

          const vsPitcher = bvpRaw
            ? {
                ...bvpRaw,
                avgText: bvpRaw.avg != null ? bvpRaw.avg.toFixed(3).replace(/^0/, "") : null,
                slgText: bvpRaw.slg != null ? bvpRaw.slg.toFixed(3).replace(/^0/, "") : null,
                opsText: bvpRaw.ops != null ? bvpRaw.ops.toFixed(3).replace(/^0/, "") : null,
              }
            : null;

          const season = hitter?.season;
          const seasonStats = season
            ? {
                pa: season.plateAppearances,
                avg: season.avg,
                obp: +(season.ops - season.slg).toFixed(3),
                slg: season.slg,
                iso: +(season.slg - season.avg).toFixed(3),
                ops: season.ops,
                hr: season.homeRuns,
              }
            : null;

          return {
            id: b.id,
            name: b.name,
            bats: b.bats,
            position: b.position,
            lineupSpot: lineupSpot(b.battingOrder),
            headshotUrl: headshotUrl(b.id),
            recentForm,
            vsPitcher,
            seasonStats,
            statcast: statcastMap[b.id] ?? null,
            tags: buildTags(bvpRaw, b.bats, throws),
          };
        }
      );

      const response: PitcherMatchupResponse = {
        gamePk,
        pitcher,
        opponent: { team: opponentTeam.name, projectedLineup },
        warnings: Array.from(new Set(warnings)),
      };
      return response;
    },
    3 * 60_000
  ) as Promise<PitcherMatchupResponse | null>;
}
