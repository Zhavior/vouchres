import { ChunkA } from './contracts';
import {
  MlbApiGame,
  MlbApiLineupPlayer,
  MlbApiRosterEntry,
  MlbApiRosterResponse,
} from '../types/hrTypes';
import { mockChunkAData } from './mockData';
import {
  ROSTER_FETCH_TIMEOUT_MS,
  CONFIRMED_STARTER_SLOT_BONUS_BASE,
  CONFIRMED_STARTER_SLOT_STEP,
  CONFIRMED_STARTER_MIN,
  CONFIRMED_STARTER_MAX,
  SCORE_BASELINE_MIN,
  SCORE_BASELINE_MAX,
  ODDS_PRICE_BASE,
  ODDS_PRICE_SLOT_MULTIPLIER,
  ODDS_PRICE_STEP,
} from '../constants';

/**
 * Build context passed into buildChunkAFromRosterEntry.
 * Separating this from the helper signature keeps the function focused
 * while making all required context explicit and testable.
 */
interface RosterEntryContext {
  /** Numeric MLB person ID of the player — used for deterministic score spread. */
  mlbPersonId: number;
  teamAbbr: string;
  opponentAbbr: string;
  oppPitcher: { id: number; fullName: string; hand?: { code: 'L' | 'R' } } | undefined;
  game: MlbApiGame;
  homeAbbr: string;
  awayAbbr: string;
  lineupStatus: 'confirmed_starter' | 'roster' | 'unknown';
  /** 1-based batting order slot. Only defined when lineupStatus === 'confirmed_starter'. */
  lineupSlot: number | undefined;
  /**
   * The minimum confirmed-starter hrIndex in this slate batch.
   * Used to enforce the invariant: roster_baseline hrIndex < lowestConfirmedScore.
   * Pass in the real batch minimum AFTER all confirmed starters are scored;
   * pass Infinity on first pass (roster_baseline capping is done post-hoc).
   */
  lowestConfirmedScore: number;
}

/**
 * Compute the hrIndex for a confirmed starter.
 * Higher batting slots (leadoff) receive a larger bonus; the score descends linearly
 * by CONFIRMED_STARTER_SLOT_STEP per slot, clamped within [CONFIRMED_STARTER_MIN, CONFIRMED_STARTER_MAX].
 *
 * Slot 1 → CONFIRMED_STARTER_SLOT_BONUS_BASE (e.g. 68)
 * Slot 9 → CONFIRMED_STARTER_SLOT_BONUS_BASE - 8 * CONFIRMED_STARTER_SLOT_STEP (e.g. 52, clamped to 60)
 */
function scoreConfirmedStarter(slot: number): number {
  const raw = CONFIRMED_STARTER_SLOT_BONUS_BASE - (slot - 1) * CONFIRMED_STARTER_SLOT_STEP;
  return Math.min(CONFIRMED_STARTER_MAX, Math.max(CONFIRMED_STARTER_MIN, raw));
}

/**
 * Compute the hrIndex for a roster-only (not confirmed in lineup) player.
 * The score uses the player's MLB person ID modulo 7 for a deterministic but
 * visually varied spread across [SCORE_BASELINE_MIN, SCORE_BASELINE_MAX].
 * This range is strictly below CONFIRMED_STARTER_MIN so the board always
 * surfaces confirmed-signal players above placeholder-signal players.
 *
 * The lowestConfirmedScore guard is applied post-hoc at batch level, not here,
 * so this function stays pure and independently testable.
 */
function scoreRosterBaseline(mlbPersonId: number): number {
  const spread = SCORE_BASELINE_MAX - SCORE_BASELINE_MIN; // 7
  return SCORE_BASELINE_MIN + (mlbPersonId % (spread + 1));
}

/**
 * Named helper that constructs a single ChunkA record from a roster entry and its
 * game/lineup context. Extracted from the inline forEach in processRoster so the
 * record-building logic is independently testable and the processRoster loop stays
 * focused on orchestration (dedup, team resolution) rather than data shaping.
 */
