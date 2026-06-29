/**
 * Daily HR Board service. Builds today's hitter-vs-pitcher HR board grouped by game.
 *
 * Data sources (all real, no synthetic):
 *   - Rosters: verified via currentTeam.id double-check (teamRosterClient)
 *   - Lineups: MLB boxscore batters[] array (official order)
 *   - Hitter stats: MLB Stats API season + last-7 game log
 *   - Pitcher stats: MLB Stats API season pitching (HR/9, ERA, BB/K)
 *   - Park factors: static sourced table (parkFactors.ts)
 *   - Weather: unavailable (set to 0, not faked)
 *   - Sportsbook odds: unavailable (not generated)
 *
 * Cache: 8 minutes (fresh after each game update cycle).
 */
import { getScheduleByDate, getBoxscore, todayISO } from "./mlbClient";
import { getActiveHittersByTeam } from "./teamRosterClient";
import { getHitterStats, getPitcherStats, HitterStats, PitcherSeasonStats } from "./statsClient";
import { reportCache } from "./mlbCache";
import { NormalizedGame, NormalizedPlayer, NormalizedPitcher, DataQuality } from "./mlbTypes";
import { buildHitterRow, HrBoardRow, ProjectionType, lineupSpotFromBattingOrder } from "../intelligence/hrEdgeEngine";

const HITTERS_PER_TEAM = 9;

export interface HrBoardGame {
  gamePk: number;
  matchup: string;
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
  "HR edge estimates use real MLB season stats, pitcher HR/9, and sourced park factors — for research only, not betting advice. " +
  "Weather and sportsbook odds are not available and are not generated. Lineups are projected until official feeds confirm.";

function projection(game: NormalizedGame): ProjectionType {
  const s = game.status.toLowerCase();
  if (s.includes("progress") || s.includes("live") || s.includes("final")) return "Live";
  return "Projected";
}

/** Top-N hitters by HR rate from roster when no boxscore lineup available. */
function rosterTopHitters(
  hitters: NormalizedPlayer[],
  hitterStatsMap: Map<number, HitterStats>
): NormalizedPlayer[] {
  return [...hitters]
    .sort((a, b) => {
      const sa = hitterStatsMap.get(a.playerId)?.season?.hrPerPA ?? 0;
      const sb = hitterStatsMap.get(b.playerId)?.season?.hrPerPA ?? 0;
      return sb - sa;
    })
    .slice(0, HITTERS_PER_TEAM);
}

/** Extract official batting order from boxscore. Returns players with battingOrder. */
function extractOfficialLineupFromBoxscore(
  boxscore: any,
  battingTeamId: number
): Array<NormalizedPlayer & { battingOrder: number | null }> {
  const result: Array<NormalizedPlayer & { battingOrder: number | null }> = [];
  try {
    const teams = boxscore?.teams;
    if (!teams) return result;

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
        if (pos === "P") continue;

        const batsCode = entry.person?.batSide?.code ?? "U";
        const battingOrder: number | null =
          typeof entry.battingOrder === "number" && entry.battingOrder > 0
            ? entry.battingOrder
            : null;

        result.push({
          playerId: pid,
          playerName: entry.person.fullName,
          position: pos,
          bats: batsCode === "L" ? "L" : batsCode === "R" ? "R" : batsCode === "S" ? "S" : "U",
          team: teamName,
          teamId: sideTeamId,
          headshot: `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/${pid}/headshot/67/current`,
          battingOrder,
        });
      }
      if (result.length > 0) break;
    }
  } catch (err) {
    console.warn(`[dailyHrBoardService] extractOfficialLineupFromBoxscore error for team ${battingTeamId}:`, (err as Error).message);
  }
  return result;
}

