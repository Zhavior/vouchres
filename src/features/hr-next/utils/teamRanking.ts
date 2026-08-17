import type { HrWatchRow } from '../../hr/types/hrWatch';
import { logoByTeamName } from '../../../lib/teamLogos';
import { toHrpi, tierForScore, type HrNextTierDef } from './tierPartition';

/**
 * Team-level HR power rankings derived strictly from typed `HrWatchRow` fields.
 *
 * Same contract as `slateTelemetry`: every metric can report "unavailable".
 * Nothing here fabricates a probability, an odds price, or a lineup the
 * pipeline did not publish.
 */

/** Rows at or above this HRPI count toward a stack's depth score. */
const DEPTH_HRPI_FLOOR = 70;
/** Depth saturates here — a sixth 70+ bat does not keep raising the rating. */
const DEPTH_SATURATION = 5;
/** Bats averaged into the stack's headline strength number. */
const TOP_N = 3;

export type TeamRankBasis = 'xhr' | 'rating';

export interface TeamStackRanking {
  rank: number;
  team: string;
  teamLogoUrl: string | null;
  opponent: string;
  opponentLogoUrl: string | null;
  /** True when the venue string identifies this team's park, null when undecidable. */
  isHome: boolean | null;
  gameTime: string | null;
  venue: string | null;
  pitcherName: string | null;
  /** Batters on this team, sorted by HRPI descending. */
  rows: HrWatchRow[];
  batters: number;
  topHrpi: number;
  /** Mean HRPI of the top three bats (or fewer when the team has fewer rows). */
  topAvgHrpi: number;
  depthCount: number;
  /** Published composite — see `STACK_RATING_METHODOLOGY`. */
  stackRating: number;
  /** Σ of published model HR probabilities, expressed as expected home runs. */
  expectedHr: number | null;
  /** How many of this team's rows carried a model HR probability. */
  pricedRows: number;
  /** Best model-vs-book divergence on the team, null when no row is priced. */
  bestEvPct: number | null;
  bestEvPlayer: string | null;
  confirmedRows: number;
  parkIndex: number | null;
  tier: HrNextTierDef;
}

export interface TeamRankings {
  teams: TeamStackRanking[];
  /**
   * `xhr` when every ranked team has a model probability on every batter, so
   * expected home runs can order the board honestly. `rating` otherwise.
   */
  basis: TeamRankBasis;
  /** Rows in the pool that carried a model HR probability. */
  pricedRows: number;
  totalRows: number;
}

export const STACK_RATING_METHODOLOGY =
  'Stack Rating = 65% mean HRPI of the team\'s top 3 bats + 35% lineup depth (bats at 70+ HRPI, saturating at 5). HRPI is the published board score.';

export const XHR_METHODOLOGY =
  'Expected HR is the sum of the board\'s published per-batter HR probabilities. Batters the pipeline did not price are excluded and counted separately.';

function evEdgeFor(row: HrWatchRow): number | null {
  const model = typeof row.hrProbability === 'number' && Number.isFinite(row.hrProbability)
    ? row.hrProbability
    : null;
  const implied = typeof row.impliedProbability === 'number' && Number.isFinite(row.impliedProbability)
    ? row.impliedProbability
    : null;
  if (model == null || implied == null || implied <= 0) return null;
  return Math.round(((model - implied) / implied) * 1000) / 10;
}

function modelProbFor(row: HrWatchRow): number | null {
  return typeof row.hrProbability === 'number' && Number.isFinite(row.hrProbability)
    ? row.hrProbability
    : null;
}

function parkIndexFor(row: HrWatchRow): number | null {
  if (typeof row.parkIndex === 'number' && Number.isFinite(row.parkIndex)) return row.parkIndex;
  if (typeof row.parkFactor === 'number' && Number.isFinite(row.parkFactor)) return row.parkFactor;
  return null;
}

/** Stable key for a game, matching the shell's matchup slider key. */
export function matchupKeyFor(row: HrWatchRow): string {
  const [first, second] = [row.team, row.opponent].sort();
  return `${first}_vs_${second}`;
}