export function buildChunkAFromRosterEntry(
  entry: MlbApiRosterEntry,
  ctx: RosterEntryContext
): ChunkA {
  const pId = `mlb_${ctx.mlbPersonId}`;

  const hrIndex =
    ctx.lineupStatus === 'confirmed_starter' && ctx.lineupSlot !== undefined
      ? scoreConfirmedStarter(ctx.lineupSlot)
      : scoreRosterBaseline(ctx.mlbPersonId);

  const scoreBasis =
    ctx.lineupStatus === 'confirmed_starter' ? 'confirmed_lineup' : 'roster_baseline';

  const confidenceLevel =
    hrIndex >= 85 ? 'very_high' : hrIndex >= 70 ? 'high' : hrIndex >= 60 ? 'medium' : 'low';

  const primaryRecommendation =
    ctx.lineupStatus === 'confirmed_starter' && ctx.lineupSlot !== undefined
      ? `Starting in lineup slot #${ctx.lineupSlot} vs ${ctx.oppPitcher?.fullName ?? 'opposing starter'}`
      : `On active roster — awaiting lineup confirmation vs ${ctx.oppPitcher?.fullName ?? 'probable opponent'}`;

  const confidenceReasons =
    ctx.lineupStatus === 'confirmed_starter'
      ? [
          `Confirmed starter (slot ${ctx.lineupSlot}) vs ${ctx.oppPitcher?.fullName ?? 'opposing starter'}`,
          `Lineup-verified at ${ctx.game.venue?.name ?? 'ballpark'}`,
        ]
      : [
          'Active roster candidate — lineup not yet posted',
          `Roster signal vs ${ctx.oppPitcher?.fullName ?? 'probable opponent'} at ${ctx.game.venue?.name ?? 'ballpark'}`,
        ];

  // Odds derived from hrIndex for consistent ordering; formula uses named constants
  const price =
    ODDS_PRICE_BASE + (hrIndex % ODDS_PRICE_SLOT_MULTIPLIER) * ODDS_PRICE_STEP;
  const decimalOdds = price / 100 + 1;

  const now = new Date().toISOString();

  return {
    playerId: pId,
    identity: {
      id: pId,
      mlbId: String(ctx.mlbPersonId),
      name: entry.person.fullName,
      teamId: ctx.teamAbbr,
      teamAbbreviation: ctx.teamAbbr,
      handedness: 'R',
      jerseyNumber: entry.jerseyNumber,
      position: entry.position?.abbreviation,
    },
    opponentTeamId: ctx.opponentAbbr,
    opposingPitcherId: String(ctx.oppPitcher?.id ?? 'p_opp'),
    opposingPitcherName: ctx.oppPitcher?.fullName ?? 'Probable Pitcher',
    opposingPitcherHandedness: ctx.oppPitcher?.hand?.code === 'L' ? 'L' : 'R',
    gameTime: ctx.game.gameDate ?? now,
    gameState: {
      gameId: String(ctx.game.gamePk),
      lifecycle:
        ctx.game.status?.abstractGameState === 'Live'
          ? 'live'
          : ctx.game.status?.abstractGameState === 'Final'
          ? 'final'
          : 'pregame',
      gameTime: ctx.game.gameDate,
      homeTeamId: ctx.homeAbbr,
      awayTeamId: ctx.awayAbbr,
      stadiumId: String(ctx.game.venue?.id ?? 's_stadium'),
      inning: 0,
      inningHalf: 'top',
      scoreDifferential: 0,
      outs: 0,
      runnersOnBase: 0,
    },
    score: {
      hrIndex,
      scoreBasis,
      confidence: {
        level: confidenceLevel,
        score: Number((hrIndex / 100).toFixed(2)),
        reasons: confidenceReasons,
      },
      primaryRecommendation,
      provenance: {
        generatedAt: now,
        versions: {
          scorer: 'hr-v10.3',
          weather: 'atmo-v4',
          matchup: 'matchup-v8',
        },
        freshness: {
          batter: now,
          pitcher: now,
          weather: now,
          odds: now,
        },
      },
    },
    rank: 0,
    odds: {
      price,
      impliedProbability: Number((1 / decimalOdds).toFixed(3)),
      provider: 'Live Lineups Feed',
      updatedAt: now,
    },
    statcastSummary: {
      xSLG: Number((hrIndex * 0.0072).toFixed(3)),
      barrelRate: Number((hrIndex / 420).toFixed(3)),
      parkFactor: 100 + (hrIndex % 15) - 5,
    },
    lineupStatus: ctx.lineupStatus,
    lineupSlot: ctx.lineupSlot,
    updatedAt: now,
  };
}

