import type { HrBuckets } from '../../hooks/useHrBoardViewModel';
import type { HrWatchRow } from '../../types/hrWatch';

export interface HrTeamMapGroup {
  team: string;
  logoUrl: string | null;
  rows: HrWatchRow[];
  totalScore: number;
  averageScore: number;
  topPlayer: HrWatchRow;
}

const TIER_ORDER: Array<keyof HrBuckets> = ['Elite', 'Strong', 'Watch', 'Sleepers'];

export function flattenHrMapRows(buckets: HrBuckets): HrWatchRow[] {
  const seen = new Set<string>();

  return TIER_ORDER.flatMap((tier) => buckets[tier]).filter((row) => {
    if (seen.has(row.stableId)) return false;
    seen.add(row.stableId);
    return true;
  });
}

export function buildHrTeamMapGroups(rows: HrWatchRow[]): HrTeamMapGroup[] {
  const grouped = new Map<string, HrWatchRow[]>();

  rows.forEach((row) => {
    const team = row.team.trim() || 'Unknown';
    const current = grouped.get(team) ?? [];
    current.push(row);
    grouped.set(team, current);
  });

  return Array.from(grouped, ([team, teamRows]) => {
    const sortedRows = [...teamRows].sort((a, b) => b.hrScore - a.hrScore);
    const totalScore = sortedRows.reduce((total, row) => total + Math.max(0, row.hrScore), 0);

    return {
      team,
      logoUrl: sortedRows.find((row) => row.teamLogoUrl)?.teamLogoUrl ?? null,
      rows: sortedRows,
      totalScore,
      averageScore: sortedRows.length > 0 ? totalScore / sortedRows.length : 0,
      topPlayer: sortedRows[0],
    };
  }).sort((a, b) => b.totalScore - a.totalScore);
}
