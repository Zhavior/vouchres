/**
 * Slate Results — the graded record of one MLB day.
 *
 * Everything on this payload is derived, never stored:
 *   - what actually happened comes from the real HR play-by-play feed
 *     (hrFeedService), so a result cannot drift from the games;
 *   - what was called comes from the pregame snapshot table
 *     (hr_feature_snapshots) and from tracked_capper_picks, both written before
 *     first pitch.
 *
 * Point-in-time integrity is the whole reason tiers read from the snapshot
 * rather than from buildHrBoard(): season-to-date stats fetched today already
 * contain yesterday's outcome, so re-ranking a past slate from live stats would
 * grade the board against a board it never published. When no snapshot exists
 * for a date, tiers come back null with a stated reason — never a guessed
 * fraction.
 */
import { getScheduleByDate, todayISO } from "../mlb/mlbClient";
import { getTodayHomeRuns, type HrEvent } from "../mlb/hrFeedService";
import { getSupabaseAdmin } from "../../middleware/auth";
import {
  listActiveCappers,
  listPicksForSlate,
  type CapperPickRecord,
} from "../cappers/cappersService";

/** Plays that hit out of plays that were called. */
export interface Tally {
  hit: number;
  total: number;
}

export interface SlateGameResult {
  gamePk: number;
  matchup: string;
  awayAbbr: string;
  homeAbbr: string;
  status: string;
  /** Null when this slate has no pregame snapshot to grade against. */
  topPlays: Tally | null;
  zoneFit: Tally | null;
  homeRuns: number;
}

export interface SlateCapperResult {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  ticket: {
    playerId: number;
    playerName: string;
    teamAbbr: string | null;
    headshot: string;
    /** true = homered, false = did not, null = games still in progress. */
    hit: boolean | null;
  } | null;
  /** Picks from this capper's published board that homered. */
  correct: number;
  picks: number;
}

export interface SlateHomeRun {
  id: string;
  playerId: number;
  playerName: string;
  team: string;
  teamAbbr: string;
  headshot: string;
  matchup: string;
  inning: number;
  exitVelocity: number | null;
  distance: number | null;
  timestamp: string;
}

export interface SlateResults {
  date: string;
  isToday: boolean;
  generatedAt: string;
  grade: {
    letter: string | null;
    /** Observed hits ÷ hits the board's own probabilities expected. */
    lift: number | null;
    reason: string;
  };
  totals: {
    slateHomeRuns: number;
    /** HRs that someone tracked actually called. */
    bangs: number;
    correctCapperPicks: number;
  };
  tiers: {
    cappersTicket: Tally;
    topPlays: Tally | null;
    zoneFit: Tally | null;
  };
  games: SlateGameResult[];
  cappers: SlateCapperResult[];
  homeRuns: SlateHomeRun[];
  board: {
    source: "snapshot" | "none";
    note: string;
  };
  warnings: string[];
}

/** Board plays graded per game, matching how the desk publishes them. */
const TOP_PLAYS_PER_GAME = 5;
const ZONE_FIT_PER_GAME = 3;

interface SnapshotCandidate {
  gamePk: number;
  playerId: number;
  hrScore: number;
  estimatedHrProbability: number | null;
  /** Pitcher vulnerability × park context — the matchup fit, independent of the hitter's own ranking. */
  zoneFit: number | null;
}