export function buildTeamRankings(rows: HrWatchRow[]): TeamRankings {
  const byTeam = new Map<string, HrWatchRow[]>();
  let pricedRows = 0;

  for (const row of rows) {
    const team = row.team?.trim();
    if (!team) continue;
    if (modelProbFor(row) != null) pricedRows += 1;
    const bucket = byTeam.get(team);
    if (bucket) bucket.push(row);
    else byTeam.set(team, [row]);
  }

  const teams: TeamStackRanking[] = [];

  byTeam.forEach((teamRows, team) => {
    const sorted = [...teamRows].sort((left, right) => right.hrScore - left.hrScore);
    const leader = sorted[0];

    const topSlice = sorted.slice(0, TOP_N);
    const topAvgHrpi = Math.round(
      topSlice.reduce((sum, row) => sum + toHrpi(row.hrScore), 0) / topSlice.length,
    );
    const topHrpi = toHrpi(leader.hrScore);
    const depthCount = sorted.filter((row) => toHrpi(row.hrScore) >= DEPTH_HRPI_FLOOR).length;
    const depthScore = (Math.min(depthCount, DEPTH_SATURATION) / DEPTH_SATURATION) * 100;
    const stackRating = Math.round(topAvgHrpi * 0.65 + depthScore * 0.35);

    let probabilitySum = 0;
    let priced = 0;
    let bestEvPct: number | null = null;
    let bestEvPlayer: string | null = null;
    let confirmedRows = 0;
    let parkIndex: number | null = null;
    let pitcherName: string | null = null;
    let venue: string | null = null;
    let gameTime: string | null = null;

    for (const row of sorted) {
      const prob = modelProbFor(row);
      if (prob != null) {
        probabilitySum += prob;
        priced += 1;
      }
      const edge = evEdgeFor(row);
      if (edge != null && (bestEvPct == null || edge > bestEvPct)) {
        bestEvPct = edge;
        bestEvPlayer = row.playerName;
      }
      if (row.truthStatus === 'official') confirmedRows += 1;
      if (parkIndex == null) parkIndex = parkIndexFor(row);
      if (!pitcherName && row.pitcherName?.trim()) pitcherName = row.pitcherName.trim();
      if (!venue && row.venue?.trim()) venue = row.venue.trim();
      if (!gameTime && row.gameTime) gameTime = row.gameTime;
    }

    const isHome = venue
      ? venue.toLowerCase().includes(team.toLowerCase())
      : null;

    teams.push({
      rank: 0,
      team,
      teamLogoUrl: logoByTeamName(team),
      opponent: leader.opponent?.trim() || 'Opponent unavailable',
      opponentLogoUrl: logoByTeamName(leader.opponent),
      isHome,
      gameTime,
      venue,
      pitcherName,
      rows: sorted,
      batters: sorted.length,
      topHrpi,
      topAvgHrpi,
      depthCount,
      stackRating,
      expectedHr: priced > 0 ? Math.round(probabilitySum * 100) / 100 : null,
      pricedRows: priced,
      bestEvPct,
      bestEvPlayer,
      confirmedRows,
      parkIndex,
      tier: tierForScore(leader.hrScore),
    });
  });

  // Expected home runs only orders the board when every batter on every ranked
  // team carries a published probability. Under partial coverage the sum is a
  // count of priced bats as much as a projection, so the composite ranks instead
  // and the view says so.
  const fullyPriced = teams.length > 0 && teams.every((team) => team.pricedRows === team.batters);
  const basis: TeamRankBasis = fullyPriced ? 'xhr' : 'rating';

  teams.sort((left, right) => {
    if (basis === 'xhr') {
      const delta = (right.expectedHr ?? 0) - (left.expectedHr ?? 0);
      if (Math.abs(delta) > 0.0001) return delta;
    }
    if (right.stackRating !== left.stackRating) return right.stackRating - left.stackRating;
    if (right.topHrpi !== left.topHrpi) return right.topHrpi - left.topHrpi;
    return right.batters - left.batters;
  });

  return {
    teams: teams.map((team, index) => ({ ...team, rank: index + 1 })),
    basis,
    pricedRows,
    totalRows: rows.length,
  };
}
