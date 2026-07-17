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

export interface HrGameMapGroup {
  key: string;
  gamePk: string | number | null;
  awayTeam: string;
  homeTeam: string;
  awayLogoUrl: string | null;
  homeLogoUrl: string | null;
  venue: string | null;
  gameTime: string | null;
  rows: HrWatchRow[];
  confirmedCount: number;
  averageScore: number;
}

export interface HrSignalPoint {
  row: HrWatchRow;
  anchorX: number;
  anchorY: number;
  x: number;
  y: number;
  radius: number;
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

function gameKey(row: HrWatchRow): string {
  if (row.gamePk != null && String(row.gamePk).trim()) return `game-${row.gamePk}`;
  return [row.team, row.opponent].sort().join('-').toLowerCase().replace(/[^a-z0-9-]+/g, '-');
}

export function buildHrGameMapGroups(rows: HrWatchRow[]): HrGameMapGroup[] {
  const grouped = new Map<string, HrWatchRow[]>();

  rows.forEach((row) => {
    const key = gameKey(row);
    grouped.set(key, [...(grouped.get(key) ?? []), row]);
  });

  return Array.from(grouped, ([key, gameRows]) => {
    const sortedRows = [...gameRows].sort((a, b) => b.hrScore - a.hrScore);
    const first = sortedRows[0];
    const opponentRow = sortedRows.find((row) => row.team === first.opponent);
    const totalScore = sortedRows.reduce((total, row) => total + row.hrScore, 0);

    return {
      key,
      gamePk: first.gamePk,
      awayTeam: first.team,
      homeTeam: first.opponent,
      awayLogoUrl: first.teamLogoUrl,
      homeLogoUrl: opponentRow?.teamLogoUrl ?? first.opponentLogoUrl,
      venue: first.venue ?? null,
      gameTime: first.gameTime,
      rows: sortedRows,
      confirmedCount: sortedRows.filter((row) => row.truthStatus === 'official').length,
      averageScore: sortedRows.length > 0 ? totalScore / sortedRows.length : 0,
    };
  }).sort((a, b) => b.averageScore - a.averageScore);
}

export function buildHrSignalPoints(
  rows: HrWatchRow[],
  width: number,
  height: number,
): { points: HrSignalPoint[]; omitted: HrWatchRow[] } {
  const omitted: HrWatchRow[] = [];
  const points: HrSignalPoint[] = [];
  const left = 76;
  const right = 36;
  const top = 38;
  const bottom = 62;

  rows.forEach((row) => {
    if (row.hitterPower == null || row.pitcherVulnerability == null) {
      omitted.push(row);
      return;
    }

    const power = Math.max(0, Math.min(100, row.hitterPower));
    const pitcher = Math.max(0, Math.min(100, row.pitcherVulnerability));
    const anchorX = left + (pitcher / 100) * (width - left - right);
    const anchorY = top + ((100 - power) / 100) * (height - top - bottom);
    points.push({
      row,
      anchorX,
      anchorY,
      x: anchorX,
      y: anchorY,
      radius: 23 + (Math.max(0, Math.min(100, row.hrScore)) / 100) * 11,
    });
  });

  // Preserve the truthful anchor while offsetting identical inputs into a
  // selectable cluster. The UI draws a connector back to the exact value.
  const clusters = new Map<string, HrSignalPoint[]>();
  points.forEach((point) => {
    const key = `${Math.round(point.anchorX / 12)}:${Math.round(point.anchorY / 12)}`;
    clusters.set(key, [...(clusters.get(key) ?? []), point]);
  });
  clusters.forEach((cluster) => {
    if (cluster.length < 2) return;
    cluster.forEach((point, index) => {
      const ring = Math.floor(index / 6) + 1;
      const position = index % 6;
      const angle = (-Math.PI / 2) + position * (Math.PI / 3) + (ring % 2 ? 0 : Math.PI / 6);
      const distance = 38 + ring * 18;
      point.x = Math.max(left + point.radius, Math.min(width - right - point.radius, point.anchorX + Math.cos(angle) * distance));
      point.y = Math.max(top + point.radius, Math.min(height - bottom - point.radius, point.anchorY + Math.sin(angle) * distance));
    });
  });

  // Resolve collisions across neighboring metric clusters while applying a
  // light pull toward each true anchor. This keeps dense slates readable.
  for (let iteration = 0; iteration < 90; iteration += 1) {
    points.forEach((point) => {
      point.x += (point.anchorX - point.x) * 0.018;
      point.y += (point.anchorY - point.y) * 0.018;
    });
    for (let index = 0; index < points.length; index += 1) {
      for (let otherIndex = index + 1; otherIndex < points.length; otherIndex += 1) {
        const point = points[index];
        const other = points[otherIndex];
        let dx = other.x - point.x;
        let dy = other.y - point.y;
        let distance = Math.hypot(dx, dy);
        const minimum = point.radius + other.radius + 12;
        if (distance >= minimum) continue;
        if (distance < 0.01) {
          dx = index % 2 === 0 ? 1 : -1;
          dy = 1;
          distance = Math.SQRT2;
        }
        const push = (minimum - distance) / 2;
        point.x -= (dx / distance) * push;
        point.y -= (dy / distance) * push;
        other.x += (dx / distance) * push;
        other.y += (dy / distance) * push;
      }
    }
    points.forEach((point) => {
      point.x = Math.max(left + point.radius, Math.min(width - right - point.radius, point.x));
      point.y = Math.max(top + point.radius, Math.min(height - bottom - point.radius, point.y));
    });
  }

  return { points, omitted };
}