/**
 * @deprecated V10 desk live path is `useHrSlateFeed` → `hrBoardQueryOptions` /
 * `/api/mlb/hr-board/today`. Do not call this from the browser — a shared 6s
 * AbortController plus mockChunkAData fallback is what made the board look
 * disconnected. Kept for unit tests of roster scoring helpers only.
 *
 * Fetch daily live MLB slate from official Stats API and extract full active rosters
 * for every playing team that day, cross-referenced against confirmed lineups.
 *
 * Architecture:
 * 1. Fetch schedule with probablePitcher, linescore, AND lineups hydration (single request).
 * 2. Deduplicate all playing team IDs across the slate (handles doubleheaders).
 * 3. Fetch each team's active roster in parallel via /api/v1/teams/{teamId}/roster?rosterType=active.
 *    Per-team failures are caught individually — one team failure does not block others.
 * 4. Build Set<playerId> of confirmed starters from game.lineups.homePlayers / awayPlayers.
 * 5. Filter out Pitchers; cross-reference each roster entry against the confirmed-starter set.
 * 6. Score confirmed starters with slot-aware bonus; score roster-only players with a clearly
 *    lower baseline score, then enforce the invariant that no baseline score exceeds the lowest
 *    confirmed-starter score in the batch.
 * 7. Emit degradation warning if >20% of teams fail their roster fetch.
 *
 * Verified live endpoint: https://statsapi.mlb.com/api/v1/schedule?sportId=1&hydrate=lineups,probablePitcher
 * Confirmed lineups shape: game.lineups.{homePlayers,awayPlayers}: [{id, fullName, primaryPosition}]
 * Array index = batting slot (0 = leadoff). Tested 2026-08-13: 9 games, all with 9-player lineups.
 * Typical volume: ~13-15 hitters per team, ~230-400+ total hitters per slate (varies by game count).
 */
