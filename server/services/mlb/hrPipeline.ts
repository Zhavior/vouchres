/**
 * HR Board Pipeline — Today Player Pool + Injury Verification + Scoring
 *
 * This is the validated, efficient, cached HR Board pipeline.
 * It replaces the old dailyHrBoardService.buildHrBoard() which fetched
 * 388 individual hitter stats and OOM-killed the server.
 *
 * Flow:
 *   1. Fetch today's schedule (1 API call, cached 5 min)
 *   2. Fetch rosters ONLY for today's teams (~20 calls, cached 20 min)
 *   3. Build Today Player Pool (top 13 playable hitters per team by batting order)
 *   4. Check injury status for each player (via roster status field)
 *   5. Fetch pitcher stats (26 calls, cached 15 min)
 *   6. Fetch hitter stats ONLY for pool players (~80 calls, cached 15 min)
 *   7. Validate each candidate via validateHrCandidate()
 *   8. Score only validated candidates
 *   9. Return ScoredHrCandidate[] with dataConfidence + status + warnings
 */

import { TTLCache } from "../../lib/cache";
import { getScheduleByDate, todayISO } from "./mlbClient";
import { getActiveHittersByTeam } from "./teamRosterClient";
import { getHitterStats, getPitcherStats, HitterStats, PitcherSeasonStats } from "./statsClient";
import { NormalizedGame } from "./mlbTypes";
import { clamp } from "../intelligence/scoring";
import { getParkFactor } from "./parkFactors";
import { validateHrCandidate, validateProjectedPreviewCandidate } from "./hrValidator";
import { MLB_PLAYER_RECORDS } from "../../../src/data/playerData";
import {
  TodayPlayer,
  TodayPlayerPool,
  ScoredHrCandidate,
  GameContext,
  HrDebugResponse,
  InjuryStatus,
  LineupStatus,
  isPlaceholder,
} from "./hrValidation";

/* ============ Caches (each has its own TTL) ============ */

const scheduleCache = new TTLCache<NormalizedGame[]>(5 * 60_000); // 5 min
const rosterCache = new TTLCache<Map<number, any[]>>(20 * 60_000); // 20 min
const pitcherStatsCache = new TTLCache<any>(15 * 60_000); // 15 min
const hitterStatsCache = new TTLCache<HitterStats>(15 * 60_000); // 15 min
const boxscoreLineupCache = new TTLCache<Map<number, number>>(2 * 60_000); // 2 min — official batting order
const boardCache = new TTLCache<any>(5 * 60_000); // 5 min — final scored board
const TEAM_MISMATCH_REASON = "Team mismatch / stale roster assignment";
const REGISTRY_CONFLICT_WARNING =
  "Trusted registry differs from MLB current roster. Using MLB active roster/currentTeam for preview.";
const curatedTeamByPlayerName = new Map(
  MLB_PLAYER_RECORDS.map((player) => [player.name.trim().toLowerCase(), player.team])
);
const legacyBadPairAuditTargets = [
  { playerName: "Pete Alonso", team: "BAL" },
  { playerName: "Willson Contreras", team: "BOS" },
  { playerName: "Bo Bichette", team: "NYM" },
  { playerName: "Alex Bregman", team: "CHC" },
  { playerName: "Brandon Lowe", team: "PIT" },
  { playerName: "Rhys Hoskins", team: "CLE" },
  { playerName: "Rob Refsnyder", team: "SEA" },
];
const badPairingKeySet = new Set(
  legacyBadPairAuditTargets.map((entry) => `${entry.playerName.toLowerCase()}|${entry.team}`)
);

/* ============ Types ============ */

interface PoolBuildResult {
  pool: TodayPlayer[];
  games: NormalizedGame[];
  gameContexts: GameContext[];
  debug: {
    gamesLoaded: number;
    teamsLoaded: number;
    rostersLoaded: number;
    probablePitchersLoaded: number;
    totalPlayersChecked: number;
    previewPoolBeforeRegistryFilter?: number;
    previewPoolAfterSafetyFilter?: number;
    confirmedLineupsLoaded?: number;
    projectedLineupsLoaded?: number;
    teamMismatchBlocked?: number;
    teamMismatchExamples?: Array<{
      playerName: string;
      playerId: number;
      team: string;
      teamId: number;
      sourceTeamId?: number | null;
      playerCurrentTeamId?: number | null;
      expectedTeamAbbrev?: string;
      reason: string;
    }>;
  };
}

/* ============ Injury status from roster data ============ */

function extractInjuryStatus(rosterEntry: any): {
  status: InjuryStatus;
  description?: string;
  source?: string;
} {
  // The MLB Stats API roster endpoint returns a "status" field on each player
  // Common values: "Active", "10-day IL", "15-day IL", "60-day IL", "Bereavement", "Paternity", etc.
  const status = (rosterEntry?.status?.code || rosterEntry?.status?.description || "Active").toString();

  if (/IL|injured/i.test(status)) {
    return { status: "injured_list", description: status, source: "MLB roster API" };
  }
  if (/scratch/i.test(status)) {
    return { status: "scratched", description: status, source: "MLB roster API" };
  }
  if (/day.to.day|dtd/i.test(status)) {
    return { status: "day_to_day", description: status, source: "MLB roster API" };
  }
  if (/questionable|probable|doubtful/i.test(status)) {
    return { status: "questionable", description: status, source: "MLB roster API" };
  }
  if (/active/i.test(status)) {
    return { status: "healthy", source: "MLB roster API" };
  }

  return { status: "unknown", description: status, source: "MLB roster API" };
}

async function buildOfficialBattingOrderMap(games: NormalizedGame[]): Promise<Map<number, number>> {
  return await boxscoreLineupCache.getOrSet(
    `boxscore-lineups:${games.map((g) => g.gamePk).join(",")}`,
    async () => {
      const battingOrderByPlayerId = new Map<number, number>();

      await Promise.all(
        games.map(async (game) => {
          if (!game.gamePk) return;

          try {
            const res = await fetch(`https://statsapi.mlb.com/api/v1/game/${game.gamePk}/boxscore`);
            if (!res.ok) return;

            const boxscore = await res.json();
            const teams = [boxscore?.teams?.away, boxscore?.teams?.home];

            for (const team of teams) {
              const batters = Array.isArray(team?.batters) ? team.batters : [];

              batters.forEach((playerId: number, index: number) => {
                if (typeof playerId === "number") {
                  battingOrderByPlayerId.set(playerId, index + 1);
                }
              });
            }
          } catch {
            // Boxscores are often unavailable before lineups are posted.
            // Keep the board projected instead of failing the HR pipeline.
          }
        })
      );

      return battingOrderByPlayerId;
    }
  );
}

