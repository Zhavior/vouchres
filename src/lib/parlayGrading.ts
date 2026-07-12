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
import { apiClient } from './apiClient';
import { toDecimalOrNull } from './odds';

const GRADE_SPORTS = new Set(['mlb', 'nba', 'nfl']);

export interface GradeRequest {
  legs: Array<{
    sport: 'mlb' | 'nba' | 'nfl';
    gamePk: string;
    market: string;
    selection: string;
    threshold?: number;
    oddsDecimal?: number;
  }>;
  stakeUnits: number;
}

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

export function buildGradeRequest(p: Parlay): GradeRequest | null {
  const legs: GradeRequest['legs'] = [];

  for (const leg of p.legs || []) {
    const sport = String(leg.sport || 'mlb').trim().toLowerCase();
    const gamePk = String(leg.gamePk ?? '').trim();
    const market = String(leg.marketCode ?? '').trim().toLowerCase();
    const selection = String(leg.selection ?? '').trim();
    if (!GRADE_SPORTS.has(sport) || !gamePk || !market || !selection) continue;

    const threshold = Number(leg.statTarget ?? leg.threshold);
    const oddsDecimal = toDecimalOrNull(leg.odds);
    legs.push({
      sport: sport as GradeRequest['legs'][number]['sport'],
      gamePk,
      market,
      selection,
      ...(Number.isFinite(threshold) ? { threshold } : {}),
      ...(oddsDecimal !== null ? { oddsDecimal } : {}),
    });

    if (legs.length === 12) break;
  }

  if (legs.length === 0) return null;
  const rawStake = Number(p.wagerAmount);
  const stakeUnits = Number.isFinite(rawStake) && rawStake > 0 && rawStake <= 100000
    ? rawStake
    : 1;
  return { legs, stakeUnits };
}

/** A parlay can be graded once at least one leg has a contract-valid grading identity. */
export function parlayIsGradable(p: Parlay): boolean {
  return buildGradeRequest(p) !== null;
}

/** Grade a single parlay against the live feed. Returns null if not gradable. */
export async function gradeParlay(p: Parlay): Promise<GradeResponse | null> {
  const request = buildGradeRequest(p);
  if (!request) return null;

  try {
    const data = await apiClient.post<GradeResponse>('/api/parlays/grade', request);
    return data;
  } catch (err) {
    console.warn("[parlayGrading] grade request failed", err);
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
