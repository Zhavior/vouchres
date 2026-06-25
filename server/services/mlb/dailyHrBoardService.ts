/**
 * Daily HR Board service. Builds today's hitter-vs-pitcher HR board grouped by game.
 * STRICT TEAM VALIDATION: Only hitters that belong to the actual away/home team appear.
 * Uses official game boxscore lineups first; falls back to active roster with strict guard.
 * Cached 8 minutes. Lineups are projected placeholders until official feeds connect.
 */
import { getScheduleByDate, getBoxscore, todayISO } from "./mlbClient";
import { getActiveHittersByTeam } from "./teamRosterClient";
import { reportCache } from "./mlbCache";
import { NormalizedGame, NormalizedPlayer, NormalizedPitcher, DataQuality } from "./mlbTypes";
import { buildHitterRow, HrBoardRow, ProjectionType } from "../intelligence/hrEdgeEngine";
import { seededInt } from "../intelligence/scoring";

const HITTERS_PER_TEAM = 9; // projected lineup size

export interface HrBoardGame {
  gamePk: number;
  matchup: string; // "AWAY @ HOME"
  gameTime: string;
  venue: string;
  status: string;
  environmentTag: "Hitter-Friendly" | "Pitcher-Friendly" | "Neutral";
  parkNote: string;
  weatherNote: string;
  rankedHitters: number;
  rows: HrBoardRow[];
}

export interface HrBoardResponse {
  date: string;
  gameCount: number;
  generatedAt: string;
  dataQuality: DataQuality;
  disclaimer: string;
  games: HrBoardGame[];
}

const DISCLAIMER =
  "HR edge estimates are probability-based research for entertainment — not betting advice. Lineups, park, and weather are projected placeholders until those feeds are connected. No guaranteed outcomes.";

function projection(game: NormalizedGame): ProjectionType {
  const s = game.status.toLowerCase();
  if (s.includes("progress") || s.includes("live")) return "Live";
  if (s.includes("final")) return "Live";
  return "Projected";
}

/** Pick the projected lineup: top hitters by seeded power, assigned spots 1..N. */
function projectedLineup(hitters: NormalizedPlayer[]): NormalizedPlayer[] {
  return [...hitters]
    .sort((a, b) => seededInt(`power:${b.playerId}`, 30, 90) - seededInt(`power:${a.playerId}`, 30, 90))
    .slice(0, HITTERS_PER_TEAM);
}

/** Extract official batting order from boxscore using the `batters` ID list.
 *  The boxscore always includes `teams.home.batters` and `teams.away.batters`
 *  as ordered arrays of player IDs — even for pre-game schedules.
 *  Players are looked up in the `players` dict keyed by "ID{playerId}".
 */
function extractOfficialLineupFromBoxscore(boxscore: any, battingTeamId: number): NormalizedPlayer[] {
  const hitters: NormalizedPlayer[] = [];
  try {
    const teams = boxscore?.teams;
    if (!teams) return hitters;

    for (const side of [teams.home, teams.away]) {
      if (!side) continue;
      const sideTeamId: number = side.team?.id;
      if (sideTeamId !== battingTeamId) continue;

      const batterIds: number[] = Array.isArray(side.batters) ? side.batters : [];
      const players: Record<string, any> = side.players ?? {};
      const teamName: string = side.team?.name ?? "Unknown";

      for (const pid of batterIds) {
        const entry = players[`ID${pid}`];
        if (!entry?.person) continue;

        const pos: string = entry.position?.abbreviation ?? "—";
        // Exclude pitchers from the batting board
        if (pos === "P") continue;

        const batsCode = entry.person?.batSide?.code ?? "U";
        hitters.push({
          playerId: pid,
          playerName: entry.person.fullName,
          position: pos,
          bats: batsCode === "L" ? "L" : batsCode === "R" ? "R" : batsCode === "S" ? "S" : "U",
          team: teamName,
          teamId: sideTeamId,
          headshot: `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/${pid}/headshot/67/current`,
        });
      }
      // Found the right side — no need to check the other
      if (hitters.length > 0) break;
    }
  } catch (err) {
    console.warn(`[dailyHrBoardService] extractOfficialLineupFromBoxscore failed for team ${battingTeamId}:`, (err as Error).message);
  }
  return hitters;
}

