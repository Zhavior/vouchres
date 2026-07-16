import type { HrWatchRow } from '../../types/hrWatch';

export const HR_TABLE_TIERS = ['Elite', 'Strong', 'Watch', 'Sleeper'] as const;

export type HrTableTier = (typeof HR_TABLE_TIERS)[number];

export interface HrMatchupGroup {
  key: string;
  primaryTeam: string;
  opponent: string;
  primaryLogoUrl: string | null;
  opponentLogoUrl: string | null;
  gameTime: string | null;
  venue: string | null;
  rows: HrWatchRow[];
  tierCounts: Record<HrTableTier, number>;
  lineupNotice: string | null;
}

const TIER_BY_RISK: Record<HrWatchRow['riskTier'], HrTableTier | null> = {
  Elite: 'Elite',
  Core: 'Strong',
  Watch: 'Watch',
  Deep: 'Sleeper',
  Blocked: null,
};

const TIER_RANK = new Map(HR_TABLE_TIERS.map((tier, index) => [tier, index]));
const INTERNAL_LANGUAGE = /\b(roster|registry|mismatch|backend|pipeline|validator|upstream|assignment)\b/i;
const SHARED_LINEUP_LANGUAGE = /\b(projected lineup|lineup (?:is )?(?:not )?confirmed|official (?:lineup|batting order)|batting order (?:is )?(?:not )?posted)\b/i;

function finiteMetric(value: number | null | undefined): number | null {
  return value == null || !Number.isFinite(value) ? null : Math.round(value);
}

function firstPublicText(values: readonly string[], excludeSharedLineup = false): string | null {
  return values.find((value) => {
    const text = value.trim();
    return text.length > 0 && !INTERNAL_LANGUAGE.test(text) && (!excludeSharedLineup || !SHARED_LINEUP_LANGUAGE.test(text));
  })?.trim() ?? null;
}

export function getHrTableReason(row: HrWatchRow): string {
  const factors = [
    finiteMetric(row.hitterPower) == null ? null : `power ${finiteMetric(row.hitterPower)}`,
    finiteMetric(row.pitcherVulnerability) == null ? null : `pitcher matchup ${finiteMetric(row.pitcherVulnerability)}`,
    finiteMetric(row.parkFactor) == null ? null : `park ${finiteMetric(row.parkFactor)}`,
    finiteMetric(row.recentForm) == null ? null : `recent form ${finiteMetric(row.recentForm)}`,
  ].filter((value): value is string => Boolean(value));

  if (factors.length > 0) {
    const pitcher = row.pitcherName?.trim() && row.pitcherName !== 'Pitcher TBD' ? ` vs ${row.pitcherName.trim()}` : '';
    return `Today's signal combines ${factors.slice(0, 3).join(', ')}${pitcher}.`;
  }

  const suppliedReason = firstPublicText(row.reasons);
  return suppliedReason ? `Today's matchup signal: ${suppliedReason}` : 'Today\'s matchup inputs are limited; open the player research view before deciding.';
}

export function getHrTableRisk(row: HrWatchRow): string {
  const suppliedRisk = firstPublicText(row.warnings, true);
  if (suppliedRisk) return suppliedRisk;

  const confidence = finiteMetric(row.dataConfidence);
  if (confidence != null && confidence < 65) return `Player data confidence is limited at ${confidence}/100.`;

  const pitcherMatchup = finiteMetric(row.pitcherVulnerability);
  if (pitcherMatchup != null && pitcherMatchup < 60) return `The pitcher matchup is this player's weakest signal at ${pitcherMatchup}/100.`;

  return 'No player-specific risk is flagged; review the expanded matchup inputs before deciding.';
}

function matchupLineupNotice(rows: readonly HrWatchRow[]): string | null {
  const projectedCount = rows.filter((row) => row.truthStatus === 'projected').length;
  const unverifiedCount = rows.filter((row) => row.truthStatus === 'unknown').length;
  if (projectedCount > 0) {
    return `${projectedCount} projected player${projectedCount === 1 ? '' : 's'}; official batting order not posted.`;
  }
  if (unverifiedCount > 0) {
    return `${unverifiedCount} player lineup status${unverifiedCount === 1 ? '' : 'es'} still unverified.`;
  }
  return null;
}

export function getHrTableTier(row: Pick<HrWatchRow, 'riskTier'>): HrTableTier | null {
  return TIER_BY_RISK[row.riskTier];
}

function matchupKey(row: HrWatchRow): string {
  if (row.gamePk != null && String(row.gamePk).trim()) return `game-${row.gamePk}`;
  return `matchup-${[row.team, row.opponent].map((team) => team.trim().toUpperCase()).sort().join('-')}`;
}

function rowOrder(left: HrWatchRow, right: HrWatchRow): number {
  const leftTier = getHrTableTier(left);
  const rightTier = getHrTableTier(right);
  const tierDelta = (TIER_RANK.get(leftTier ?? 'Sleeper') ?? 99) - (TIER_RANK.get(rightTier ?? 'Sleeper') ?? 99);
  if (tierDelta !== 0) return tierDelta;
  if (right.hrScore !== left.hrScore) return right.hrScore - left.hrScore;
  return left.playerName.localeCompare(right.playerName);
}

function groupOrder(left: HrMatchupGroup, right: HrMatchupGroup): number {
  const leftTime = left.gameTime ? Date.parse(left.gameTime) : Number.POSITIVE_INFINITY;
  const rightTime = right.gameTime ? Date.parse(right.gameTime) : Number.POSITIVE_INFINITY;
  if (Number.isFinite(leftTime) || Number.isFinite(rightTime)) {
    const timeDelta = leftTime - rightTime;
    if (timeDelta !== 0) return timeDelta;
  }
  return (right.rows[0]?.hrScore ?? 0) - (left.rows[0]?.hrScore ?? 0);
}

export function buildHrMatchupGroups(rows: readonly HrWatchRow[]): HrMatchupGroup[] {
  const groups = new Map<string, HrWatchRow[]>();

  for (const row of rows) {
    if (!getHrTableTier(row)) continue;
    const key = matchupKey(row);
    const current = groups.get(key);
    if (current) current.push(row);
    else groups.set(key, [row]);
  }

  return [...groups.entries()].map(([key, groupRows]) => {
    const sortedRows = [...groupRows].sort(rowOrder);
    const first = sortedRows[0];
    const reverseSide = sortedRows.find((row) => row.team === first.opponent && row.opponent === first.team);
    const tierCounts = Object.fromEntries(HR_TABLE_TIERS.map((tier) => [tier, 0])) as Record<HrTableTier, number>;

    for (const row of sortedRows) {
      const tier = getHrTableTier(row);
      if (tier) tierCounts[tier] += 1;
    }

    return {
      key,
      primaryTeam: first.team,
      opponent: first.opponent,
      primaryLogoUrl: first.teamLogoUrl ?? reverseSide?.opponentLogoUrl ?? null,
      opponentLogoUrl: first.opponentLogoUrl ?? reverseSide?.teamLogoUrl ?? null,
      gameTime: first.gameTime,
      venue: first.venue ?? null,
      rows: sortedRows,
      tierCounts,
      lineupNotice: matchupLineupNotice(sortedRows),
    };
  }).sort(groupOrder);
}
