/**
 * Client-side parlay grading — calls the stateless POST /api/parlays/grade
 * endpoint (which grades against the live sport feed) and merges results back
 * into the local Parlay objects. This is the bridge that connects saved
 * parlays → MLB outcomes → Results.
 *
 * Wire-compatible with the production Supabase pipeline: the same leg shape
 * ({ sport, gamePk, market, selection }) is what POST /api/parlays expects.
 */

import type { Parlay, Leg } from '../types';

export interface GradedLeg {
  sport: string;
  gamePk: string;
  market: string;
  selection: string;
  oddsDecimal: number | null;
  status: 'won' | 'lost' | 'push' | 'pending' | 'error';
  actual: number | null;
  note: string | null;
}

export interface GradeResponse {
  legs: GradedLeg[];
  parlay: {
    status: 'won' | 'lost' | 'push' | 'pending' | 'error';
    settledUnits: number | null;
    combinedOdds: number | null;
    note: string;
  };
  gradedAt: string;
}

const LEG_STATUS: Record<string, Leg['status']> = {
  won: 'WON', lost: 'LOST', push: 'VOID', pending: 'PENDING', error: 'PENDING',
};
const PARLAY_STATUS: Record<string, Parlay['status']> = {
  won: 'WON', lost: 'LOST', push: 'VOID', pending: 'PENDING', error: 'PENDING',
};

/** A parlay can be graded once at least one leg carries a gamePk + marketCode. */
export function parlayIsGradable(p: Parlay): boolean {
  return (p.legs || []).some((l) => l.gamePk && l.marketCode);
}

/** Grade a single parlay against the live feed. Returns null if not gradable. */
export async function gradeParlay(p: Parlay): Promise<GradeResponse | null> {
  const legs = (p.legs || [])
    .filter((l) => l.gamePk && l.marketCode)
    .map((l) => ({
      sport: (l.sport || 'mlb').toLowerCase(),
      gamePk: String(l.gamePk),
      market: l.marketCode as string,
      selection: l.selection,
      threshold: l.threshold,
      oddsDecimal: l.odds,
    }));
  if (legs.length === 0) return null;

  try {
    const res = await fetch('/api/parlays/grade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ legs, stakeUnits: p.wagerAmount ?? 1 }),
    });
    if (!res.ok) return null;
    return (await res.json()) as GradeResponse;
  } catch {
    return null;
  }
}

/** Merge a grade response back into a parlay (leg statuses, overall status, payout). */
export function applyGrade(p: Parlay, g: GradeResponse): Parlay {
  const bySelection = new Map(g.legs.map((l) => [l.selection, l]));
  const legs = (p.legs || []).map((l) => {
    const graded = bySelection.get(l.selection);
    if (!graded) return l;
    return { ...l, status: LEG_STATUS[graded.status] ?? l.status, actual: graded.actual };
  });
  return {
    ...p,
    legs,
    status: PARLAY_STATUS[g.parlay.status] ?? p.status,
    payoutAmount: g.parlay.settledUnits ?? p.payoutAmount,
  };
}

export interface GradeBatchResult {
  parlays: Parlay[];
  /** Parlays that transitioned PENDING → settled this run (for stat updates). */
  newlySettled: Array<{ before: Parlay; after: Parlay; settledUnits: number }>;
  changed: boolean;
}

/**
 * Grade every pending+gradable parlay in a list. Returns the updated list plus
 * which parlays newly settled (so the caller can update profile win/loss/units).
 */
export async function gradePendingParlays(parlays: Parlay[]): Promise<GradeBatchResult> {
  const out: Parlay[] = [];
  const newlySettled: GradeBatchResult['newlySettled'] = [];
  let changed = false;

  for (const p of parlays) {
    const wasPending = (p.status ?? 'PENDING') === 'PENDING';
    if (!wasPending || !parlayIsGradable(p)) {
      out.push(p);
      continue;
    }
    const grade = await gradeParlay(p);
    if (!grade) {
      out.push(p);
      continue;
    }
    const updated = applyGrade(p, grade);
    if (updated.status !== p.status) {
      changed = true;
      if (updated.status === 'WON' || updated.status === 'LOST') {
        newlySettled.push({ before: p, after: updated, settledUnits: grade.parlay.settledUnits ?? 0 });
      }
    }
    out.push(updated);
  }

  return { parlays: out, newlySettled, changed };
}