function buildGame(game: NormalizedGame, hittersByTeam: Map<number, NormalizedPlayer[]>, boxscores: Map<number, any>): HrBoardGame {
  const proj = projection(game);
  const rows: HrBoardRow[] = [];

  const addSide = (battingTeamId: number, pitcher: NormalizedPitcher | null) => {
    if (!pitcher) return;

    // Try official boxscore lineup first
    const boxscore = boxscores.get(game.gamePk);
    let hitters: NormalizedPlayer[] = [];
    if (boxscore) {
      hitters = extractOfficialLineupFromBoxscore(boxscore, battingTeamId);
    }

    // Fallback: active roster with strict team validation
    if (hitters.length === 0) {
      const rawHitters = hittersByTeam.get(battingTeamId) ?? [];
      hitters = projectedLineup(rawHitters);
    }

    // STRICT GUARD: Reject any hitter that doesn't belong to the batting team
    const validHitters = hitters.filter((h) => {
      const isValid = h.teamId === battingTeamId;
      if (!isValid) {
        console.warn(
          `[dailyHrBoardService] REJECTED invalid hitter: ${h.playerName} (team ID ${h.teamId}) does not belong to ${game[battingTeamId === game.homeTeam.teamId ? "homeTeam" : "awayTeam"].name} (ID ${battingTeamId})`,
        );
      }
      return isValid;
    });

    validHitters.forEach((h, i) => rows.push(buildHitterRow(h, pitcher, game, i + 1, proj)));
  };

  // Home lineup faces the away probable; away lineup faces the home probable.
  addSide(game.homeTeam.teamId, game.probablePitchers.away);
  addSide(game.awayTeam.teamId, game.probablePitchers.home);

  // FINAL HARD FILTER: drop any row whose teamId is not one of the two teams in this game
  const validTeamIds = new Set([game.homeTeam.teamId, game.awayTeam.teamId]);
  const beforeCount = rows.length;
  const filteredRows = rows.filter((r) => {
    if (!validTeamIds.has(r.teamId)) {
      console.warn(
        `[HR BOARD FINAL DROP] ${r.playerName} teamId=${r.teamId} not in game ${game.awayTeam.abbreviation}@${game.homeTeam.abbreviation} (${[...validTeamIds].join(",")})`
      );
      return false;
    }
    return true;
  });
  if (filteredRows.length !== beforeCount) {
    console.warn(`[HR BOARD FINAL DROP] game ${game.gamePk}: dropped ${beforeCount - filteredRows.length} rows with wrong teamId`);
  }
  rows.length = 0;
  rows.push(...filteredRows);

  rows.sort((a, b) => b.hrEdge - a.hrEdge);

  const avgEdge = rows.length ? rows.reduce((s, r) => s + r.hrEdge, 0) / rows.length : 0;
  const avgPark = rows.length ? rows.reduce((s, r) => s + r.parkFactor, 0) / rows.length : 100;
  const environmentTag: HrBoardGame["environmentTag"] =
    avgEdge >= 62 || avgPark >= 106 ? "Hitter-Friendly" : avgEdge <= 45 && avgPark <= 96 ? "Pitcher-Friendly" : "Neutral";

  const wx = rows[0]?.weatherBoost ?? 0;

  return {
    gamePk: game.gamePk,
    matchup: `${game.awayTeam.abbreviation} @ ${game.homeTeam.abbreviation}`,
    gameTime: game.gameDate,
    venue: game.venue,
    status: game.status,
    environmentTag,
    parkNote: `${game.venue} · park factor ~${Math.round(avgPark)} (placeholder)`,
    weatherNote: `Weather boost ${wx > 0 ? "+" : ""}${wx}% (placeholder until weather API)`,
    rankedHitters: rows.length,
    rows,
  };
}

export async function buildHrBoard(date = todayISO()): Promise<HrBoardResponse> {
  return reportCache.getOrSet(`hrboard_v2:${date}`, async () => {
    const [games, hittersByTeam] = await Promise.all([getScheduleByDate(date), getActiveHittersByTeam()]);

    // Fetch boxscores for all games (to get official lineups)
    const boxscoresPromises = games.map((g) =>
      getBoxscore(g.gamePk)
        .then((bs) => ({ gamePk: g.gamePk, data: bs }))
        .catch(() => ({ gamePk: g.gamePk, data: null })),
    );
    const boxscoresArray = await Promise.all(boxscoresPromises);
    const boxscores = new Map(boxscoresArray.map((b) => [b.gamePk, b.data]).filter((b) => b[1] !== null));

    console.log(`[dailyHrBoardService] Fetched boxscores for ${boxscores.size} of ${games.length} games`);

    const built = games.map((g) => buildGame(g, hittersByTeam, boxscores));
    const haveHitters = hittersByTeam.size > 0;
    return {
      date,
      gameCount: games.length,
      generatedAt: new Date().toISOString(),
      dataQuality: games.length && haveHitters ? "partial" : "limited",
      disclaimer: DISCLAIMER,
      games: built,
    };
  }, 8 * 60_000) as Promise<HrBoardResponse>;
}

/** Deep detail for a single player from today's (or given date's) board. */
export async function getHrBoardPlayer(playerId: number, date = todayISO()): Promise<HrBoardRow | null> {
  const board = await buildHrBoard(date);
  for (const g of board.games) {
    const row = g.rows.find((r) => r.playerId === playerId);
    if (row) return row;
  }
  return null;
}