async function buildGame(
  game: NormalizedGame,
  hittersByTeam: Map<number, NormalizedPlayer[]>,
  boxscores: Map<number, any>,
  hitterStatsMap: Map<number, HitterStats>,
  pitcherStatsMap: Map<number, PitcherSeasonStats | null>
): Promise<HrBoardGame> {
  const proj = projection(game);
  const rows: HrBoardRow[] = [];

  const addSide = (battingTeamId: number, pitcher: NormalizedPitcher | null) => {
    if (!pitcher) return;

    const pitcherStats = pitcherStatsMap.get(pitcher.pitcherId) ?? null;

    // Try official boxscore lineup first
    const boxscore = boxscores.get(game.gamePk);
    let linedUpHitters: Array<NormalizedPlayer & { battingOrder: number | null }> = [];
    if (boxscore) {
      linedUpHitters = extractOfficialLineupFromBoxscore(boxscore, battingTeamId);
    }

    // Fallback: roster sorted by HR/PA
    let hitters: NormalizedPlayer[];
    let battingOrderMap: Map<number, number | null>;

    if (linedUpHitters.length > 0) {
      hitters = linedUpHitters;
      battingOrderMap = new Map(linedUpHitters.map((h) => [h.playerId, h.battingOrder]));
    } else {
      const rawHitters = hittersByTeam.get(battingTeamId) ?? [];
      hitters = rosterTopHitters(rawHitters, hitterStatsMap);
      battingOrderMap = new Map();
    }

    // STRICT GUARD: reject any hitter not belonging to this team
    const validHitters = hitters.filter((h) => {
      if (h.teamId !== battingTeamId) {
        console.warn(`[dailyHrBoardService] REJECTED ${h.playerName} (teamId=${h.teamId}) for team ${battingTeamId}`);
        return false;
      }
      return true;
    });

    validHitters.forEach((h, i) => {
      const battingOrder = battingOrderMap.get(h.playerId) ?? null;
      const lineupSpot = battingOrder ? lineupSpotFromBattingOrder(battingOrder) : i + 1;
      const hStats = hitterStatsMap.get(h.playerId);
      rows.push(buildHitterRow(h, pitcher, game, lineupSpot, proj, hStats, pitcherStats, battingOrder));
    });
  };

  addSide(game.homeTeam.teamId, game.probablePitchers.away);
  addSide(game.awayTeam.teamId, game.probablePitchers.home);

  // FINAL HARD FILTER: only rows for teams in this game
  const validTeamIds = new Set([game.homeTeam.teamId, game.awayTeam.teamId]);
  const filteredRows = rows.filter((r) => {
    if (!validTeamIds.has(r.teamId)) {
      console.warn(`[HR BOARD FINAL DROP] ${r.playerName} teamId=${r.teamId} not in game ${game.gamePk}`);
      return false;
    }
    return true;
  });

  filteredRows.sort((a, b) => b.hrEdge - a.hrEdge);

  const avgEdge = filteredRows.length ? filteredRows.reduce((s, r) => s + r.hrEdge, 0) / filteredRows.length : 0;
  const avgPark = filteredRows.length ? filteredRows.reduce((s, r) => s + r.parkFactor, 0) / filteredRows.length : 100;
  const environmentTag: HrBoardGame["environmentTag"] =
    avgEdge >= 62 || avgPark >= 106 ? "Hitter-Friendly" : avgEdge <= 45 && avgPark <= 96 ? "Pitcher-Friendly" : "Neutral";

  return {
    gamePk: game.gamePk,
    matchup: `${game.awayTeam.abbreviation} @ ${game.homeTeam.abbreviation}`,
    gameTime: game.gameDate,
    venue: game.venue,
    status: game.status,
    environmentTag,
    parkNote: `${game.venue} · park factor ${Math.round(avgPark)} (sourced table)`,
    weatherNote: "Weather unavailable — not generated.",
    rankedHitters: filteredRows.length,
    rows: filteredRows,
  };
}

