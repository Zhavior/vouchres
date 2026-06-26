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
 *   3. Build Today Player Pool (top 5 hitters per team by batting order)
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
import { validateHrCandidate } from "./hrValidator";
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
const boardCache = new TTLCache<any>(5 * 60_000); // 5 min — final scored board

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

/* ============ Build Today Player Pool ============ */

async function buildTodayPlayerPool(date: string): Promise<PoolBuildResult> {
  // STEP 1: Fetch schedule (cached 5 min)
  const games = await scheduleCache.getOrSet(`schedule:${date}`, async () => {
    return await getScheduleByDate(date);
  });

  if (games.length === 0) {
    return { pool: [], games: [], gameContexts: [], debug: { gamesLoaded: 0, teamsLoaded: 0, rostersLoaded: 0, probablePitchersLoaded: 0, totalPlayersChecked: 0 } };
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
    probablePitchers: {
      away: g.probablePitchers.away
        ? { pitcherId: g.probablePitchers.away.pitcherId, pitcherName: g.probablePitchers.away.pitcherName, teamId: g.probablePitchers.away.teamId }
        : null,
      home: g.probablePitchers.home
        ? { pitcherId: g.probablePitchers.home.pitcherId, pitcherName: g.probablePitchers.home.pitcherName, teamId: g.probablePitchers.home.teamId }
        : null,
    },
    status: g.status,
  }));

  // STEP 5: Build player pool (top 5 power hitters per team by batting order)
  const MAX_HITTERS_PER_TEAM = 5;
  const pool: TodayPlayer[] = [];
  let totalPlayersChecked = 0;

  for (const game of games) {
    for (const teamSide of ["away", "home"] as const) {
      const team = teamSide === "away" ? game.awayTeam : game.homeTeam;
      const opponentTeam = teamSide === "away" ? game.homeTeam : game.awayTeam;
      if (!team?.teamId) continue;

      const players = hittersByTeam.get(team.teamId) || [];
      totalPlayersChecked += players.length;

      const topHitters = players
        .sort((a, b) => (a.battingOrder ?? 99) - (b.battingOrder ?? 99))
        .slice(0, MAX_HITTERS_PER_TEAM);

      for (const p of topHitters) {
        // Extract injury status from the roster data
        const injury = extractInjuryStatus(p);

        const player: TodayPlayer = {
          playerId: p.playerId,
          playerName: p.playerName,
          teamId: team.teamId,
          teamAbbrev: team.abbreviation ?? "???",
          opponentTeamId: opponentTeam?.teamId ?? 0,
          gamePk: game.gamePk,
          gameDate: game.gameDate,
          homeOrAway: teamSide,
          battingHand: p.bats,
          lineupStatus: p.battingOrder ? "confirmed" : "projected",
          battingOrder: p.battingOrder,
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

  // HR score components (simplified — uses real stats where available)
  let hrScore = 50;

  // Hitter power component
  if (hitterStats?.season) {
    const s = hitterStats.season;
    const hrPerPA = s.hrPerPA || 0;
    const slug = s.slg || 0;
    hrScore += clamp(hrPerPA * 100, 0, 25); // up to +25 for HR rate
    hrScore += clamp((slug - 0.4) * 50, 0, 15); // up to +15 for slugging
  }

  // Pitcher vulnerability component
  if (pitcherStats) {
    const hr9 = pitcherStats.homeRunsPer9 || 1.1;
    hrScore += clamp((hr9 - 1.1) * 15, -10, 20); // up to +20 for HR-prone pitcher
  }

  // Park factor
  // (game venue not directly available in GameContext — use neutral 100)
  hrScore += 0; // park factor applied when venue is available

  // Injury confidence adjustment
  if (player.injuryStatus === "day_to_day" || player.injuryStatus === "questionable") {
    hrScore -= 8;
  }

  // Lineup confidence adjustment
  if (player.lineupStatus !== "confirmed") {
    hrScore -= 3;
  }

  hrScore = clamp(Math.round(hrScore), 1, 100);

  // Risk tier
  const riskTier =
    hrScore >= 80 ? "Strong" :
    hrScore >= 65 ? "Playable" :
    hrScore >= 50 ? "Sneaky" :
    hrScore >= 38 ? "Lotto" : "Avoid";

  // Data confidence
  let dataConfidence = 50;
  if (player.lineupStatus === "confirmed") dataConfidence += 15;
  if (pitcher?.pitcherName && !isPlaceholder(pitcher.pitcherName)) dataConfidence += 15;
  if (player.injuryStatus === "healthy") dataConfidence += 10;
  if (hitterStats?.season) dataConfidence += 10;
  if (pitcherStats) dataConfidence += 10;
  if (player.injuryStatus === "unknown") dataConfidence -= 10;
  if (player.lineupStatus !== "confirmed") dataConfidence -= 5;
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
    opponentPitcher: pitcher?.pitcherName ?? "TBD",
    opponentPitcherId: pitcher?.pitcherId ?? 0,
    lineupStatus: player.lineupStatus,
    injuryStatus: player.injuryStatus,
    hrScore,
    dataConfidence,
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
  pool: TodayPlayerPool;
  debug: HrDebugResponse;
}> {
  return boardCache.getOrSet(`validated_hr:${date}`, async () => {
    const startTime = Date.now();

    // STEP 1: Build player pool
    const { pool, games, gameContexts, debug: poolDebug } = await buildTodayPlayerPool(date);

    if (pool.length === 0) {
      return {
        date,
        gameCount: 0,
        candidates: [],
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
          blockedReasons: {},
          staleDataWarnings: [],
          placeholderWarnings: [],
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
        const fullStats = pitcherStatsCache.get(`pitcher:${id}`) ?? await getPitcherStats(id);
        pitcherStatsCache.set(`pitcher:${id}`, fullStats);
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
          const stats = hitterStatsCache.get(`hitter:${id}`) ?? await getHitterStats(id);
          hitterStatsCache.set(`hitter:${id}`, stats);
          return { id, stats };
        })
      );
      for (const r of results) {
        if (r.status === "fulfilled") hitterStatsMap.set(r.value.id, r.value.stats);
      }
    }

    // STEP 4: Validate + score each candidate
    const seenPlayerIds = new Set<number>();
    const candidates: ScoredHrCandidate[] = [];
    const blockedReasons: Record<string, number> = {};
    let candidatesValidated = 0;
    let candidatesBlocked = 0;
    const placeholderWarnings: string[] = [];
    const staleDataWarnings: string[] = [];

    for (const player of pool) {
      const game = gameContexts.find((g) => g.gamePk === player.gamePk);
      if (!game) continue;

      const hitterStats = hitterStatsMap.get(player.playerId) ?? null;
      const isHome = player.teamId === game.homeTeamId;
      const pitcher = isHome ? game.probablePitchers.away : game.probablePitchers.home;
      const pitcherStats = pitcher ? (pitcherStatsMap.get(pitcher.pitcherId) ?? null) : null;

      // Validate
      const validation = validateHrCandidate(
        player,
        game,
        player.injuryStatus,
        !!hitterStats?.season,
        !!pitcherStats,
        seenPlayerIds
      );

      candidatesValidated++;

      if (!validation.valid) {
        candidatesBlocked++;
        const reason = validation.reasons[0] || "unknown";
        blockedReasons[reason] = (blockedReasons[reason] || 0) + 1;

        // Check for placeholder issues
        if (validation.reasons.some((r) => /placeholder/i.test(r))) {
          placeholderWarnings.push(`${player.playerName}: ${validation.reasons[0]}`);
        }
        continue;
      }

      // Mark as seen (prevent duplicates)
      seenPlayerIds.add(player.playerId);

      // Score only validated candidates
      const scored = scoreCandidate(player, hitterStats, pitcherStats, game, validation.status as any);
      candidates.push(scored);
    }

    // Sort by HR score descending
    candidates.sort((a, b) => b.hrScore - a.hrScore);

    // Build pool summary
    const poolSummary: TodayPlayerPool = {
      date,
      totalPlayersChecked: poolDebug.totalPlayersChecked,
      confirmedStarters: pool.filter((p) => p.lineupStatus === "confirmed").length,
      projectedStarters: pool.filter((p) => p.lineupStatus === "projected").length,
      benchOrUnknown: pool.filter((p) => p.lineupStatus === "bench" || p.lineupStatus === "unknown").length,
      injuredScratchedBlocked: pool.filter((p) =>
        p.injuryStatus === "injured_list" || p.injuryStatus === "scratched"
      ).length,
      hrCandidatesScored: candidates.length,
      players: pool,
      lastRefresh: new Date().toISOString(),
      dataSource: "MLB Stats API",
    };

    const elapsed = Date.now() - startTime;
    console.log(`[hrPipeline] ${date}: ${poolDebug.gamesLoaded} games, ${pool.length} pool players, ${candidates.length} scored, ${candidatesBlocked} blocked, ${elapsed}ms`);

    return {
      date,
      gameCount: games.length,
      candidates,
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
        blockedReasons,
        staleDataWarnings,
        placeholderWarnings,
        lastRefresh: new Date().toISOString(),
      },
    };
  }) as any;
}
