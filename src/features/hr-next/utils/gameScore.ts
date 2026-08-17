import type { HrWatchRow } from '../../hr/types/hrWatch';
import type { LiveGameCard } from '../../../types/liveGames';
import { toHrpi, tierForScore, type HrNextTierDef } from './tierPartition';

/**
 * Game-level HR scoring for the Projection Matrix.
 *
 * Two separate things live here and they must not be confused in the UI:
 *
 *   · `score` — a derived 0–100 projection of how good a matchup is for home
 *     runs, built only from typed `HrWatchRow` fields, same contract as
 *     `teamRanking`. It is a ranking of this slate, not a probability.
 *   · `live`  — the actual runs on the board, joined from the live games feed on
 *     `gamePk`. Never synthesised: a game with no feed entry, or one that has not
 *     started, reports no score rather than 0–0.
 */

/** Bats at or above this HRPI count toward a game's depth component. */
const DEPTH_HRPI_FLOOR = 70;
/** Depth saturates here — both lineups combined, so double a team's threshold. */
const DEPTH_SATURATION = 8;
/** Bats averaged into the game's headline bat-quality component. */
const TOP_N = 3;

const WEIGHTS = {
  topBats: 0.45,
  depth: 0.2,
  pitcher: 0.2,
  park: 0.15,
} as const;

export const GAME_SCORE_METHODOLOGY =
  'Game HR Score = 45% mean HRPI of the game\'s top 3 bats + 20% combined lineup depth (bats at 70+ HRPI, saturating at 8) + 20% mean pitcher vulnerability + 15% park context. Components the pipeline did not publish are dropped and the remaining weights renormalised, so a score is never propped up by a zero standing in for a missing layer. Each card lists the components it actually used.';

export const GAME_LIVE_METHODOLOGY =
  'Runs come from the live games feed joined on gamePk. A game with no feed entry, or one that has not thrown a pitch, shows its status instead of a score — never 0–0.';

export interface GameLiveState {
  awayAbbr: string | null;
  homeAbbr: string | null;
  awayName: string;
  homeName: string;
  awayScore: number | null;
  homeScore: number | null;
  status: string;
  isLive: boolean;
  isFinal: boolean;
  /** Inning / state text when the feed supplies one. */
  label: string | null;
  /** True only when both runs are published and the game has actually started. */
  hasRuns: boolean;
}

export interface GameHrScore {
  key: string;
  gamePk: string | null;
  rank: number;
  /** Teams as the board names them, ordered away-then-home when known. */
  teams: string[];
  awayTeam: string | null;
  homeTeam: string | null;
  matchupLabel: string;
  venue: string | null;
  gameTime: string | null;
  pitchers: string[];
  batters: number;
  confirmedRows: number;
  /** Derived 0–100 projection — see GAME_SCORE_METHODOLOGY. */
  score: number;
  topHrpi: number;
  topAvgHrpi: number;
  depthCount: number;
  pitcherVulnAvg: number | null;
  parkLayer: number | null;
  parkIndex: number | null;
  /** Σ of published model HR probabilities across the game. */
  expectedHr: number | null;
  pricedRows: number;
  /** Human names of the components that fed the score. */
  componentsUsed: string[];
  /** Components dropped because the pipeline published nothing. */
  componentsMissing: string[];
  tier: HrNextTierDef;
  live: GameLiveState | null;
}

export interface GameScoreIndex {
  games: GameHrScore[];
  /** Game score for a board row, keyed by `stableId`. */
  byRowId: Map<string, GameHrScore>;
  /** Games that found a live feed entry. */
  liveMatched: number;
}