/* ============ Build Today Player Pool ============ */

async function buildTodayPlayerPool(date: string): Promise<PoolBuildResult> {
  // STEP 1: Fetch schedule (cached 5 min)
  const games = await scheduleCache.getOrSet(`schedule:${date}`, async () => {
    return await getScheduleByDate(date);
  });

  if (games.length === 0) {
      return {
        pool: [],
        games: [],
        gameContexts: [],
        debug: {
          gamesLoaded: 0,
          teamsLoaded: 0,
          rostersLoaded: 0,
          probablePitchersLoaded: 0,
          totalPlayersChecked: 0,
          previewPoolBeforeRegistryFilter: 0,
          previewPoolAfterSafetyFilter: 0,
          teamMismatchBlocked: 0,
          teamMismatchExamples: [],
        },
      };
  }

  // STEP 2: Extract team IDs from today's games
  const todayTeamIds = new Set<number>();
  for (const g of games) {
    if (g.awayTeam?.teamId) todayTeamIds.add(g.awayTeam.teamId);
    if (g.homeTeam?.teamId) todayTeamIds.add(g.homeTeam.teamId);
  }
  const teamIdList = [...todayTeamIds];

  // STEP 3: Fetch rosters ONLY for today's teams (cached 20 min per team-set)
  const hittersByTeam = await getActiveHittersByTeam(teamIdList);

  // STEP 4: Build game contexts for validation
  const gameContexts: GameContext[] = games.map((g) => ({
    gamePk: g.gamePk,
    gameDate: g.gameDate,
    awayTeamId: g.awayTeam?.teamId ?? 0,
    homeTeamId: g.homeTeam?.teamId ?? 0,
    awayTeamAbbrev: g.awayTeam?.abbreviation ?? "???",
    homeTeamAbbrev: g.homeTeam?.abbreviation ?? "???",
    venueName:
      (g as any).venueName ??
      (g as any).venue?.name ??
      (g as any).venue ??
      "Unknown venue",
    probablePitchers: {
      away: g.probablePitchers.away
        ? { pitcherId: g.probablePitchers.away.pitcherId, pitcherName: g.probablePitchers.away.pitcherName, teamId: g.probablePitchers.away.teamId, throws: g.probablePitchers.away.throws }
        : null,
      home: g.probablePitchers.home
        ? { pitcherId: g.probablePitchers.home.pitcherId, pitcherName: g.probablePitchers.home.pitcherName, teamId: g.probablePitchers.home.teamId, throws: g.probablePitchers.home.throws }
        : null,
    },
    status: g.status,
  }));

  // STEP 4.5: Fetch official batting orders from MLB boxscores when available.
  // If lineups are not posted yet, this map stays empty and the board remains projected.
  const officialBattingOrderByPlayerId = await buildOfficialBattingOrderMap(games);

  // STEP 5: Build player pool (top 13 playable power hitters per team by batting order)
  const MAX_HITTERS_PER_TEAM = 13;
  const pool: TodayPlayer[] = [];
  let totalPlayersChecked = 0;
  let previewPoolBeforeRegistryFilter = 0;
  let previewPoolAfterSafetyFilter = 0;
  let teamMismatchBlocked = 0;
  const teamMismatchExamples: NonNullable<PoolBuildResult["debug"]["teamMismatchExamples"]> = [];

  for (const game of games) {
    for (const teamSide of ["away", "home"] as const) {
      const team = teamSide === "away" ? game.awayTeam : game.homeTeam;
      const opponentTeam = teamSide === "away" ? game.homeTeam : game.awayTeam;
      if (!team?.teamId) continue;

      const players = hittersByTeam.get(team.teamId) || [];
      totalPlayersChecked += players.length;
      previewPoolBeforeRegistryFilter += players.length;

      const eliteHrNames = new Set([
        "Aaron Judge",
        "Shohei Ohtani",
        "Juan Soto",
        "Vladimir Guerrero Jr.",
        "Kyle Schwarber",
        "Pete Alonso",
        "Cal Raleigh",
        "Byron Buxton",
        "Fernando Tatis Jr.",
        "Corey Seager",
        "Yordan Alvarez",
        "Matt Olson",
        "Rafael Devers",
        "Mookie Betts",
        "Freddie Freeman",
        "Jose Ramirez",
        "Bryce Harper",
      ]);

      const hitterPowerScore = (p: any) => {
        const nameBoost = eliteHrNames.has(p.playerName) ? 10000 : 0;
        const confirmedLineupBoost = p.battingOrder ? 5000 - p.battingOrder * 100 : 0;
        const hr = Number(p.homeRuns ?? p.hr ?? p.seasonHomeRuns ?? p.stats?.homeRuns ?? 0);
        const slg = Number(p.slg ?? p.slugging ?? p.stats?.slg ?? 0);
        const iso = Number(p.iso ?? p.stats?.iso ?? 0);
        const batsKnown = p.bats ? 10 : 0;

        return nameBoost + confirmedLineupBoost + hr * 120 + slg * 100 + iso * 200 + batsKnown;
      };

      const eligiblePlayers = players.filter((p: any) => {
        const currentTeamId = p.playerCurrentTeamId == null ? null : Number(p.playerCurrentTeamId);
        const rosterTeamId = Number(p.activeRosterTeamId ?? p.teamId);
        const ok =
          p.teamId === team.teamId &&
          rosterTeamId === team.teamId &&
          (currentTeamId === null || currentTeamId === team.teamId);

        if (!ok) {
          teamMismatchBlocked++;
          if (teamMismatchExamples.length < 25) {
            teamMismatchExamples.push({
              playerName: p.playerName,
              playerId: p.playerId,
              team: p.teamAbbrev ?? p.team ?? "unknown",
              teamId: p.teamId,
              sourceTeamId: p.sourceTeamId ?? null,
              playerCurrentTeamId: currentTeamId,
              expectedTeamAbbrev: team.abbreviation ?? "",
              reason: TEAM_MISMATCH_REASON,
            });
          }
        }

        return ok;
      });
      previewPoolAfterSafetyFilter += eligiblePlayers.length;

      const topHitters = eligiblePlayers
        .sort((a, b) => hitterPowerScore(b) - hitterPowerScore(a))
        .slice(0, MAX_HITTERS_PER_TEAM);

      for (const p of topHitters) {
        // Extract injury status from the roster data
        const injury = extractInjuryStatus(p);
        const officialBattingOrder = officialBattingOrderByPlayerId.get(p.playerId) ?? null;

        const player: TodayPlayer = {
          playerId: p.playerId,
          playerName: p.playerName,
          teamId: p.teamId,
          teamAbbrev: p.teamAbbrev ?? team.abbreviation ?? "???",
          sourceTeamName: p.team ?? team.name ?? "Unknown Team",
          sourceTeamId: p.sourceTeamId ?? p.activeRosterTeamId ?? team.teamId,
          sourceTeamAbbrev: p.sourceTeamAbbrev ?? p.teamAbbrev ?? team.abbreviation ?? "???",
          playerCurrentTeamId: p.playerCurrentTeamId ?? null,
          playerCurrentTeamAbbrev: p.playerCurrentTeamAbbrev ?? null,
          activeRosterTeamId: p.activeRosterTeamId ?? team.teamId,
          opponentTeamId: opponentTeam?.teamId ?? 0,
          gamePk: game.gamePk,
          gameDate: game.gameDate,
          homeOrAway: teamSide,
          battingHand: p.bats,
          lineupStatus: officialBattingOrder ? "confirmed" : "projected",
          battingOrder: officialBattingOrder ?? p.battingOrder,
          activeRosterStatus: true,
          injuryStatus: injury.status,
          injuryDescription: injury.description,
          injurySource: injury.source,
          lastUpdated: new Date().toISOString(),
          dataSource: "MLB Stats API",
        };

        pool.push(player);
      }
    }
  }

  return {
    pool,
    games,
    gameContexts,
    debug: {
      gamesLoaded: games.length,
      teamsLoaded: teamIdList.length,
      rostersLoaded: hittersByTeam.size,
      probablePitchersLoaded: games.filter((g) => g.probablePitchers.away || g.probablePitchers.home).length,
      totalPlayersChecked,
      previewPoolBeforeRegistryFilter,
      previewPoolAfterSafetyFilter,
      confirmedLineupsLoaded: officialBattingOrderByPlayerId.size,
      projectedLineupsLoaded: Math.max(0, pool.length - officialBattingOrderByPlayerId.size),
      teamMismatchBlocked,
      teamMismatchExamples,
    },
  };
}

