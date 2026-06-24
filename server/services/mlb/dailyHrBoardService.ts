/**
 * Daily HR Board service. Builds today's hitter-vs-pitcher HR board grouped by game.
 * Deterministic scoring first; cached 8 minutes. Lineups are projected placeholders.
 */
import { getScheduleByDate, todayISO } from "./mlbClient";
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

function buildGame(game: NormalizedGame, hittersByTeam: Map<number, NormalizedPlayer[]>): HrBoardGame {
  const proj = projection(game);
  const rows: HrBoardRow[] = [];

  const addSide = (battingTeamId: number, pitcher: NormalizedPitcher | null) => {
    if (!pitcher) return;
    const hitters = projectedLineup(hittersByTeam.get(battingTeamId) ?? []);
    hitters.forEach((h, i) => rows.push(buildHitterRow(h, pitcher, game, i + 1, proj)));
  };

  // Home lineup faces the away probable; away lineup faces the home probable.
  addSide(game.homeTeam.teamId, game.probablePitchers.away);
  addSide(game.awayTeam.teamId, game.probablePitchers.home);

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
  return reportCache.getOrSet(`hrboard:${date}`, async () => {
    const [games, hittersByTeam] = await Promise.all([getScheduleByDate(date), getActiveHittersByTeam()]);
    const built = games.map((g) => buildGame(g, hittersByTeam));
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