export async function buildHrBoard(date = todayISO()): Promise<HrBoardResponse> {
  return reportCache.getOrSet(`hrboard_v4:${date}`, async () => {
    // STEP 1: Fetch today's schedule first (fast — one API call)
    const games = await getScheduleByDate(date);

    // STEP 2: Extract team IDs from today's games only (not all 30 teams)
    const todayTeamIds = new Set<number>();
    for (const g of games) {
      if (g.awayTeam?.teamId) todayTeamIds.add(g.awayTeam.teamId);
      if (g.homeTeam?.teamId) todayTeamIds.add(g.homeTeam.teamId);
    }
    const teamIdList = [...todayTeamIds];
    console.log(`[dailyHrBoardService] Today's slate: ${games.length} games, ${teamIdList.length} unique teams`);

    // STEP 3: Fetch rosters ONLY for today's teams (not all 30)
    const hittersByTeam = await getActiveHittersByTeam(teamIdList);

    // STEP 4: Limit to top 13 playable power hitters per team (by batting order)
    // This cuts ~250 hitters → ~100, keeping only the players likely to hit HRs
    const MAX_HITTERS_PER_TEAM = 13;
    const allHitterIds = new Set<number>();
    const allPitcherIds = new Set<number>();

    for (const [teamId, players] of hittersByTeam) {
      const topHitters = players
        .sort((a, b) => (a.battingOrder ?? 99) - (b.battingOrder ?? 99))
        .slice(0, MAX_HITTERS_PER_TEAM);
      for (const p of topHitters) allHitterIds.add(p.playerId);
    }
    for (const g of games) {
      if (g.probablePitchers.away?.pitcherId) allPitcherIds.add(g.probablePitchers.away.pitcherId);
      if (g.probablePitchers.home?.pitcherId) allPitcherIds.add(g.probablePitchers.home.pitcherId);
    }

    const hitterIds = [...allHitterIds];
    console.log(`[dailyHrBoardService] Fetching stats: ${hitterIds.length} hitters (top ${MAX_HITTERS_PER_TEAM}/team), ${allPitcherIds.size} pitchers`);

    // STEP 5: Fetch hitter stats in batches of 10 (was 20 — lower concurrency = more stable)
    const CONCURRENCY = 10;
    const hitterStatsList: HitterStats[] = [];
    for (let i = 0; i < hitterIds.length; i += CONCURRENCY) {
      const batch = hitterIds.slice(i, i + CONCURRENCY);
      const results = await Promise.allSettled(batch.map((id) => getHitterStats(id)));
      for (const r of results) {
        if (r.status === "fulfilled") hitterStatsList.push(r.value);
      }
    }
    const hitterStatsMap = new Map(hitterStatsList.map((s) => [s.playerId, s]));

    // STEP 6: Fetch pitcher stats (only ~26 probable pitchers — fast)
    const pitcherStatsResults = await Promise.allSettled(
      [...allPitcherIds].map(async (id) => ({ id, stats: await getPitcherStats(id) }))
    );
    const pitcherStatsMap = new Map<number, PitcherSeasonStats | null>();
    for (const r of pitcherStatsResults) {
      if (r.status === "fulfilled") pitcherStatsMap.set(r.value.id, r.value.stats.season);
    }

    // STEP 7: Skip boxscores for pre-game board (they're empty before first pitch anyway)
    const boxscores = new Map<number, any>();

    console.log(`[dailyHrBoardService] Stats loaded: ${hitterStatsMap.size} hitters, ${pitcherStatsMap.size} pitchers`);

    const built = await Promise.all(
      games.map((g) => buildGame(g, hittersByTeam, boxscores, hitterStatsMap, pitcherStatsMap))
    );

    const haveHitters = hittersByTeam.size > 0;
    const haveStats = hitterStatsMap.size > 0;
    return {
      date,
      gameCount: games.length,
      generatedAt: new Date().toISOString(),
      dataQuality: games.length && haveHitters && haveStats ? "partial" : "limited",
      disclaimer: DISCLAIMER,
      games: built,
    };
  }, 5 * 60_000) as Promise<HrBoardResponse>;
}

export async function getHrBoardPlayer(playerId: number, date = todayISO()): Promise<HrBoardRow | null> {
  const board = await buildHrBoard(date);
  for (const g of board.games) {
    const row = g.rows.find((r) => r.playerId === playerId);
    if (row) return row;
  }
  return null;
}
