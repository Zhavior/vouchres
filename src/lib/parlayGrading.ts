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
import { buildGradeLegPayload, type GradeLegPayload } from './parlays/gradeLegMapper';
import { GradeParlaySchema } from '../../server/validators/parlaySchemas';

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

/** Parlays that failed validation this session — avoids repeated 400 spam. */
const validationBlockedParlayIds = new Set<string>();

function parlayGradeFingerprint(p: Parlay): string {
  const legs = (p.legs || [])
    .map((leg) => buildGradeLegPayload(leg))
    .filter(Boolean)
    .map((leg) => `${leg!.sport}:${leg!.gamePk}:${leg!.market}:${leg!.selection}`)
    .join('|');
  return `${p.id}::${legs}`;
}

function buildGradeRequest(p: Parlay): { legs: GradeLegPayload[]; stakeUnits: number } | null {
  const legs = (p.legs || [])
    .map((l) => buildGradeLegPayload(l))
    .filter((leg): leg is NonNullable<typeof leg> => leg != null);
  if (legs.length === 0) return null;

  const stakeUnits = Math.max(1, Number(p.wagerAmount ?? 1) || 1);
  const parsed = GradeParlaySchema.safeParse({ legs, stakeUnits });
  if (!parsed.success) {
    if (import.meta.env.DEV) {
      console.warn('[parlayGrading] skipped invalid grade payload', {
        parlayId: p.id,
        details: parsed.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }
    return null;
  }

  return {
    legs: parsed.data.legs as GradeLegPayload[],
    stakeUnits: parsed.data.stakeUnits,
  };
}

/** A parlay can be graded once at least one leg maps to a valid grade payload. */
export function parlayIsGradable(p: Parlay): boolean {
  return (p.legs || []).some((l) => Boolean(buildGradeLegPayload(l)));
}

/** Grade a single parlay against the live feed. Returns null if not gradable. */
export async function gradeParlay(p: Parlay): Promise<GradeResponse | null> {
  const fingerprint = parlayGradeFingerprint(p);
  if (validationBlockedParlayIds.has(fingerprint)) return null;

  const request = buildGradeRequest(p);
  if (!request) return null;

  try {
    const data = await apiClient.post<GradeResponse>('/api/parlays/grade', request);
    return data;
  } catch (err) {
    const apiErr = err as { code?: string; details?: unknown[]; requestId?: string; status?: number };
    if (apiErr.code === 'validation_error' || apiErr.status === 400) {
      validationBlockedParlayIds.add(fingerprint);
    }
    if (import.meta.env.DEV) {
      console.warn('[parlayGrading] grade request failed', {
        parlayId: p.id,
        requestId: apiErr.requestId,
        code: apiErr.code,
        details: apiErr.details,
      });
    }
    return null;
  }
}

/** Merge a grade response back into a parlay (leg statuses, overall status, payout). */
export function applyGrade(p: Parlay, g: GradeResponse): Parlay {
  const bySelection = new Map(g.legs.map((l) => [l.selection, l]));
  const legs = (p.legs || []).map((l, index) => {
    const graded = g.legs[index] ?? bySelection.get(l.selection);
    if (!graded) return l;
    return { ...l, status: LEG_STATUS[graded.status] ?? l.status, actual: graded.actual ?? l.actual };
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
