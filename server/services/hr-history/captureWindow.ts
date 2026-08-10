/**
 * Capture-window decision (HR-M1).
 *
 * Pure, so the timing rules can be tested without a database, a clock, or a
 * network. The cron supplies `now`; nothing here reads it.
 *
 * The rules, in priority order:
 *   1. Already captured        -> skip. Idempotency is cheap here and expensive
 *                                 at the database.
 *   2. First pitch has passed  -> skip permanently. A post-first-pitch capture
 *                                 is contaminated by the outcome; no snapshot is
 *                                 strictly better than a dishonest one.
 *   3. Inside the normal window -> capture. Lineups are typically posted here.
 *   4. Inside the fallback window -> capture regardless of lineup confirmation.
 *                                 A projected snapshot is data; a missed slate
 *                                 is gone forever.
 *   5. Otherwise                -> not yet; a later run will pick it up.
 *
 * `forceDryRun` exists only so a single game can be inspected on demand
 * without waiting for its window to open. It relaxes the timing rules and
 * nothing else: the post-first-pitch rule still applies, because a forced
 * inspection of a contaminated snapshot would be worse than useless. The
 * caller is responsible for refusing to set it on a writing run.
 */

export const NORMAL_WINDOW_MS = 40 * 60_000;
export const FALLBACK_WINDOW_MS = 5 * 60_000;

export type CaptureDecision =
  | { capture: true; reason: "normal_window" | "late_fallback" | "forced_dry_run" }
  | { capture: false; reason: "already_captured" | "first_pitch_passed" | "too_early" };

export interface CaptureWindowInput {
  now: Date;
  scheduledFirstPitch: Date;
  alreadyCaptured: boolean;
  /** Dry-run only. Relaxes the window, never the post-first-pitch rule. */
  forceDryRun?: boolean;
}

export function decideCapture({
  now,
  scheduledFirstPitch,
  alreadyCaptured,
  forceDryRun = false,
}: CaptureWindowInput): CaptureDecision {
  if (alreadyCaptured) return { capture: false, reason: "already_captured" };

  const msUntilFirstPitch = scheduledFirstPitch.getTime() - now.getTime();

  // At or past first pitch. Never capture, now or on any later run. Checked
  // before the force branch on purpose — force must not reach past this.
  if (msUntilFirstPitch <= 0) return { capture: false, reason: "first_pitch_passed" };

  // Still pregame, and the caller asked for this specific game.
  if (forceDryRun) return { capture: true, reason: "forced_dry_run" };

  if (msUntilFirstPitch <= FALLBACK_WINDOW_MS) {
    return { capture: true, reason: "late_fallback" };
  }

  if (msUntilFirstPitch <= NORMAL_WINDOW_MS) {
    return { capture: true, reason: "normal_window" };
  }

  return { capture: false, reason: "too_early" };
}

/** Point-in-time integrity, computed at write and never taken from a caller. */
export function isPointInTime(capturedAt: Date, scheduledFirstPitch: Date): boolean {
  return capturedAt.getTime() < scheduledFirstPitch.getTime();
}