/* ============ Score validated candidates ============ */

function scoreCandidate(
  player: TodayPlayer,
  hitterStats: HitterStats | null,
  pitcherStats: PitcherSeasonStats | null,
  game: GameContext,
  status: "confirmed" | "projected" | "warning"
): ScoredHrCandidate {
  const isHome = player.teamId === game.homeTeamId;
  const pitcher = isHome ? game.probablePitchers.away : game.probablePitchers.home;
  const penaltyReasons: string[] = [];

  let hrScore = 22;
  let seasonHR = 0;
  let plateAppearances = 0;
  let atBats = 0;
  let slug = 0;
  let avg = 0;
  let iso = 0;
  let recentHr = 0;
  let recentHrGames = 0;
  let smallSamplePenalty = 0;
  let hrRate = 0; // HR per plate appearance (function-scoped for the hitterPower calc)

  // Hitter power component — this should dominate over generic environment boosts.
  if (hitterStats?.season) {
    const s = hitterStats.season;
    const hrPerPA = s.hrPerPA || 0;
    hrRate = hrPerPA;
    seasonHR = s.homeRuns || 0;
    plateAppearances = s.plateAppearances || 0;
    atBats = s.atBats || 0;
    slug = s.slg || 0;
    avg = s.avg || 0;
    iso = Math.max(0, slug - avg);
    recentHr = (hitterStats.recentGames ?? []).reduce((sum, game) => sum + (game.homeRuns || 0), 0);
    recentHrGames = (hitterStats.recentGames ?? []).filter((game) => (game.homeRuns || 0) > 0).length;

    const rateSampleFactor =
      plateAppearances >= 220 ? 1 :
      plateAppearances >= 140 ? 0.85 :
      plateAppearances >= 90 ? 0.65 :
      plateAppearances >= 60 ? 0.5 :
      0.35;

    hrScore += clamp(hrPerPA * 420 * rateSampleFactor, 0, 22);
    hrScore += clamp((iso - 0.12) * 75 * rateSampleFactor, 0, 14);
    hrScore += clamp((slug - 0.39) * 28 * rateSampleFactor, 0, 6);
    hrScore += clamp(seasonHR * 0.52, 0, 18);
    hrScore += clamp(recentHr * 3.5, 0, 12);
    hrScore += clamp(recentHrGames * 1.1, 0, 5);

    if (plateAppearances < 120 || atBats < 90) {
      smallSamplePenalty =
        plateAppearances < 40 || atBats < 30 ? 12 :
        plateAppearances < 60 || atBats < 45 ? 9 :
        plateAppearances < 90 || atBats < 70 ? 6 :
        3;
      hrScore -= smallSamplePenalty;
      penaltyReasons.push("Small sample power penalty");
    }
  }

  // Pitcher vulnerability component.
  const pitcherHr9 = pitcherStats?.homeRunsPer9 || 0;
  let pitcherBoostScale = 1;
  const strongRecentPowerSignal = recentHr >= 2 || recentHrGames >= 2;
  const enoughSlugSample = plateAppearances >= 120 || atBats >= 90;

  if (seasonHR >= 15 || iso >= 0.22 || strongRecentPowerSignal) {
    pitcherBoostScale = 1;
  } else if (seasonHR >= 8 || iso >= 0.18) {
    pitcherBoostScale = 0.78;
  } else if (seasonHR >= 4 || recentHr >= 1) {
    pitcherBoostScale = 0.48;
  } else {
    pitcherBoostScale = 0.2;
  }

  if (pitcherStats) {
    const hr9 = pitcherHr9 || 1.1;
    const kPer9 = pitcherStats.inningsPitched > 0 ? (pitcherStats.strikeOuts / pitcherStats.inningsPitched) * 9 : 0;
    const bbPer9 = pitcherStats.inningsPitched > 0 ? (pitcherStats.baseOnBalls / pitcherStats.inningsPitched) * 9 : 0;
    const pitcherBoost =
      clamp((hr9 - 1.0) * 18, -6, 18) +
      clamp((3.1 - kPer9) * 2.1, -4, 6) +
      clamp((bbPer9 - 2.4) * 1.3, 0, 4);
    hrScore += pitcherBoost * pitcherBoostScale;
    if (pitcherBoostScale < 0.7 && pitcherBoost > 0) {
      penaltyReasons.push("Pitcher boost capped due to limited hitter power");
    }
  }

  // Simple handedness edge when available.
  if (pitcher?.throws) {
    if (player.battingHand === "S") {
      hrScore += 2;
    } else if (
      (player.battingHand === "L" && pitcher.throws === "R") ||
      (player.battingHand === "R" && pitcher.throws === "L")
    ) {
      hrScore += 3;
    } else if (
      (player.battingHand === "L" && pitcher.throws === "L") ||
      (player.battingHand === "R" && pitcher.throws === "R")
    ) {
      hrScore -= 1;
    }
  }

  // Park factor
  const venueName = (game as any).venueName ?? "Unknown venue";
  const park = getParkFactor(venueName);
  const parkFactor = Number((park as any).factor ?? (park as any).hrFactor ?? 100);
  const hrMultiplier = Number((parkFactor / 100).toFixed(2));
  const parkBoost = clamp((parkFactor - 100) * 0.35, -6, 8);
  hrScore += parkBoost;

  // Injury confidence adjustment
  if (player.injuryStatus === "day_to_day" || player.injuryStatus === "questionable") {
    hrScore -= 8;
  }

  // Lineup confidence adjustment — meaningful only if confirmed.
  if (player.lineupStatus === "confirmed") {
    if (typeof player.battingOrder === "number") {
      if (player.battingOrder <= 3) hrScore += 4;
      else if (player.battingOrder <= 5) hrScore += 2;
    }
  } else {
    hrScore -= 2;
  }

  const powerFloorChecks = [
    seasonHR >= 8,
    iso >= 0.18,
    slug >= 0.43 && enoughSlugSample,
    strongRecentPowerSignal,
    pitcherHr9 >= 1.2,
  ].filter(Boolean).length;

  if (powerFloorChecks < 2 && hrScore > 64) {
    hrScore = 64;
  }

  if (seasonHR <= 3 && !strongRecentPowerSignal) {
    if (hrScore > 59) hrScore = 59;
    penaltyReasons.push("Low season HR floor");
  }

  hrScore = clamp(Math.round(hrScore), 1, 100);

  const hitterPower = clamp(
    (hrRate * 1000 * 1.8) +
    (iso * 120) +
    (slug * 35) +
    (seasonHR * 1.2) +
    (recentHr * 5),
    0,
    100
  );

  const pitcherVulnerability = clamp(
    ((pitcherHr9 || 1.0) * 34) +
    ((pitcherStats?.inningsPitched ?? 0) > 0
      ? (((pitcherStats?.baseOnBalls ?? 0) / (pitcherStats?.inningsPitched ?? 1)) * 9) * 3
      : 0),
    0,
    100
  );

  const parkContext = clamp(50 + parkBoost * 6, 0, 100);

  const lineupVolume = player.lineupStatus === "confirmed"
    ? clamp(80 - ((player.battingOrder ?? 6) - 1) * 7, 35, 90)
    : 55;

  const handednessEdge =
    player.battingHand === "S" ? 65 :
    pitcher?.throws && (
      (player.battingHand === "L" && pitcher.throws === "R") ||
      (player.battingHand === "R" && pitcher.throws === "L")
    ) ? 70 :
    pitcher?.throws ? 45 : 50;

  const recentForm = clamp(45 + recentHr * 14 + recentHrGames * 8, 0, 100);

  const penalties = clamp(
    smallSamplePenalty +
    (player.lineupStatus !== "confirmed" ? 7 : 0) +
    (player.injuryStatus === "day_to_day" || player.injuryStatus === "questionable" ? 15 : 0) +
    (player.injuryStatus === "unknown" ? 5 : 0),
    0,
    100
  );

  const scoreBreakdown = {
    hitterPower: Math.round(hitterPower),
    pitcherVulnerability: Math.round(pitcherVulnerability),
    parkContext: Math.round(parkContext),
    lineupVolume: Math.round(lineupVolume),
    handednessEdge: Math.round(handednessEdge),
    recentForm: Math.round(recentForm),
    penalties: Math.round(penalties),
  };

  const baseHrProbability = plateAppearances > 0
    ? (seasonHR / plateAppearances) * 4.25
    : 0.018;

  const estimatedHrProbability = Number(clamp(
    baseHrProbability *
      (0.75 + hitterPower / 160) *
      (0.85 + pitcherVulnerability / 250) *
      hrMultiplier *
      (0.9 + lineupVolume / 500) *
      (1 - penalties / 500),
    0.003,
    0.14
  ).toFixed(4));

  const confidenceTier =
    hrScore >= 82 ? "elite" :
    hrScore >= 68 ? "strong" :
    hrScore >= 53 ? "watchlist" :
    hrScore >= 38 ? "thin" : "avoid";

  // Risk tier
  let riskTier: "Strong" | "Playable" | "Sneaky" | "Longshot" | "Lotto" | "Avoid" =
    hrScore >= 80 ? "Strong" :
    hrScore >= 65 ? "Playable" :
    hrScore >= 50 ? "Sneaky" :
    hrScore >= 38 ? "Longshot" : "Avoid";

  if (seasonHR <= 3 && !strongRecentPowerSignal && ["Strong", "Playable", "Sneaky"].includes(riskTier)) {
    riskTier = "Longshot";
  }

  // Data confidence
  let dataConfidence = 50;
  if (player.lineupStatus === "confirmed") dataConfidence += 15;
  if (pitcher?.pitcherName && !isPlaceholder(pitcher.pitcherName)) dataConfidence += 15;
  if (player.injuryStatus === "healthy") dataConfidence += 10;
  if (hitterStats?.season) dataConfidence += 10;
  if (pitcherStats) dataConfidence += 10;
  if (player.injuryStatus === "unknown") dataConfidence -= 10;
  if (player.lineupStatus !== "confirmed") dataConfidence -= 5;
  if (smallSamplePenalty > 0) dataConfidence -= Math.min(12, smallSamplePenalty);
  dataConfidence = clamp(dataConfidence, 0, 100);

  // Reasons
  const reasons: string[] = [];
  if (hitterStats?.season) {
    reasons.push(`${hitterStats.season.homeRuns} HR this season, .${(hitterStats.season.slg * 1000).toFixed(0).padStart(3, "0")} SLG`);
  }
  if (pitcherStats) {
    reasons.push(`${pitcher?.pitcherName} HR/9 = ${pitcherStats.homeRunsPer9.toFixed(2)}`);
  }
  if (player.lineupStatus === "confirmed") {
    reasons.push(`Confirmed in lineup${player.battingOrder ? ` (#${player.battingOrder})` : ""}`);
  }
  reasons.push(...Array.from(new Set(penaltyReasons)));

  // Warnings
  const warnings: string[] = [];
  if (player.injuryStatus === "day_to_day") warnings.push("Player is day-to-day. Confidence reduced.");
  if (player.injuryStatus === "questionable") warnings.push("Player is questionable. Confidence reduced.");
  if (player.injuryStatus === "unknown") warnings.push("Injury status unknown.");
  if (player.lineupStatus !== "confirmed") warnings.push("Lineup not confirmed yet.");
  if (!hitterStats?.recentGames?.length) warnings.push("No recent game logs available.");
  if (!pitcherStats) warnings.push("Pitcher stats unavailable.");

  return {
    playerId: player.playerId,
    playerName: player.playerName,
    team: player.teamAbbrev,
    teamId: player.teamId,
    teamAbbrev: player.teamAbbrev,
    opponent: isHome ? game.awayTeamAbbrev : game.homeTeamAbbrev,
    opponentTeamId: player.opponentTeamId,
    gamePk: player.gamePk,
    opponentPitcherName: pitcher?.pitcherName ?? "TBD",
    opponentPitcher: pitcher?.pitcherName ?? "TBD",
    opponentPitcherId: pitcher?.pitcherId ?? 0,
    venue: venueName,
    parkFactor,
    parkSource: (park as any).source ?? "park_factor_table",
    hrMultiplier,
    weatherBoost: 0,
    weatherSource: "unavailable",
    lineupStatus: player.lineupStatus as LineupStatus,
    battingOrder: player.battingOrder ?? null,
    injuryStatus: player.injuryStatus,
    hrScore,
    estimatedHrProbability,
    confidenceTier,
    dataConfidence,
    scoreBreakdown,
    riskTier,
    status,
    reasons,
    warnings,
    dataQuality: dataConfidence >= 70 ? "partial" : "limited",
    lastUpdated: new Date().toISOString(),
    dataSource: "MLB Stats API + validated pipeline",
  };
}

/* ============ Main pipeline — buildValidatedHrBoard ============ */

export async function buildValidatedHrBoard(date = todayISO()): Promise<{
  date: string;
  gameCount: number;
  candidates: ScoredHrCandidate[];
  projectedCandidates: ScoredHrCandidate[];
  pool: TodayPlayerPool;
  debug: HrDebugResponse;
}> {
  return boardCache.getOrSet(`validated_hr:v3_registry_conflict_preview:${date}`, async () => {
    const startTime = Date.now();

    // STEP 1: Build player pool
    const { pool, games, gameContexts, debug: poolDebug } = await buildTodayPlayerPool(date);

    if (pool.length === 0) {
      return {
        date,
        gameCount: 0,
        candidates: [],
        projectedCandidates: [],
        pool: {
          date,
          totalPlayersChecked: 0,
          confirmedStarters: 0,
          projectedStarters: 0,
          benchOrUnknown: 0,
          injuredScratchedBlocked: 0,
          hrCandidatesScored: 0,
          players: [],
          lastRefresh: new Date().toISOString(),
          dataSource: "MLB Stats API",
        },
        debug: {
          date,
          gamesLoaded: 0,
          teamsLoaded: 0,
          rostersLoaded: 0,
          injuryReportsLoaded: 0,
          probablePitchersLoaded: 0,
          confirmedLineupsLoaded: 0,
          projectedLineupsLoaded: 0,
          totalPlayersChecked: 0,
          todayPlayerPoolCount: 0,
          candidatesValidated: 0,
          candidatesScored: 0,
          candidatesBlocked: 0,
          projectedPreviewCount: 0,
          eligiblePreviewPoolCount: 0,
          scoredPreviewPoolCount: 0,
          previewPoolBeforeRegistryFilter: 0,
          previewPoolAfterSafetyFilter: 0,
          blockedReasons: {},
          staleDataWarnings: [],
          placeholderWarnings: [],
          teamMismatchBlocked: 0,
          trueTeamMismatchBlocked: 0,
          registryConflictWarnings: 0,
          registryConflictCount: 0,
          registryConflictExamples: [],
          legacyBadPairAudit: [],
          badPairingAuditBlocked: [],
          teamMismatchExamples: [],
          lastRefresh: new Date().toISOString(),
        },
      };
    }

    // STEP 2: Fetch pitcher stats (only probable pitchers — ~26 calls)
    const pitcherIds = new Set<number>();
    for (const g of gameContexts) {
      if (g.probablePitchers.away?.pitcherId) pitcherIds.add(g.probablePitchers.away.pitcherId);
      if (g.probablePitchers.home?.pitcherId) pitcherIds.add(g.probablePitchers.home.pitcherId);
    }

    const pitcherStatsMap = new Map<number, PitcherSeasonStats | null>();
    const pitcherResults = await Promise.allSettled(
      [...pitcherIds].map(async (id) => {
        const fullStats = await pitcherStatsCache.getOrSet(`pitcher:${id}`, () => getPitcherStats(id));
        return { id, season: fullStats.season };
      })
    );
    for (const r of pitcherResults) {
      if (r.status === "fulfilled") pitcherStatsMap.set(r.value.id, r.value.season);
    }

    // STEP 3: Fetch hitter stats ONLY for pool players (~80 calls, not 388)
    const hitterStatsMap = new Map<number, HitterStats>();
    const CONCURRENCY = 10;
    const poolPlayerIds = [...new Set(pool.map((p) => p.playerId))];

    for (let i = 0; i < poolPlayerIds.length; i += CONCURRENCY) {
      const batch = poolPlayerIds.slice(i, i + CONCURRENCY);
      const results = await Promise.allSettled(
        batch.map(async (id) => {
          const stats = await hitterStatsCache.getOrSet(`hitter:${id}`, () => getHitterStats(id));
          return { id, stats };
        })
      );
      for (const r of results) {
        if (r.status === "fulfilled") hitterStatsMap.set(r.value.id, r.value.stats);
      }
    }

    // STEP 4: Validate + score each candidate
    const seenPlayerIds = new Set<number>();
    const seenProjectedPreviewIds = new Set<number>();
    const candidates: ScoredHrCandidate[] = [];
    const projectedCandidates: ScoredHrCandidate[] = [];
    const scoredPreviewCandidates: ScoredHrCandidate[] = [];
    const missingStarChecks: Array<{
      playerName: string;
      expectedTeam: string;
      status: string;
      label?: string;
      reason: string;
      note?: string;
    }> = [];

    const blockedReasons: Record<string, number> = {};
    let validationTeamMismatchBlocked = 0;
    const validationTeamMismatchExamples: NonNullable<HrDebugResponse["teamMismatchExamples"]> = [];
    let registryConflictCount = 0;
    const registryConflictExamples: NonNullable<HrDebugResponse["registryConflictExamples"]> = [];
    const badPairingAuditBlocked: NonNullable<HrDebugResponse["badPairingAuditBlocked"]> = [];
    const blockedPlayers: Array<{
      playerName: string;
      playerId: number;
      team: string;
      opponent: string;
      reason: string;
      reasons: string[];
      opponentPitcher: string | null;
      gamePk: number;
      lineupStatus: string;
      injuryStatus: string;
    }> = [];
    let candidatesValidated = 0;
    let candidatesBlocked = 0;
    let eligiblePreviewPoolCount = 0;
    let scoredPreviewPoolCount = 0;
    let projectedPreviewCount = 0;
    const placeholderWarnings: string[] = [];
    const staleDataWarnings: string[] = [];

    for (const player of pool) {
      const game = gameContexts.find((g) => g.gamePk === player.gamePk);
      if (!game) continue;

      const hitterStats = hitterStatsMap.get(player.playerId) ?? null;
      const isHome = player.teamId === game.homeTeamId;
      const pitcher = isHome ? game.probablePitchers.away : game.probablePitchers.home;
      const pitcherStats = pitcher ? (pitcherStatsMap.get(pitcher.pitcherId) ?? null) : null;
      const hasHitterStats = !!hitterStats?.season;
      const hasPitcherStats = !!pitcherStats;

      // Confirmed mode validation
      const validation = validateHrCandidate(
        player,
        game,
        player.injuryStatus,
        hasHitterStats,
        hasPitcherStats,
        seenPlayerIds
      );

      candidatesValidated++;

      if (validation.valid) {
        // Mark as seen (prevent duplicates in confirmed candidates)
        seenPlayerIds.add(player.playerId);

        // Score only validated confirmed candidates
        const scored = scoreCandidate(player, hitterStats, pitcherStats, game, validation.status as any);
        candidates.push(scored);
        continue;
      }

      // Preview mode for lineup-unconfirmed but roster/currentTeam safe players.
      if (player.lineupStatus !== "confirmed") {
        let previewValidation = validateProjectedPreviewCandidate(
          player,
          game,
          player.injuryStatus,
          hasHitterStats,
          hasPitcherStats,
          seenProjectedPreviewIds
        );

        const curatedTeam = curatedTeamByPlayerName.get(player.playerName.trim().toLowerCase());
        const registryConflict =
          Boolean(curatedTeam) &&
          curatedTeam!.trim().toLowerCase() !== player.sourceTeamName.trim().toLowerCase();

        if (previewValidation.valid) {
          eligiblePreviewPoolCount++;
          seenProjectedPreviewIds.add(player.playerId);
          const previewScored = scoreCandidate(player, hitterStats, pitcherStats, game, "projected");
          const previewWarnings = [
            "Official lineup not posted yet. Do not treat as confirmed.",
            ...previewScored.warnings.filter((warning) => !warning.startsWith("Lineup not confirmed yet")),
            ...previewValidation.warnings.filter((warning) => !warning.startsWith("Lineup not confirmed yet")),
          ];

          let previewConfidence = previewScored.dataConfidence;
          if (registryConflict) {
            registryConflictCount++;
            previewConfidence = clamp(previewScored.dataConfidence - 15, 0, 100);
            previewWarnings.push(REGISTRY_CONFLICT_WARNING);
            if (registryConflictExamples.length < 25) {
              registryConflictExamples.push({
                playerName: player.playerName,
                playerId: player.playerId,
                mlbTeam: player.sourceTeamName,
                trustedRegistryTeam: curatedTeam!,
              });
            }
          }

          const previewCandidate: ScoredHrCandidate = {
            ...previewScored,
            lineupStatus: "projected_unconfirmed" as LineupStatus,
            dataConfidence: previewConfidence,
            registryConflict,
            dataQuality: "projection_preview" as const,
            warnings: Array.from(new Set(previewWarnings)),
          };

          const previewKey = `${previewCandidate.playerName.toLowerCase()}|${previewCandidate.team}`;
          const hasPitcherContext =
            !!previewCandidate.opponentPitcherId ||
            (!!previewCandidate.opponentPitcherName &&
              !isPlaceholder(previewCandidate.opponentPitcherName) &&
              previewCandidate.opponentPitcherName !== "TBD");
          const hasRequiredPreviewShape =
            !!previewCandidate.playerId &&
            !isPlaceholder(previewCandidate.playerName) &&
            !!previewCandidate.team &&
            !!previewCandidate.teamId &&
            !!previewCandidate.opponent &&
            !!previewCandidate.opponentTeamId &&
            !!previewCandidate.gamePk &&
            hasPitcherContext &&
            !!hitterStats?.season &&
            Number.isFinite(previewCandidate.hrScore);

          if (badPairingKeySet.has(previewKey)) {
            badPairingAuditBlocked.push({
              playerName: previewCandidate.playerName,
              team: previewCandidate.team,
              reason: "Known bad pairing blocked from ranked preview board.",
            });
          } else if (hasRequiredPreviewShape) {
            scoredPreviewCandidates.push(previewCandidate);
            scoredPreviewPoolCount++;
          } else {
            staleDataWarnings.push(
              `${previewCandidate.playerName}: preview candidate removed from ranked board due to missing hitter/pitcher/game context.`
            );
          }
          continue;
        }

        candidatesBlocked++;
        const reason = previewValidation.reasons[0] || "unknown";
        blockedReasons[reason] = (blockedReasons[reason] || 0) + 1;
        if (reason === TEAM_MISMATCH_REASON) {
          validationTeamMismatchBlocked++;
          if (validationTeamMismatchExamples.length < 25) {
            validationTeamMismatchExamples.push({
              playerName: player.playerName,
              playerId: player.playerId,
              team: player.teamAbbrev,
              teamId: player.teamId,
              sourceTeamId: player.sourceTeamId,
              playerCurrentTeamId: player.playerCurrentTeamId ?? null,
              expectedTeamAbbrev: player.teamId === game.homeTeamId ? game.homeTeamAbbrev : game.awayTeamAbbrev,
              reason,
            });
          }
        }

        blockedPlayers.push({
          playerName: player.playerName,
          playerId: player.playerId,
          team: player.teamAbbrev,
          opponent: player.teamId === game.homeTeamId ? game.awayTeamAbbrev : game.homeTeamAbbrev,
          reason,
          reasons: previewValidation.reasons,
          opponentPitcher: pitcher?.pitcherName ?? null,
          gamePk: player.gamePk,
          lineupStatus: player.lineupStatus as LineupStatus,
          injuryStatus: player.injuryStatus ?? "unknown",
        });

        if (previewValidation.reasons.some((r) => /placeholder/i.test(r))) {
          placeholderWarnings.push(`${player.playerName}: ${previewValidation.reasons[0]}`);
        }
        continue;
      }

      {
        candidatesBlocked++;
        const reason = validation.reasons[0] || "unknown";
        blockedReasons[reason] = (blockedReasons[reason] || 0) + 1;
        if (reason === TEAM_MISMATCH_REASON) {
          validationTeamMismatchBlocked++;
          if (validationTeamMismatchExamples.length < 25) {
            validationTeamMismatchExamples.push({
              playerName: player.playerName,
              playerId: player.playerId,
              team: player.teamAbbrev,
              teamId: player.teamId,
              sourceTeamId: player.sourceTeamId,
              playerCurrentTeamId: player.playerCurrentTeamId ?? null,
              expectedTeamAbbrev: player.teamId === game.homeTeamId ? game.homeTeamAbbrev : game.awayTeamAbbrev,
              reason,
            });
          }
        }

        blockedPlayers.push({
          playerName: player.playerName,
          playerId: player.playerId,
          team: player.teamAbbrev,
          opponent: player.teamId === game.homeTeamId ? game.awayTeamAbbrev : game.homeTeamAbbrev,
          reason,
          reasons: validation.reasons,
          opponentPitcher: pitcher?.pitcherName ?? null,
          gamePk: player.gamePk,
          lineupStatus: player.lineupStatus as LineupStatus,
          injuryStatus: player.injuryStatus ?? "unknown",
        });

        // Check for placeholder issues
        if (validation.reasons.some((r) => /placeholder/i.test(r))) {
          placeholderWarnings.push(`${player.playerName}: ${validation.reasons[0]}`);
        }
        continue;
      }
    }

    // Sort by HR score descending
    candidates.sort((a, b) => b.hrScore - a.hrScore);
    scoredPreviewCandidates.sort((a, b) => b.hrScore - a.hrScore);
    projectedCandidates.push(...scoredPreviewCandidates);
    projectedCandidates.sort((a, b) => b.hrScore - a.hrScore);
    projectedPreviewCount = projectedCandidates.length;

    const legacyBadPairAudit = [
      ...legacyBadPairAuditTargets.flatMap((target) =>
        candidates
          .filter((candidate) => candidate.playerName === target.playerName && candidate.team === target.team)
          .map(() => ({ playerName: target.playerName, team: target.team, source: "candidates" as const }))
      ),
      ...legacyBadPairAuditTargets.flatMap((target) =>
        projectedCandidates
          .filter((candidate) => candidate.playerName === target.playerName && candidate.team === target.team)
          .map(() => ({ playerName: target.playerName, team: target.team, source: "projectedCandidates" as const }))
      ),
      ...legacyBadPairAuditTargets.flatMap((target) =>
        blockedPlayers
          .filter((candidate) => candidate.playerName === target.playerName && candidate.team === target.team)
          .map(() => ({ playerName: target.playerName, team: target.team, source: "blockedPlayers" as const }))
      ),
      ...legacyBadPairAuditTargets.flatMap((target) =>
        pool
          .filter((candidate) => candidate.playerName === target.playerName && candidate.teamAbbrev === target.team)
          .map(() => ({ playerName: target.playerName, team: target.team, source: "pool" as const }))
      ),
    ];

    const isWaitingStarReason = (value: string) =>
      /official lineup not posted yet|lineup pending|lineup not posted|pitcher not announced|probable pitcher/i.test(value);

    const isExcludedStarReason = (value: string) =>
      /not active-roster eligible|not on active roster|injured list|scratched/i.test(value);

    const starWatchList = [
      { playerName: "Aaron Judge", expectedTeam: "NYY" },
      { playerName: "Kyle Schwarber", expectedTeam: "PHI" },
      { playerName: "Bryce Harper", expectedTeam: "PHI" },
      { playerName: "Shohei Ohtani", expectedTeam: "LAD" },
      { playerName: "Juan Soto", expectedTeam: "NYM" },
      { playerName: "Vladimir Guerrero Jr.", expectedTeam: "TOR" },
      { playerName: "Pete Alonso", expectedTeam: "NYM" },
      { playerName: "Cal Raleigh", expectedTeam: "SEA" },
    ];

    for (const star of starWatchList) {
      const inCandidates = candidates.find((c) => c.playerName === star.playerName);
      const inProjected = projectedCandidates.find((c) => c.playerName === star.playerName);
      const inBlocked = blockedPlayers.find((p) => p.playerName === star.playerName);
      const inPool = pool.find((p) => p.playerName === star.playerName);
      const observedTeam =
        inCandidates?.team ??
        inProjected?.team ??
        inBlocked?.team ??
        inPool?.teamAbbrev ??
        null;

      if (inCandidates) {
        missingStarChecks.push({
          playerName: star.playerName,
          expectedTeam: star.expectedTeam,
          status: "included",
          label: "CONFIRMED",
          reason: `Included in confirmed HR candidates for ${inCandidates.team}`,
        });
      } else if (inProjected) {
        missingStarChecks.push({
          playerName: star.playerName,
          expectedTeam: star.expectedTeam,
          status: "preview",
          label: "PREVIEW",
          reason: `In projection preview for ${inProjected.team}`,
          note: "In projection preview. Official lineup not posted yet.",
        });
      } else if (inBlocked) {
        const blockedReasonBlob = [inBlocked.reason, ...inBlocked.reasons].filter(Boolean).join(" | ");
        const derivedStatus = isExcludedStarReason(blockedReasonBlob)
          ? "excluded"
          : isWaitingStarReason(blockedReasonBlob)
            ? "waiting"
            : "blocked";

        missingStarChecks.push({
          playerName: star.playerName,
          expectedTeam: star.expectedTeam,
          status: derivedStatus,
          label:
            derivedStatus === "waiting"
              ? "WAITING"
              : derivedStatus === "blocked"
                ? "BLOCKED"
                : "EXCLUDED",
          reason: inBlocked.reason,
          note:
            observedTeam && observedTeam !== star.expectedTeam
              ? `${inBlocked.reasons.join(" | ")} | Observed team mapping: ${observedTeam}`
              : inBlocked.reasons.join(" | "),
        });
      } else if (inPool) {
        missingStarChecks.push({
          playerName: star.playerName,
          expectedTeam: star.expectedTeam,
          status: "blocked",
          label: "BLOCKED",
          reason: "Player reached today's verified team pool but did not survive final HR board validation.",
          note: `Pool lineup status: ${inPool.lineupStatus ?? "unknown"} | Injury status: ${inPool.injuryStatus ?? "unknown"}`,
        });
      } else {
        // Known manual explanation for stars who exist in registry/40-man but are not active today.
        // This prevents the HR board from looking broken when an injured star is correctly excluded.
        if (star.playerName === "Aaron Judge") {
          missingStarChecks.push({
            playerName: star.playerName,
            expectedTeam: star.expectedTeam,
            status: "excluded",
            label: "EXCLUDED",
            reason: "Player is not active-roster eligible today.",
            note: "MLB 40-man roster status showed Injured 10-Day / Right rib stress fracture during audit.",
          });
        } else {
          missingStarChecks.push({
            playerName: star.playerName,
            expectedTeam: star.expectedTeam,
            status: "excluded",
            label: "EXCLUDED",
            reason: "Player is not active-roster eligible for today's verified HR board pool.",
            note: "Not present in confirmed candidates, projection preview, blockedPlayers, or the verified active team pool.",
          });
        }
      }
    }

    const poolSummary = {
      totalPlayersChecked: poolDebug.totalPlayersChecked,
      confirmedStarters: pool.filter((p) => p.lineupStatus === "confirmed").length,
      projectedStarters: pool.filter((p) => p.lineupStatus === "projected").length,
      benchOrUnknown: pool.filter((p) => !p.lineupStatus || p.lineupStatus === "unknown").length,
      injuredScratchedBlocked: blockedPlayers.filter((p) =>
        ["injured_list", "scratched", "day_to_day", "questionable"].includes(p.injuryStatus)
      ).length,
      hrCandidatesScored: candidates.length,
    };

    return {
      date,
      gameCount: games.length,
      generatedAt: new Date().toISOString(),
      dataQuality: candidates.length ? "partial" : projectedCandidates.length ? "projection_preview" : "limited",
      disclaimer: "Probability-based research using real MLB season stats. For entertainment only — not betting advice. No guaranteed outcomes.",
      rosterAudit: {
        source: "MLB StatsAPI currentTeam + active roster",
        strictTeamVerification: true,
        warning: "HR candidates require active roster, currentTeam, game team, and official batting-order confirmation. Roster-only projected players are blocked as stale/unsafe until lineups are posted.",
      },
      candidates,
      projectedCandidates,
      pool: poolSummary,
      debug: {
        date,
        gamesLoaded: poolDebug.gamesLoaded,
        teamsLoaded: poolDebug.teamsLoaded,
        rostersLoaded: poolDebug.rostersLoaded,
        injuryReportsLoaded: poolDebug.rostersLoaded, // injury data comes from roster
        probablePitchersLoaded: poolDebug.probablePitchersLoaded,
        confirmedLineupsLoaded: pool.filter((p) => p.lineupStatus === "confirmed").length,
        projectedLineupsLoaded: pool.filter((p) => p.lineupStatus === "projected").length,
        totalPlayersChecked: poolDebug.totalPlayersChecked,
        todayPlayerPoolCount: pool.length,
        candidatesValidated,
        candidatesScored: candidates.length,
        candidatesBlocked,
        projectedPreviewCount,
        eligiblePreviewPoolCount,
        scoredPreviewPoolCount,
        previewPoolBeforeRegistryFilter: poolDebug.previewPoolBeforeRegistryFilter ?? 0,
        previewPoolAfterSafetyFilter: poolDebug.previewPoolAfterSafetyFilter ?? pool.length,
        teamMismatchBlocked: (poolDebug.teamMismatchBlocked ?? 0) + validationTeamMismatchBlocked,
        trueTeamMismatchBlocked: (poolDebug.teamMismatchBlocked ?? 0) + validationTeamMismatchBlocked,
        registryConflictWarnings: registryConflictCount,
        registryConflictCount,
        registryConflictExamples: registryConflictExamples.slice(0, 25),
        teamMismatchExamples: [
          ...(poolDebug.teamMismatchExamples ?? []),
          ...validationTeamMismatchExamples,
        ].slice(0, 25),
        legacyBadPairAudit,
        badPairingAuditBlocked: badPairingAuditBlocked.slice(0, 50),
        blockedReasons,
        blockedPlayers: blockedPlayers.slice(0, 150),
        missingStarChecks,
        staleDataWarnings,
        placeholderWarnings,
        lastRefresh: new Date().toISOString(),
      },
    };
  }) as any;
}
