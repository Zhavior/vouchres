import type { Parlay } from '../types';
import { isLive } from './parlayLifecycle';

/**
 * Canonical parlay status used across My Parlays, Results, and the ledger.
 *
 * IMPORTANT: this never invents a result. The top-level `parlay.status`
 * (set by the backend grader) is always authoritative. When it is still
 * PENDING we only *derive* a status from concrete leg evidence:
 *   - any leg LOST  → parlay lost (a parlay dies on its first losing leg)
 *   - all legs WON  → parlay won
 *   - mix of WON + VOID (no pending, no lost) → partially_void
 *   - all VOID      → void
 * If legs are not all decided we keep it pending (or live while the game runs).
 */
export type NormalizedParlayStatus =
  | 'pending'
  | 'live'
  | 'won'
  | 'lost'
  | 'void'
  | 'partially_void';

export function normalizeParlayStatus(p: Parlay, now: Date = new Date()): NormalizedParlayStatus {
  const top = String(p.status || '').toUpperCase();
  if (top === 'WON') return 'won';
  if (top === 'LOST') return 'lost';
  if (top === 'VOID') return 'void';

  const legStatuses = (p.legs || []).map((l) => String(l.status || 'PENDING').toUpperCase());

  // A losing leg is concrete evidence the parlay is dead.
  if (legStatuses.includes('LOST')) return 'lost';

  const allDecided =
    legStatuses.length > 0 && legStatuses.every((s) => s === 'WON' || s === 'VOID');

  if (allDecided) {
    const anyWon = legStatuses.includes('WON');
    const anyVoid = legStatuses.includes('VOID');
    if (anyWon && anyVoid) return 'partially_void';
    if (anyVoid && !anyWon) return 'void';
    return 'won';
  }

  // Not all legs decided — never invent a result.
  if (isLive(p, now)) return 'live';
  return 'pending';
}

export function statusLabel(status: NormalizedParlayStatus): string {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'live':
      return 'Live';
    case 'won':
      return 'Won';
    case 'lost':
      return 'Lost';
    case 'void':
      return 'Void';
    case 'partially_void':
      return 'Partial (void)';
  }
}

/** Tailwind chip classes for each normalized status. */
export function statusChipClass(status: NormalizedParlayStatus): string {
  switch (status) {
    case 'won':
      return 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300';
    case 'lost':
      return 'border-rose-500/40 bg-rose-500/15 text-rose-300';
    case 'live':
      return 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200';
    case 'void':
    case 'partially_void':
      return 'border-slate-600 bg-slate-800/60 text-slate-300';
    case 'pending':
    default:
      return 'border-amber-500/30 bg-amber-500/10 text-amber-200';
  }
}

/* ============================================================
   Backend sync status — distinct from grading status.
   Tells the user whether the parlay is safe in Supabase.
   ============================================================ */
export type SyncStatus = 'synced' | 'saving' | 'local_only' | 'failed';

export function getSyncStatus(p: Parlay): SyncStatus {
  if (p.backendSyncState === 'saving') return 'saving';
  if (p.backendSyncState === 'failed') return 'failed';
  if (p.backendPickId && p.backendSyncState === 'synced') return 'synced';
  // auth_required / legal_required / not_syncable / undefined → still only local
  return 'local_only';
}

export function syncStatusLabel(status: SyncStatus): string {
  switch (status) {
    case 'synced':
      return 'Synced';
    case 'saving':
      return 'Saving…';
    case 'local_only':
      return 'Local only';
    case 'failed':
      return 'Sync failed';
  }
}
