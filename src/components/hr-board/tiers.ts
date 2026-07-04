import type { HrBoardRow } from '../../types/hrBoard';

/** Shared grade-based tier definitions — used both by the cross-game
 *  "By Tier" leaderboard and the per-game Game → Tier → Cards hierarchy. */
export const TIERS: { key: string; title: string; sub: string; color: string; match: (r: HrBoardRow) => boolean }[] = [
  { key: 't1', title: 'Tier 1 — Best HR Targets', sub: 'Elite/strong modeled spots', color: 'hsl(var(--ve-accent-gold))', match: (r) => r.grade === 'A+' || r.grade === 'A' },
  { key: 't2', title: 'Tier 2 — Strong But Riskier', sub: 'Playable with more variance', color: 'hsl(var(--ve-accent-cyan))', match: (r) => r.grade === 'B' },
  { key: 'sneaky', title: 'Sneaky HRs', sub: 'Lower-obvious, higher risk', color: 'hsl(var(--ve-accent-pink))', match: (r) => r.grade === 'C' },
  { key: 'avoid', title: 'Avoid / Trap Picks', sub: 'Weak modeled HR equity', color: '#f87171', match: (r) => r.grade === 'D' || r.grade === 'F' },
];
