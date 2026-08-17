import type { HrWatchRow } from '../../hr/types/hrWatch';
import type { HrNextItem } from '../hooks/useHrNextData';

/**
 * HRPI-band tier partitioning for the 4-column desktop grid.
 *
 * The band boundaries are the published spec:
 *   ELITE 90–100 · STRONG 80–89 · VALUE 70–79 · SLEEPER 60–69
 *
 * Rows scoring under 60 are floored into SLEEPER rather than dropped — the
 * board must never silently hide a row the pipeline published.
 */
export type HrNextTierKey = 'elite' | 'strong' | 'value' | 'sleeper';

export interface HrNextTierDef {
  key: HrNextTierKey;
  label: string;
  /** Inclusive lower bound of the HRPI band. */
  floor: number;
  /** Inclusive upper bound of the HRPI band. */
  ceiling: number;
  rangeLabel: string;
  accent: string;
  /** Static Tailwind/arbitrary classes — never build these by interpolation. */
  headerText: string;
  headerDot: string;
  columnBorder: string;
  scoreText: string;
  badge: string;
  cardHover: string;
  proBorder: string;
}

export const HR_NEXT_TIERS: readonly HrNextTierDef[] = [
  {
    key: 'elite',
    label: 'ELITE',
    floor: 90,
    ceiling: 100,
    rangeLabel: '90–100 HRPI',
    accent: '#10B981',
    headerText: 'text-[#10B981]',
    headerDot: 'bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.8)]',
    columnBorder: 'border-[#10B981]/25',
    scoreText: 'text-[#10B981] drop-shadow-[0_0_12px_rgba(16,185,129,0.4)]',
    badge: 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/35',
    cardHover: 'hover:border-[#10B981]/50',
    proBorder: 'border-[#10B981]/25',
  },
  {
    key: 'strong',
    label: 'STRONG',
    floor: 80,
    ceiling: 89,
    rangeLabel: '80–89 HRPI',
    accent: '#6EE7B7',
    headerText: 'text-[#6EE7B7]',
    headerDot: 'bg-[#6EE7B7] shadow-[0_0_8px_rgba(110,231,183,0.8)]',
    columnBorder: 'border-[#6EE7B7]/25',
    scoreText: 'text-[#6EE7B7] drop-shadow-[0_0_12px_rgba(110,231,183,0.4)]',
    badge: 'bg-[#6EE7B7]/15 text-[#6EE7B7] border-[#6EE7B7]/35',
    cardHover: 'hover:border-[#6EE7B7]/50',
    proBorder: 'border-[#6EE7B7]/25',
  },
  {
    key: 'value',
    label: 'VALUE',
    floor: 70,
    ceiling: 79,
    rangeLabel: '70–79 HRPI',
    accent: '#F59E0B',
    headerText: 'text-[#F59E0B]',
    headerDot: 'bg-[#F59E0B] shadow-[0_0_8px_rgba(245,158,11,0.8)]',
    columnBorder: 'border-[#F59E0B]/25',
    scoreText: 'text-[#F59E0B] drop-shadow-[0_0_12px_rgba(245,158,11,0.4)]',
    badge: 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/35',
    cardHover: 'hover:border-[#F59E0B]/50',
    proBorder: 'border-[#F59E0B]/25',
  },
  {
    key: 'sleeper',
    label: 'SLEEPER',
    floor: 0,
    ceiling: 69,
    // The spec band is 60–69; this column is also the floor bucket for anything
    // the pipeline scored under 60, so the label states what it actually holds.
    rangeLabel: '≤69 HRPI',
    accent: '#A855F7',
    headerText: 'text-[#A855F7]',
    headerDot: 'bg-[#A855F7] shadow-[0_0_8px_rgba(168,85,247,0.8)]',
    columnBorder: 'border-[#A855F7]/25',
    scoreText: 'text-[#A855F7] drop-shadow-[0_0_12px_rgba(168,85,247,0.4)]',
    badge: 'bg-[#A855F7]/15 text-[#A855F7] border-[#A855F7]/35',
    cardHover: 'hover:border-[#A855F7]/50',
    proBorder: 'border-[#A855F7]/25',
  },
] as const;

const TIER_BY_KEY: Record<HrNextTierKey, HrNextTierDef> = HR_NEXT_TIERS.reduce(
  (acc, tier) => {
    acc[tier.key] = tier;
    return acc;
  },
  {} as Record<HrNextTierKey, HrNextTierDef>,
);

/** Clamp a raw pipeline hrScore into the 0–100 HRPI display range. */
export function toHrpi(hrScore: number): number {
  if (!Number.isFinite(hrScore)) return 0;
  return Math.max(0, Math.min(100, Math.round(hrScore)));
}

export function tierForScore(hrScore: number): HrNextTierDef {
  const hrpi = toHrpi(hrScore);
  for (const tier of HR_NEXT_TIERS) {
    if (hrpi >= tier.floor) return tier;
  }
  return TIER_BY_KEY.sleeper;
}

export function tierByKey(key: HrNextTierKey): HrNextTierDef {
  return TIER_BY_KEY[key];
}

export type HrNextRowItem = Extract<HrNextItem, { type: 'row' }>;

export interface HrNextTierColumn {
  tier: HrNextTierDef;
  rows: HrNextRowItem[];
}

/**
 * Partition the flat board feed into the four HRPI columns.
 * Header items from the data hook are discarded — the grid supplies its own
 * column headers so the ordering is driven purely by the score band.
 */
export function partitionByTier(items: HrNextItem[]): HrNextTierColumn[] {
  const columns: HrNextTierColumn[] = HR_NEXT_TIERS.map((tier) => ({ tier, rows: [] }));
  const indexByKey = new Map<HrNextTierKey, number>(
    HR_NEXT_TIERS.map((tier, index) => [tier.key, index]),
  );

  for (const item of items) {
    if (item.type !== 'row') continue;
    const target = indexByKey.get(tierForScore(item.row.hrScore).key);
    if (target == null) continue;
    columns[target].rows.push(item);
  }

  for (const column of columns) {
    column.rows.sort((left, right) => right.row.hrScore - left.row.hrScore);
  }

  return columns;
}

export type { HrWatchRow };
