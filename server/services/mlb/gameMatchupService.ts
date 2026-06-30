/**
 * Game Matchup service — the brain behind the premium Live Games page.
 * Produces a legit, explainable win probability (log5 + home-field + starting-pitcher
 * vulnerability), the REAL top HR-watch hitters in each game, run environment, pitcher
 * matchups, and a research-framed "what to watch" / AI verdict. Deterministic, cached.
 */
import { getScheduleByDate, todayISO } from "./mlbClient";
import { getActiveHittersByTeam } from "./teamRosterClient";
import { getHitterStats, getPitcherStats, HitterStats, PitcherSeasonStats } from "./statsClient";
import { reportCache } from "./mlbCache";
import { NormalizedGame, NormalizedTeam, NormalizedPitcher, NormalizedPlayer, DataQuality } from "./mlbTypes";
import { buildPitcherVulnerability } from "../intelligence/pitcherVulnerabilityEngine";
import { scoreRunEnvironment, RunEnvironment } from "../intelligence/runEnvironmentEngine";
import { buildHitterRow, HrBoardRow } from "../intelligence/hrEdgeEngine";
import { clamp } from "../intelligence/scoring";

const LINEUP_SIZE = 9;

export interface MatchupTeam {
  teamId: number;
  name: string;
  abbreviation: string;
  logo: string;
  record: { wins: number; losses: number } | null;
  seasonWinPct: number;
  probablePitcher: { id: number; name: string; throws: string; vulnerability: number } | null;
}

export interface HrWatch {
  playerId: number;
  playerName: string;
  headshot: string;
  team: string;
  teamAbbr: string;
  hrEdge: number;
  grade: string;
  formTag: string;
  opposingPitcher: string;
  reason: string;
  impliedOdds: string;
}

export interface GameMatchup {
  gamePk: number;
  status: string;
  isLive: boolean;
  isFinal: boolean;
  gameTime: string;
  venue: string;
  away: MatchupTeam;
  home: MatchupTeam;
  score: { away: number; home: number };
  winProbability: { home: number; away: number };
  winProbModel: string[];
  runEnvironment: { score: number; tier: string; reasons: string[] } | null;
  topHrWatch: HrWatch[];
  keyFactors: string[];
  whatToWatch: string[];
  aiVerdict: string;
  dataQuality: DataQuality;
}

function teamLogo(teamId: number): string {
  return `https://www.mlbstatic.com/team-logos/${teamId}.svg`;
}

function seasonWinPct(team: NormalizedTeam): number {
  if (team.record && team.record.wins + team.record.losses > 0) {
    return team.record.wins / (team.record.wins + team.record.losses);
  }
  return 0.5;
}

/** log5: probability team A (winPct pA) beats team B (winPct pB) on a neutral field. */
function log5(pA: number, pB: number): number {
  const denom = pA + pB - 2 * pA * pB;
  if (denom === 0) return 0.5;
  return (pA - pA * pB) / denom;
}

function projectedLineup(hitters: NormalizedPlayer[], hitterStatsMap: Map<number, HitterStats>): NormalizedPlayer[] {
  return [...hitters]
    .sort((a, b) => {
      const sa = hitterStatsMap.get(a.playerId)?.season?.hrPerPA ?? 0;
      const sb = hitterStatsMap.get(b.playerId)?.season?.hrPerPA ?? 0;
      return sb - sa;
    })
    .slice(0, LINEUP_SIZE);
}

function toWatch(row: HrBoardRow): HrWatch {
  return {
    playerId: row.playerId,
    playerName: row.playerName,
    headshot: row.headshot,
    team: row.team,
    teamAbbr: row.team,
    hrEdge: row.hrEdge,
    grade: row.grade,
    formTag: row.formTag,
    opposingPitcher: row.opposingPitcher,
    reason: row.reasons[0] ?? "",
    impliedOdds: row.impliedOdds,
  };
}

function matchupTeam(
  team: NormalizedTeam,
  pitcher: NormalizedPitcher | null,
  opponent: string,
  venue: string,
  pitcherStats: PitcherSeasonStats | null
): MatchupTeam {
  return {
    teamId: team.teamId,
    name: team.name,
    abbreviation: team.abbreviation,
    logo: teamLogo(team.teamId),
    record: team.record ?? null,
    seasonWinPct: Math.round(seasonWinPct(team) * 1000) / 1000,
    probablePitcher: pitcher
      ? {
          id: pitcher.pitcherId,
          name: pitcher.pitcherName,
          throws: pitcher.throws,
          vulnerability: buildPitcherVulnerability(pitcher, opponent, venue, pitcherStats).vulnerabilityScore,
        }
      : null,
  };
}