function num(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Pregame candidates for one slate, one row per (game, player). Only
 * point-in-time rows are read: a snapshot taken after first pitch cannot be
 * graded honestly, so it is excluded rather than silently included.
 */
async function loadSnapshotCandidates(date: string): Promise<SnapshotCandidate[] | null> {
  const supabase = await getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("hr_feature_snapshots")
    .select("game_pk, player_id, features")
    .eq("slate_date", date)
    .eq("is_point_in_time", true);

  if (error || !data || data.length === 0) return null;

  const rows: SnapshotCandidate[] = [];
  for (const row of data as Array<{ game_pk: string; player_id: string; features: any }>) {
    const gamePk = Number(row.game_pk);
    const playerId = Number(row.player_id);
    if (!Number.isFinite(gamePk) || !Number.isFinite(playerId)) continue;

    const features = row.features ?? {};
    const breakdown = features.scoreBreakdown ?? {};
    const vulnerability = num(breakdown.pitcherVulnerability);
    const park = num(breakdown.parkContext);

    rows.push({
      gamePk,
      playerId,
      hrScore: num(features.hrScore) ?? 0,
      estimatedHrProbability: num(features.estimatedHrProbability),
      zoneFit: vulnerability == null && park == null ? null : (vulnerability ?? 0) + (park ?? 0),
    });
  }
  return rows.length > 0 ? rows : null;
}

function tallyFor(
  candidates: SnapshotCandidate[],
  homered: Set<number>,
): Tally {
  let hit = 0;
  for (const candidate of candidates) if (homered.has(candidate.playerId)) hit += 1;
  return { hit, total: candidates.length };
}

function topBy(
  candidates: SnapshotCandidate[],
  key: (candidate: SnapshotCandidate) => number | null,
  limit: number,
): SnapshotCandidate[] {
  return candidates
    .filter((candidate) => key(candidate) != null)
    .sort((a, b) => (key(b) ?? 0) - (key(a) ?? 0))
    .slice(0, limit);
}

/**
 * Letter grade from lift: how the day's board plays converted against the
 * probability the board itself published for them. A day where every play was a
 * coin flip the model called at 10% and six of seventy-five landed is graded on
 * that 7.5-hit expectation, not on a raw hit rate that would read as failure.
 */
const GRADE_BANDS: Array<[number, string]> = [
  [1.60, "A+"], [1.35, "A"], [1.18, "A-"],
  [1.06, "B+"], [0.96, "B"], [0.86, "B-"],
  [0.74, "C+"], [0.62, "C"], [0.50, "C-"],
  [0.32, "D"],
];

function gradeFromLift(lift: number): string {
  for (const [floor, letter] of GRADE_BANDS) if (lift >= floor) return letter;
  return "F";
}

export async function buildSlateResults(date = todayISO()): Promise<SlateResults> {
  const warnings: string[] = [];
  const isToday = date === todayISO();

  const [schedule, feed, snapshot, cappers, picks] = await Promise.all([
    getScheduleByDate(date).catch(() => []),
    getTodayHomeRuns(date).catch(() => ({ events: [] as HrEvent[], warnings: ["HR feed unavailable."] })),
    loadSnapshotCandidates(date).catch(() => null),
    listActiveCappers().catch(() => []),
    listPicksForSlate(date).catch(() => [] as CapperPickRecord[]),
  ]);

  warnings.push(...(feed.warnings ?? []));

  const events = feed.events ?? [];
  const homered = new Set(events.map((event) => event.playerId));
  const hrsByGame = new Map<number, number>();
  for (const event of events) {
    hrsByGame.set(event.gamePk, (hrsByGame.get(event.gamePk) ?? 0) + 1);
  }

  // ---- Board tiers, per game -------------------------------------------------
  const snapshotByGame = new Map<number, SnapshotCandidate[]>();
  for (const candidate of snapshot ?? []) {
    const list = snapshotByGame.get(candidate.gamePk);
    if (list) list.push(candidate);
    else snapshotByGame.set(candidate.gamePk, [candidate]);
  }

  const calledPlayerIds = new Set<number>();
  let topPlays: Tally | null = snapshot ? { hit: 0, total: 0 } : null;
  let zoneFit: Tally | null = snapshot ? { hit: 0, total: 0 } : null;
  const gradedProbabilities: number[] = [];
  let gradedHits = 0;

  const games: SlateGameResult[] = schedule.map((game: any) => {
    const gamePk = Number(game.gamePk);
    const candidates = snapshotByGame.get(gamePk) ?? [];

    let gameTop: Tally | null = null;
    let gameZone: Tally | null = null;

    if (snapshot && candidates.length > 0) {
      const topRows = topBy(candidates, (c) => c.hrScore, TOP_PLAYS_PER_GAME);
      const zoneRows = topBy(candidates, (c) => c.zoneFit, ZONE_FIT_PER_GAME);
      gameTop = tallyFor(topRows, homered);
      gameZone = tallyFor(zoneRows, homered);

      topPlays = { hit: topPlays!.hit + gameTop.hit, total: topPlays!.total + gameTop.total };
      zoneFit = { hit: zoneFit!.hit + gameZone.hit, total: zoneFit!.total + gameZone.total };

      for (const row of [...topRows, ...zoneRows]) {
        calledPlayerIds.add(row.playerId);
      }
      // The grade reads the top-play tier only: it is the tier the desk publishes
      // as its call, and each row carries the probability it was published with.
      for (const row of topRows) {
        if (row.estimatedHrProbability == null) continue;
        gradedProbabilities.push(row.estimatedHrProbability);
        if (homered.has(row.playerId)) gradedHits += 1;
      }
    }

    return {
      gamePk,
      matchup: `${game.awayTeam?.abbreviation ?? "?"} @ ${game.homeTeam?.abbreviation ?? "?"}`,
      awayAbbr: game.awayTeam?.abbreviation ?? "?",
      homeAbbr: game.homeTeam?.abbreviation ?? "?",
      status: String(game.status ?? ""),
      topPlays: gameTop,
      zoneFit: gameZone,
      homeRuns: hrsByGame.get(gamePk) ?? 0,
    };
  });

  // ---- Cappers ---------------------------------------------------------------
  const picksByCapper = new Map<string, CapperPickRecord[]>();
  for (const pick of picks) {
    const list = picksByCapper.get(pick.capper_id);
    if (list) list.push(pick);
    else picksByCapper.set(pick.capper_id, [pick]);
  }

  let ticketHits = 0;
  let ticketTotal = 0;
  let correctCapperPicks = 0;

  const capperResults: SlateCapperResult[] = cappers.map((capper) => {
    const own = picksByCapper.get(capper.id) ?? [];
    const ticketPick = own.find((pick) => pick.slot === "ticket") ?? null;
    const boardPicks = own.filter((pick) => pick.slot === "board");

    for (const pick of own) calledPlayerIds.add(pick.player_id);

    const correct = boardPicks.filter((pick) => homered.has(pick.player_id)).length;
    correctCapperPicks += correct;

    let ticket: SlateCapperResult["ticket"] = null;
    if (ticketPick) {
      const hit = homered.has(ticketPick.player_id);
      // Mid-slate, a player who has not homered yet still might. Only a finished
      // slate can turn a miss into a confirmed NO GO.
      ticket = {
        playerId: ticketPick.player_id,
        playerName: ticketPick.player_name,
        teamAbbr: ticketPick.team_abbr,
        headshot: `https://img.mlbstatic.com/mlb-photos/image/upload/w_213,d_people:generic:headshot:67:current.png,q_auto:best/v1/people/${ticketPick.player_id}/headshot/67/current`,
        hit: hit ? true : isToday ? null : false,
      };
      ticketTotal += 1;
      if (hit) ticketHits += 1;
    }

    return {
      id: capper.id,
      handle: capper.handle,
      displayName: capper.display_name,
      avatarUrl: capper.avatar_url,
      ticket,
      correct,
      picks: boardPicks.length,
    };
  });

  // ---- Grade -----------------------------------------------------------------
  const expectedHits = gradedProbabilities.reduce((sum, p) => sum + p, 0);
  let grade: SlateResults["grade"];
  if (!snapshot) {
    grade = {
      letter: null,
      lift: null,
      reason: "No pregame snapshot for this slate — the board cannot be graded against what it published.",
    };
  } else if (expectedHits <= 0) {
    grade = {
      letter: null,
      lift: null,
      reason: "Snapshot rows carry no published HR probability, so there is no expectation to grade against.",
    };
  } else {
    const lift = gradedHits / expectedHits;
    grade = {
      letter: gradeFromLift(lift),
      lift,
      reason: `${gradedHits} of ${gradedProbabilities.length} top plays homered against ${expectedHits.toFixed(1)} expected.`,
    };
  }

  if (!snapshot) {
    warnings.push("Board tiers unavailable: no point-in-time snapshot was captured for this slate.");
  }

  const bangs = events.filter((event) => calledPlayerIds.has(event.playerId)).length;

  return {
    date,
    isToday,
    generatedAt: new Date().toISOString(),
    grade,
    totals: {
      slateHomeRuns: events.length,
      bangs,
      correctCapperPicks,
    },
    tiers: {
      cappersTicket: { hit: ticketHits, total: ticketTotal },
      topPlays,
      zoneFit,
    },
    games,
    cappers: capperResults,
    homeRuns: events.map((event) => ({
      id: event.id,
      playerId: event.playerId,
      playerName: event.playerName,
      team: event.team,
      teamAbbr: event.teamAbbr,
      headshot: event.headshot,
      matchup: event.matchup,
      inning: event.inning,
      exitVelocity: event.exitVelocity ?? null,
      distance: event.distance ?? null,
      timestamp: event.timestamp,
    })),
    board: snapshot
      ? { source: "snapshot", note: "Tiers graded against the pregame snapshot captured before first pitch." }
      : { source: "none", note: "No pregame snapshot for this slate." },
    warnings,
  };
}
