import type { ReactNode } from 'react';
import type { AuroraMaxEvidenceItem } from '../../components/aurora-max/AuroraMaxPrimitives';
import type { HrMaxDeskRow } from './mapHrWatchToDesk';

const TONE_RANK: Record<NonNullable<AuroraMaxEvidenceItem['tone']>, number> = {
  confirmed: 4,
  neutral: 3,
  warning: 2,
  missing: 0,
};

export type TicketPip = {
  key: string;
  tone: NonNullable<AuroraMaxEvidenceItem['tone']>;
  label: string;
};

export function evidenceValueText(value: ReactNode): string | null {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return null;
}

/** Matchup already includes the batting team (`NYY @ TOR`). Do not prefix `row.team` again. */
export function deskMatchupLine(row: Pick<HrMaxDeskRow, 'matchupLabel' | 'gameTimeLabel'>): string {
  return `${row.matchupLabel} · ${row.gameTimeLabel}`;
}

function toneRank(tone: AuroraMaxEvidenceItem['tone'] | undefined): number {
  return TONE_RANK[tone ?? 'missing'] ?? 0;
}

/**
 * One glance "why": strongest of the first three evidence layers (power / pitcher / park).
 * Falls back to `row.signal`. Never invents Statcast splits.
 */
export function primaryCatalystLabel(row: HrMaxDeskRow): string {
  const layers = row.evidence.slice(0, 3);
  let best: AuroraMaxEvidenceItem | null = null;
  let bestRank = -1;
  for (const item of layers) {
    const rank = toneRank(item.tone);
    if (rank > bestRank) {
      best = item;
      bestRank = rank;
    }
  }
  if (best && bestRank > 0) {
    const value = evidenceValueText(best.value);
    if (value) return `${best.label} · ${value}`;
  }
  return row.signal;
}

export function evidencePips(row: HrMaxDeskRow): TicketPip[] {
  return row.evidence.slice(0, 3).map((item, index) => {
    const value = evidenceValueText(item.value) ?? 'Unavailable';
    return {
      key: `${item.label}-${index}`,
      tone: item.tone ?? 'missing',
      label: `${item.label} ${value}`,
    };
  });
}