function buildMatchup(
  game: NormalizedGame,
  hittersByTeam: Map<number, NormalizedPlayer[]>,
  hitterStatsMap: Map<number, HitterStats>,
  pitcherStatsMap: Map<number, PitcherSeasonStats | null>,
  runEnv?: RunEnvironment
): GameMatchup {
  const awayPStats = game.probablePitchers.away ? pitcherStatsMap.get(game.probablePitchers.away.pitcherId) ?? null : null;
  const homePStats = game.probablePitchers.home ? pitcherStatsMap.get(game.probablePitchers.home.pitcherId) ?? null : null;
  const away = matchupTeam(game.awayTeam, game.probablePitchers.away, game.homeTeam.name, game.venue, awayPStats);
  const home = matchupTeam(game.homeTeam, game.probablePitchers.home, game.awayTeam.name, game.venue, homePStats);
  const status = game.status;
  const isLive = /progress|live|in play|warmup/i.test(status);
  const isFinal = /final|game over/i.test(status);

  // ---- Win probability (log5 + home field + starting pitcher) ----
  const pHome = seasonWinPct(game.homeTeam);
  const pAway = seasonWinPct(game.awayTeam);
  let homeWin = log5(pHome, pAway) + 0.038; // ~MLB home-field edge
  const awayVuln = away.probablePitcher?.vulnerability ?? 55; // away SP faced by home bats
  const homeVuln = home.probablePitcher?.vulnerability ?? 55;
  const pitchAdj = ((awayVuln - homeVuln) / 100) * 0.12; // up to ~±12% swing
  homeWin = clamp(homeWin + pitchAdj, 0.15, 0.85);
  const homePct = Math.round(homeWin * 100);
  const winProbability = { home: homePct, away: 100 - homePct };

  const winProbModel = [
    `Season form: ${home.abbreviation} ${(pHome * 100).toFixed(0)}% · ${away.abbreviation} ${(pAway * 100).toFixed(0)}% (log5 base)`,
    `Home-field edge applied (+3.8% to ${home.abbreviation})`,
    away.probablePitcher && home.probablePitcher
      ? `Starting pitching: ${away.probablePitcher.name} vuln ${awayVuln} vs ${home.probablePitcher.name} vuln ${homeVuln}`
      : `Probable pitchers not fully set — pitching edge limited`,
  ];

  // ---- Real HR watch (actual lineup hitters facing each probable) ----
  // Track each row's batting team explicitly so the watch list always has team info.
  const watchRows: { row: HrBoardRow; teamName: string; teamAbbr: string }[] = [];
  const proj: "Live" | "Projected" = isLive ? "Live" : "Projected";
  if (game.probablePitchers.away) {
    projectedLineup(hittersByTeam.get(game.homeTeam.teamId) ?? [], hitterStatsMap).forEach((h, i) => {
      const hStats = hitterStatsMap.get(h.playerId);
      watchRows.push({ row: buildHitterRow(h, game.probablePitchers.away!, game, i + 1, proj, hStats, awayPStats), teamName: game.homeTeam.name, teamAbbr: game.homeTeam.abbreviation });
    });
  }
  if (game.probablePitchers.home) {
    projectedLineup(hittersByTeam.get(game.awayTeam.teamId) ?? [], hitterStatsMap).forEach((h, i) => {
      const hStats = hitterStatsMap.get(h.playerId);
      watchRows.push({ row: buildHitterRow(h, game.probablePitchers.home!, game, i + 1, proj, hStats, homePStats), teamName: game.awayTeam.name, teamAbbr: game.awayTeam.abbreviation });
    });
  }
  watchRows.sort((a, b) => b.row.hrEdge - a.row.hrEdge);
  const topHrWatch = watchRows.slice(0, 6).map(({ row, teamName, teamAbbr }) => ({ ...toWatch(row), team: teamName, teamAbbr }));

  // ---- Narrative factors ----
  const keyFactors: string[] = [];
  if (Math.abs(winProbability.home - winProbability.away) <= 12) keyFactors.push("Near coin-flip on the moneyline — small edges matter.");
  else keyFactors.push(`${winProbability.home > winProbability.away ? home.abbreviation : away.abbreviation} is the model side (${Math.max(winProbability.home, winProbability.away)}%).`);
  if (runEnv && runEnv.runEnvironmentScore >= 62) keyFactors.push(`Elevated run environment (${runEnv.tier}) — totals/HR angles in play.`);
  const mostVuln = Math.max(awayVuln, homeVuln);
  if (mostVuln >= 65) keyFactors.push(`${awayVuln >= homeVuln ? away.probablePitcher?.name : home.probablePitcher?.name} grades vulnerable (${mostVuln}/100).`);

  const whatToWatch: string[] = [];
  if (topHrWatch[0]) whatToWatch.push(`Top HR watch: ${topHrWatch[0].playerName} (${topHrWatch[0].team}) — ${topHrWatch[0].reason}`);
  if (topHrWatch[1]) whatToWatch.push(`Also live: ${topHrWatch[1].playerName} (grade ${topHrWatch[1].grade}).`);
  whatToWatch.push("Lineups, weather, and bullpen usage are projected placeholders — confirm before first pitch.");

  const aiVerdict = isFinal
    ? "Game is final — see the box for results."
    : `${Math.max(winProbability.home, winProbability.away)}% lean to ${winProbability.home >= winProbability.away ? home.abbreviation : away.abbreviation}. ${runEnv && runEnv.runEnvironmentScore >= 62 ? "Run environment favors overs/HR." : "Moderate run environment."} Probability-based research, not a guarantee.`;

  return {
    gamePk: game.gamePk,
    status,
    isLive,
    isFinal,
    gameTime: game.gameDate,
    venue: game.venue,
    away,
    home,
    score: game.score,
    winProbability,
    winProbModel,
    runEnvironment: runEnv ? { score: runEnv.runEnvironmentScore, tier: runEnv.tier, reasons: runEnv.reasons } : null,
    topHrWatch,
    keyFactors,
    whatToWatch,
    aiVerdict,
    dataQuality: watchRows.length > 0 ? "partial" : "limited",
  };
}