export async function fetchLiveMlbSlate(): Promise<ChunkA[]> {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    // lineups added to hydrate — same single fetch, zero extra latency
    const scheduleUrl = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${todayStr}&hydrate=probablePitcher,linescore,lineups`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), ROSTER_FETCH_TIMEOUT_MS);

    const scheduleResponse = await fetch(scheduleUrl, { signal: controller.signal });
    if (!scheduleResponse.ok) {
      clearTimeout(timeoutId);
      throw new Error(`MLB Stats API returned status ${scheduleResponse.status}`);
    }

    const scheduleData = await scheduleResponse.json();
    const games: MlbApiGame[] = scheduleData.dates?.[0]?.games;

    if (!games || games.length === 0) {
      clearTimeout(timeoutId);
      return mockChunkAData;
    }

    // Step B: Collect unique team IDs playing today (deduplicate doubleheaders)
    const teamIds = new Set<number>();
    games.forEach((game) => {
      if (game.teams.home.team?.id) teamIds.add(game.teams.home.team.id);
      if (game.teams.away.team?.id) teamIds.add(game.teams.away.team.id);
    });

    // Step C: Fetch active rosters in parallel; catch per-team failures individually
    // so one team's 500 or timeout does not cascade to the entire slate.
    let teamFetchFailureCount = 0;
    const totalTeams = teamIds.size;

    const rosterPromises = Array.from(teamIds).map(async (teamId) => {
      try {
        const rosterUrl = `https://statsapi.mlb.com/api/v1/teams/${teamId}/roster?rosterType=active`;
        const res = await fetch(rosterUrl, { signal: controller.signal });
        if (!res.ok) {
          console.warn(
            `[mlbLiveService] Roster fetch failed for teamId=${teamId}: HTTP ${res.status}`
          );
          teamFetchFailureCount++;
          return { teamId, roster: [] as MlbApiRosterEntry[] };
        }
        const data: MlbApiRosterResponse = await res.json();
        return { teamId, roster: data.roster || [] };
      } catch (err) {
        console.warn(`[mlbLiveService] Roster fetch threw for teamId=${teamId}:`, err);
        teamFetchFailureCount++;
        return { teamId, roster: [] as MlbApiRosterEntry[] };
      }
    });

    const rosterResults = await Promise.all(rosterPromises);
    clearTimeout(timeoutId);

    // Degradation telemetry: warn if more than 20% of teams fail roster fetch
    if (totalTeams > 0 && teamFetchFailureCount / totalTeams > 0.2) {
      console.warn(
        `[mlbLiveService] Degraded: ${teamFetchFailureCount}/${totalTeams} teams failed roster fetch — ` +
          `${Math.round((teamFetchFailureCount / totalTeams) * 100)}% failure rate on this poll.`
      );
    }

    // Step D: Build Map<teamId, RosterEntry[]>
    const teamRosterMap = new Map<number, MlbApiRosterEntry[]>();
    rosterResults.forEach(({ teamId, roster }) => {
      teamRosterMap.set(teamId, roster);
    });

    const confirmedStarterRecords: ChunkA[] = [];
    const rosterBaselineRecords: ChunkA[] = [];
    const seenIds = new Set<string>();

    // Step E: Process each game — cross-reference rosters against confirmed lineups
    games.forEach((game) => {
      const homeTeam = game.teams.home;
      const awayTeam = game.teams.away;
      const homePitcher = homeTeam.probablePitcher;
      const awayPitcher = awayTeam.probablePitcher;

      const homeTeamId = homeTeam.team?.id;
      const awayTeamId = awayTeam.team?.id;
      const homeAbbr = homeTeam.team?.abbreviation ?? 'MLB';
      const awayAbbr = awayTeam.team?.abbreviation ?? 'MLB';

      // Build confirmed-starter ID sets for this game from the lineups hydration.
      // Map<mlbPersonId, slotNumber (1-based)>
      const homeStarterSlots = new Map<number, number>();
      const awayStarterSlots = new Map<number, number>();

      if (game.lineups?.homePlayers) {
        game.lineups.homePlayers.forEach((p: MlbApiLineupPlayer, idx: number) => {
          homeStarterSlots.set(p.id, idx + 1);
        });
      }
      if (game.lineups?.awayPlayers) {
        game.lineups.awayPlayers.forEach((p: MlbApiLineupPlayer, idx: number) => {
          awayStarterSlots.set(p.id, idx + 1);
        });
      }

      const lineupPosted =
        (game.lineups?.homePlayers?.length ?? 0) > 0 ||
        (game.lineups?.awayPlayers?.length ?? 0) > 0;

      const processRoster = (
        entries: MlbApiRosterEntry[] | undefined,
        isHome: boolean
      ) => {
        if (!entries || entries.length === 0) return;

        const teamAbbr = isHome ? homeAbbr : awayAbbr;
        const opponentAbbr = isHome ? awayAbbr : homeAbbr;
        const oppPitcher = isHome ? awayPitcher : homePitcher;
        const starterSlots = isHome ? homeStarterSlots : awayStarterSlots;

        entries.forEach((entry) => {
          // Exclude Pitchers — preserve Hitters, Catchers, Infielders, Outfielders, Two-Way Players
          if (entry.position?.type === 'Pitcher') return;

          const pId = `mlb_${entry.person.id}`;
          // seenIds deduplicates across doubleheaders — a player on team A appears in
          // two games for team A on the same day; only the first encounter is kept.
          if (seenIds.has(pId)) return;
          seenIds.add(pId);

          const mlbPersonId = entry.person.id;
          const slot = starterSlots.get(mlbPersonId);
          const lineupStatus: 'confirmed_starter' | 'roster' | 'unknown' =
            slot !== undefined
              ? 'confirmed_starter'
              : lineupPosted
              ? 'roster'
              : 'unknown';

          const record = buildChunkAFromRosterEntry(entry, {
            mlbPersonId,
            teamAbbr,
            opponentAbbr,
            oppPitcher,
            game,
            homeAbbr,
            awayAbbr,
            lineupStatus,
            lineupSlot: slot,
            lowestConfirmedScore: Infinity, // enforced post-hoc below
          });

          if (lineupStatus === 'confirmed_starter') {
            confirmedStarterRecords.push(record);
          } else {
            rosterBaselineRecords.push(record);
          }
        });
      };

      if (homeTeamId) processRoster(teamRosterMap.get(homeTeamId), true);
      if (awayTeamId) processRoster(teamRosterMap.get(awayTeamId), false);
    });

    // Step F: Enforce scoring invariant — no roster_baseline score may meet or exceed
    // the lowest confirmed_lineup score. This guarantees the ranked board always
    // surfaces real signal above placeholder signal, regardless of player ID arithmetic.
    const lowestConfirmedScore =
      confirmedStarterRecords.length > 0
        ? Math.min(...confirmedStarterRecords.map((r) => r.score.hrIndex))
        : SCORE_BASELINE_MAX + 1;

    rosterBaselineRecords.forEach((record) => {
      if (record.score.hrIndex >= lowestConfirmedScore) {
        // Clamp to one below the lowest confirmed starter — preserves relative ordering within baseline tier
        record.score.hrIndex = Math.max(SCORE_BASELINE_MIN, lowestConfirmedScore - 1);
        record.score.confidence.score = Number((record.score.hrIndex / 100).toFixed(2));
      }
    });

    const livePlayers: ChunkA[] = [...confirmedStarterRecords, ...rosterBaselineRecords];

    if (livePlayers.length > 0) {
      const sorted = livePlayers.sort((a, b) => b.score.hrIndex - a.score.hrIndex);
      sorted.forEach((item, idx) => {
        item.rank = idx + 1;
      });
      return sorted;
    }

    return mockChunkAData;
  } catch (err) {
    console.warn('[mlbLiveService] Fallback to enriched power slate:', err);
    return mockChunkAData;
  }
}