function finite(value: number | null | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/** Stable per-game key — gamePk when the board published one, teams otherwise. */
export function gameKeyFor(row: HrWatchRow): string {
  if (row.gamePk != null && String(row.gamePk).trim()) return `pk:${row.gamePk}`;
  const [first, second] = [row.team, row.opponent].sort();
  return `mu:${first}_vs_${second}`;
}

export function buildLiveIndex(games: readonly LiveGameCard[] | undefined): Map<string, LiveGameCard> {
  const map = new Map<string, LiveGameCard>();
  for (const game of games ?? []) {
    if (game?.id != null) map.set(String(game.id), game);
  }
  return map;
}

function liveStateFor(card: LiveGameCard | undefined): GameLiveState | null {
  if (!card) return null;
  const awayScore = finite(card.awayScore);
  const homeScore = finite(card.homeScore);
  const isLive = Boolean(card.isLive);
  const isFinal = Boolean(card.isFinal);
  return {
    awayAbbr: card.awayAbbr ?? null,
    homeAbbr: card.homeAbbr ?? null,
    awayName: card.awayTeam,
    homeName: card.homeTeam,
    awayScore,
    homeScore,
    status: card.status,
    isLive,
    isFinal,
    label: card.liveStateLabel ?? null,
    // A scheduled game reports 0–0 on some feeds; that is a placeholder, not a score.
    hasRuns: awayScore != null && homeScore != null && (isLive || isFinal),
  };
}

export function buildGameScores(
  rows: HrWatchRow[],
  liveByPk?: Map<string, LiveGameCard>,
): GameScoreIndex {
  const buckets = new Map<string, HrWatchRow[]>();
  for (const row of rows) {
    const key = gameKeyFor(row);
    const bucket = buckets.get(key);
    if (bucket) bucket.push(row);
    else buckets.set(key, [row]);
  }

  const games: GameHrScore[] = [];

  buckets.forEach((gameRows, key) => {
    const sorted = [...gameRows].sort((left, right) => right.hrScore - left.hrScore);
    const leader = sorted[0];
    const gamePk = leader.gamePk != null ? String(leader.gamePk) : null;
    const card = gamePk ? liveByPk?.get(gamePk) : undefined;
    const live = liveStateFor(card);

    const topSlice = sorted.slice(0, TOP_N);
    const topAvgHrpi = Math.round(
      topSlice.reduce((sum, row) => sum + toHrpi(row.hrScore), 0) / topSlice.length,
    );
    const topHrpi = toHrpi(leader.hrScore);
    const depthCount = sorted.filter((row) => toHrpi(row.hrScore) >= DEPTH_HRPI_FLOOR).length;
    const depthScore = (Math.min(depthCount, DEPTH_SATURATION) / DEPTH_SATURATION) * 100;

    const pitcherVulnAvg = mean(
      sorted.map((row) => finite(row.pitcherVulnerability)).filter((v): v is number => v != null),
    );
    const parkLayer = mean(
      sorted
        .map((row) => finite(row.parkContext) ?? finite(row.parkFactor))
        .filter((v): v is number => v != null),
    );

    let parkIndex: number | null = null;
    let venue: string | null = null;
    let gameTime: string | null = null;
    let confirmedRows = 0;
    let probabilitySum = 0;
    let pricedRows = 0;
    const teamSet = new Set<string>();
    const pitcherSet = new Set<string>();

    for (const row of sorted) {
      if (parkIndex == null) parkIndex = finite(row.parkIndex);
      if (!venue && row.venue?.trim()) venue = row.venue.trim();
      if (!gameTime && row.gameTime) gameTime = row.gameTime;
      if (row.truthStatus === 'official') confirmedRows += 1;
      const prob = finite(row.hrProbability);
      if (prob != null) {
        probabilitySum += prob;
        pricedRows += 1;
      }
      if (row.team?.trim()) teamSet.add(row.team.trim());
      if (row.opponent?.trim()) teamSet.add(row.opponent.trim());
      if (row.pitcherName?.trim()) pitcherSet.add(row.pitcherName.trim());
    }

    // Renormalise around whatever the pipeline actually published, so a missing
    // layer never enters the weighted mean as a zero.
    const parts: { weight: number; value: number; label: string }[] = [
      { weight: WEIGHTS.topBats, value: topAvgHrpi, label: 'Top-3 bats' },
      { weight: WEIGHTS.depth, value: depthScore, label: 'Lineup depth' },
    ];
    const componentsMissing: string[] = [];
    if (pitcherVulnAvg != null) {
      parts.push({ weight: WEIGHTS.pitcher, value: pitcherVulnAvg, label: 'Pitcher vulnerability' });
    } else {
      componentsMissing.push('Pitcher vulnerability');
    }
    if (parkLayer != null) {
      parts.push({ weight: WEIGHTS.park, value: parkLayer, label: 'Park context' });
    } else {
      componentsMissing.push('Park context');
    }

    const weightSum = parts.reduce((sum, part) => sum + part.weight, 0);
    const score = Math.round(
      parts.reduce((sum, part) => sum + part.value * part.weight, 0) / weightSum,
    );

    // Orient with the live feed when it is present — it is authoritative on which
    // side is home. Fall back to the venue string, then to no orientation at all.
    const teams = [...teamSet];
    let awayTeam: string | null = null;
    let homeTeam: string | null = null;
    if (live) {
      const away = teams.find((team) => matchesTeam(team, live.awayAbbr, live.awayName));
      const home = teams.find((team) => matchesTeam(team, live.homeAbbr, live.homeName));
      if (away && home) {
        awayTeam = away;
        homeTeam = home;
      }
    }
    if (!awayTeam && venue) {
      const home = teams.find((team) => venue!.toLowerCase().includes(team.toLowerCase()));
      const away = teams.find((team) => team !== home);
      if (home && away) {
        homeTeam = home;
        awayTeam = away;
      }
    }

    const matchupLabel = awayTeam && homeTeam
      ? `${awayTeam} @ ${homeTeam}`
      : teams.length >= 2
        ? `${teams[0]} vs ${teams[1]}`
        : teams[0] ?? 'Matchup unavailable';

    games.push({
      key,
      gamePk,
      rank: 0,
      teams,
      awayTeam,
      homeTeam,
      matchupLabel,
      venue,
      gameTime,
      pitchers: [...pitcherSet],
      batters: sorted.length,
      confirmedRows,
      score,
      topHrpi,
      topAvgHrpi,
      depthCount,
      pitcherVulnAvg: pitcherVulnAvg != null ? Math.round(pitcherVulnAvg) : null,
      parkLayer: parkLayer != null ? Math.round(parkLayer) : null,
      parkIndex,
      expectedHr: pricedRows > 0 ? Math.round(probabilitySum * 100) / 100 : null,
      pricedRows,
      componentsUsed: parts.map((part) => part.label),
      componentsMissing,
      tier: tierForScore(leader.hrScore),
      live,
    });
  });

  games.sort((left, right) => {
    if (right.score !== left.score) return right.score - left.score;
    if (right.topHrpi !== left.topHrpi) return right.topHrpi - left.topHrpi;
    return right.batters - left.batters;
  });

  const ranked = games.map((game, i) => ({ ...game, rank: i + 1 }));
  const byKey = new Map(ranked.map((game) => [game.key, game]));

  const byRowId = new Map<string, GameHrScore>();
  for (const row of rows) {
    const game = byKey.get(gameKeyFor(row));
    if (game) byRowId.set(row.stableId, game);
  }

  return {
    games: ranked,
    byRowId,
    liveMatched: ranked.filter((game) => game.live != null).length,
  };
}

/** Board teams are abbreviations; the live feed carries both an abbr and a name. */
function matchesTeam(boardTeam: string, abbr: string | null, name: string): boolean {
  const target = boardTeam.trim().toLowerCase();
  if (!target) return false;
  if (abbr && abbr.trim().toLowerCase() === target) return true;
  const fullName = name.trim().toLowerCase();
  return fullName === target || fullName.includes(target) || target.includes(fullName);
}

/** "3 – 5" when the game has actually started, otherwise null. */
export function liveScoreLabel(live: GameLiveState | null): string | null {
  if (!live?.hasRuns) return null;
  return `${live.awayScore} – ${live.homeScore}`;
}

/** Short status chip text: the inning label, "Final", or the scheduled status. */
export function liveStatusLabel(live: GameLiveState | null): string | null {
  if (!live) return null;
  if (live.isFinal) return 'Final';
  if (live.isLive) return live.label?.trim() || 'Live';
  return live.status?.trim() || null;
}