export async function getGameMatchups(date = todayISO()): Promise<GameMatchup[]> {
  return reportCache.getOrSet(`matchups_v2:${date}`, async () => {
    const games = await getScheduleByDate(date);
    const todayTeamIds = [...new Set(games.flatMap((g) => [g.awayTeam.teamId, g.homeTeam.teamId]))];
    console.log(`[matchupService] fetching hitters for ${todayTeamIds.length} teams in today's slate`);
    const hittersByTeam = await getActiveHittersByTeam(todayTeamIds);

    // Collect all pitcher and hitter IDs
    const pitcherIds = new Set<number>();
    const hitterIds = new Set<number>();
    for (const g of games) {
      if (g.probablePitchers.away?.pitcherId) pitcherIds.add(g.probablePitchers.away.pitcherId);
      if (g.probablePitchers.home?.pitcherId) pitcherIds.add(g.probablePitchers.home.pitcherId);
    }
    for (const [, players] of hittersByTeam) {
      for (const p of players) hitterIds.add(p.playerId);
    }

    // Fetch stats in parallel (concurrency-limited for hitters)
    const BATCH = 20;
    const hitterIdList = [...hitterIds];
    const hitterStatsList: HitterStats[] = [];
    for (let i = 0; i < hitterIdList.length; i += BATCH) {
      const batch = hitterIdList.slice(i, i + BATCH);
      const results = await Promise.allSettled(batch.map((id) => getHitterStats(id)));
      for (const r of results) { if (r.status === "fulfilled") hitterStatsList.push(r.value); }
    }
    const hitterStatsMap = new Map(hitterStatsList.map((s) => [s.playerId, s]));

    const pitcherResults = await Promise.allSettled([...pitcherIds].map(async (id) => ({ id, s: await getPitcherStats(id) })));
    const pitcherStatsMap = new Map<number, PitcherSeasonStats | null>();
    for (const r of pitcherResults) {
      if (r.status === "fulfilled") pitcherStatsMap.set(r.value.id, r.value.s.season);
    }

    const runEnvs = scoreRunEnvironment(games, pitcherStatsMap);
    const runByPk = new Map(runEnvs.map((r) => [r.gamePk, r]));

    return games.map((g) => buildMatchup(g, hittersByTeam, hitterStatsMap, pitcherStatsMap, runByPk.get(g.gamePk)));
  }, 4 * 60_000) as Promise<GameMatchup[]>;
}

export async function getGameMatchup(gamePk: number, date = todayISO()): Promise<GameMatchup | null> {
  const all = await getGameMatchups(date);
  return all.find((m) => m.gamePk === gamePk) ?? null;
}
