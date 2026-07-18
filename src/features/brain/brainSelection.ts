/**
 * @deprecated LEGACY CLIENT PROJECTION — DO NOT IMPORT IN RUNTIME UI.
 *
 * Server selection is authoritative:
 *   server/services/intelligence/centralBrain/selectionPolicy.ts
 *   server/services/intelligence/centralBrain/brainLedgerService.ts
 *
 * Kept only so offline policy-comparison tests can still assert historical
 * client heuristics. BrainPicksPage must never call this.
 */

import type { HrWatchRow } from '../hr/types/hrWatch';

export type BrainPickTag = {
  label: string;
  tone: 'positive' | 'neutral' | 'warning';
};

export type BrainPick = {
  player: HrWatchRow;
  selectionScore: number;
  slatePercentile: number;
  tags: BrainPickTag[];
  explanation: string;
  evidenceQuality: 'official' | 'preview';
};

const numeric = (value: number | null | undefined, fallback = 50) =>
  Number.isFinite(value) ? Number(value) : fallback;

function selectionScore(row: HrWatchRow): number {
  const score =
    numeric(row.hrScore) * 0.38 +
    numeric(row.hitterPower) * 0.18 +
    numeric(row.pitcherVulnerability) * 0.18 +
    numeric(row.recentForm) * 0.12 +
    numeric(row.parkFactor) * 0.07 +
    numeric(row.dataConfidence) * 0.07;

  const missingPitcherPenalty = row.pitcherName ? 0 : 12;
  const previewPenalty = row.truthStatus === 'official' ? 0 : 6;
  return Math.max(0, Math.min(100, Math.round(score - missingPitcherPenalty - previewPenalty)));
}

function buildTags(row: HrWatchRow): BrainPickTag[] {
  const tags: BrainPickTag[] = [];
  if (row.truthStatus === 'official') tags.push({ label: 'Official lineup', tone: 'positive' });
  else tags.push({ label: 'Preview only', tone: 'warning' });
  if (numeric(row.hitterPower, 0) >= 75) tags.push({ label: 'Top power', tone: 'positive' });
  if (numeric(row.pitcherVulnerability, 0) >= 68) tags.push({ label: 'Pitcher target', tone: 'positive' });
  if (numeric(row.recentForm, 0) >= 70) tags.push({ label: 'Form rising', tone: 'positive' });
  if (numeric(row.parkFactor, 100) >= 105) tags.push({ label: 'Park boost', tone: 'neutral' });
  if (numeric(row.dataConfidence, 0) < 65) tags.push({ label: 'Evidence caution', tone: 'warning' });
  return tags.slice(0, 4);
}

function explain(row: HrWatchRow, percentile: number): string {
  const strengths = [
    { label: `power ${numeric(row.hitterPower)}/100`, value: numeric(row.hitterPower) },
    { label: `pitcher vulnerability ${numeric(row.pitcherVulnerability)}/100`, value: numeric(row.pitcherVulnerability) },
    { label: `recent form ${numeric(row.recentForm)}/100`, value: numeric(row.recentForm) },
    { label: `park factor ${numeric(row.parkFactor, 100)}`, value: numeric(row.parkFactor, 100) - 30 },
  ].sort((a, b) => b.value - a.value).slice(0, 2);

  const pitcher = row.pitcherName || 'the listed opposing pitcher';
  return `${row.playerName} ranks in the ${percentile}th percentile of today's eligible slate. ` +
    `The strongest evidence is ${strengths[0].label} and ${strengths[1].label} against ${pitcher}. ` +
    `${row.truthStatus === 'official' ? 'The batting order is official.' : 'The lineup is still a preview, so this selection can change.'}`;
}

/** @deprecated Use server selectionPolicy / getBrainMlbPicksForDate instead. */
export function selectBrainPicks(rows: HrWatchRow[], limit = 12): BrainPick[] {
  const ranked = rows
    .filter((row) => row.riskTier !== 'Blocked')
    .map((row) => ({ row, score: selectionScore(row) }))
    .filter(({ row, score }) => {
      const primaryTier = row.riskTier === 'Elite' || row.riskTier === 'Core';
      const exceptionalWatch = row.riskTier === 'Watch' && score >= 74;
      return (primaryTier || exceptionalWatch || score >= 55) && score >= 55 && numeric(row.dataConfidence, 0) >= 55;
    })
    .sort((a, b) => b.score - a.score || numeric(a.row.rank, 999) - numeric(b.row.rank, 999));

  const official = ranked.filter(({ row }) => row.truthStatus === 'official');
  const pool = official.length >= 10 ? official : ranked;
  const perGame = new Map<string, number>();
  const perTeam = new Map<string, number>();
  const chosen: Array<{ row: HrWatchRow; score: number }> = [];

  for (const maxPerTeam of [1, 2]) {
    for (const candidate of pool) {
      if (chosen.some((item) => item.row.stableId === candidate.row.stableId)) continue;
      const gameKey = String(candidate.row.gamePk ?? `${candidate.row.team}:${candidate.row.opponent}`);
      const teamKey = candidate.row.team;
      if ((perGame.get(gameKey) ?? 0) >= 2 || (perTeam.get(teamKey) ?? 0) >= maxPerTeam) continue;
      chosen.push(candidate);
      perGame.set(gameKey, (perGame.get(gameKey) ?? 0) + 1);
      perTeam.set(teamKey, (perTeam.get(teamKey) ?? 0) + 1);
      if (chosen.length >= limit) break;
    }
    if (chosen.length >= 10) break;
  }

  return chosen.map(({ row, score }) => {
    const below = ranked.filter((candidate) => candidate.score <= score).length;
    const percentile = ranked.length ? Math.max(1, Math.round((below / ranked.length) * 100)) : 1;
    return {
      player: row,
      selectionScore: score,
      slatePercentile: percentile,
      tags: buildTags(row),
      explanation: explain(row, percentile),
      evidenceQuality: row.truthStatus === 'official' ? 'official' : 'preview',
    };
  });
}
