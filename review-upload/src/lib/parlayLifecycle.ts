/**
 * Parlay lifecycle engine — sport-agnostic.
 *
 * A parlay flows: UPCOMING → LIVE → FINAL, derived purely from its legs'
 * game start times, the current time, and grading status. The same engine
 * powers MLB today and NBA/NFL later — those sports just supply each leg's
 * `gameStartTime` + `gamePk` the same way.
 *
 *   UPCOMING : visible in Picks. Game hasn't hit the lock window yet.
 *   LIVE     : within LOCK_MINUTES of the earliest game start (or in progress).
 *              Hidden from Picks, shown in Live Parlays.
 *   FINAL    : graded (WON/LOST/VOID) → shown in Results.
 */

import type { Parlay, ParlayLifecycle } from '../types';

/** Picks lock this many minutes before the earliest game starts. */
export const LOCK_MINUTES = 30;

/** Earliest game start time across a parlay's legs, or null if unknown. */
export function earliestStart(parlay: Parlay): Date | null {
  const times = (parlay.legs || [])
    .map((l) => l.gameStartTime)
    .filter(Boolean)
    .map((t) => new Date(t as string))
    .filter((d) => !isNaN(d.getTime()));
  if (times.length === 0) return null;
  return new Date(Math.min(...times.map((d) => d.getTime())));
}

/** The lock instant: earliest start − LOCK_MINUTES. Null if start unknown. */
export function lockTime(parlay: Parlay): Date | null {
  if (parlay.lockAt) {
    const d = new Date(parlay.lockAt);
    if (!isNaN(d.getTime())) return d;
  }
  const start = earliestStart(parlay);
  if (!start) return null;
  return new Date(start.getTime() - LOCK_MINUTES * 60_000);
}

/** Compute the lifecycle bucket for a parlay at time `now`. */
export function getLifecycle(parlay: Parlay, now: Date = new Date()): ParlayLifecycle {
  // Settled parlays are final regardless of clock.
  if (parlay.status === 'WON' || parlay.status === 'LOST' || parlay.status === 'VOID') {
    return 'final';
  }
  const lock = lockTime(parlay);
  // No known start time → keep it visible in Picks (can't lock what we can't time).
  if (!lock) return 'upcoming';
  return now.getTime() >= lock.getTime() ? 'live' : 'upcoming';
}

export const isUpcoming = (p: Parlay, now?: Date) => getLifecycle(p, now) === 'upcoming';
export const isLive = (p: Parlay, now?: Date) => getLifecycle(p, now) === 'live';
export const isFinal = (p: Parlay, now?: Date) => getLifecycle(p, now) === 'final';

/** Split a list of parlays into the three lifecycle buckets. */
export function bucketParlays(parlays: Parlay[], now: Date = new Date()): Record<ParlayLifecycle, Parlay[]> {
  const out: Record<ParlayLifecycle, Parlay[]> = { upcoming: [], live: [], final: [] };
  for (const p of parlays) out[getLifecycle(p, now)].push(p);
  return out;
}

/** Human countdown until lock, e.g. "locks in 2h 14m" or "locked". */
export function lockCountdown(parlay: Parlay, now: Date = new Date()): string {
  const lock = lockTime(parlay);
  if (!lock) return 'start time TBD';
  const ms = lock.getTime() - now.getTime();
  if (ms <= 0) return 'locked';
  const mins = Math.floor(ms / 60_000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `locks in ${h}h ${m}m` : `locks in ${m}m`;
}


/**
 * More detailed display status for UI cards.
 * Keeps bucketParlays simple, but gives the user clearer wording.
 */
export type ParlayDisplayStatus =
  | 'not_started'
  | 'locked'
  | 'live'
  | 'ready_to_grade'
  | 'won'
  | 'lost'
  | 'void'
  | 'time_tbd';

export function getDisplayStatus(parlay: Parlay, now: Date = new Date()): ParlayDisplayStatus {
  if (parlay.status === 'WON') return 'won';
  if (parlay.status === 'LOST') return 'lost';
  if (parlay.status === 'VOID') return 'void';

  const start = earliestStart(parlay);
  const lock = lockTime(parlay);

  if (!start || !lock) return 'time_tbd';

  const startMs = start.getTime();
  const lockMs = lock.getTime();
  const nowMs = now.getTime();

  // Assume baseball game is ready to grade around 4 hours after first pitch.
  // Later we can replace this with real MLB final game status.
  const estimatedFinalMs = startMs + 4 * 60 * 60 * 1000;

  if (nowMs < lockMs) return 'not_started';
  if (nowMs >= lockMs && nowMs < startMs) return 'locked';
  if (nowMs >= startMs && nowMs < estimatedFinalMs) return 'live';

  return 'ready_to_grade';
}

export function displayStatusLabel(status: ParlayDisplayStatus): string {
  switch (status) {
    case 'not_started':
      return 'Not started';
    case 'locked':
      return 'Locked';
    case 'live':
      return 'Live now';
    case 'ready_to_grade':
      return 'Ready to grade';
    case 'won':
      return 'Won';
    case 'lost':
      return 'Lost';
    case 'void':
      return 'Void';
    case 'time_tbd':
    default:
      return 'Start time TBD';
  }
}
