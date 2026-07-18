export type BrainEventPhase = "too_early" | "monitoring" | "lineup_window" | "locked" | "live" | "final";

export interface BrainTemporalContext {
  now: string;
  scheduledAt: string;
  observedAt: string;
  phase: BrainEventPhase;
  millisecondsToStart: number;
  sourceAgeMilliseconds: number;
  /** True only inside the 4h lineup window with fresh pregame evidence — freeze-eligible. */
  canSnapshot: boolean;
  /** True in the 4–12h monitoring band (or lineup window) with pregame evidence — rank-only, never freeze. */
  canMonitor: boolean;
  lockReason: string | null;
}

const MONITORING_WINDOW_MS = 12 * 60 * 60_000;
const LINEUP_WINDOW_MS = 4 * 60 * 60_000;
const MAX_SOURCE_AGE_MS = 20 * 60_000;

export function buildBrainTemporalContext(input: {
  now: Date;
  scheduledAt: string;
  observedAt: string;
  gameStatus?: string;
}): BrainTemporalContext {
  const scheduled = new Date(input.scheduledAt).getTime();
  const observed = new Date(input.observedAt).getTime();
  const now = input.now.getTime();
  if (!Number.isFinite(scheduled) || !Number.isFinite(observed)) {
    throw new Error("Brain temporal context requires valid ISO timestamps.");
  }

  const millisecondsToStart = scheduled - now;
  const sourceAgeMilliseconds = Math.max(0, now - observed);
  const status = input.gameStatus?.toLowerCase() ?? "";
  let phase: BrainEventPhase;
  if (/final|game over/.test(status)) phase = "final";
  else if (/progress|live|in play/.test(status)) phase = "live";
  else if (millisecondsToStart <= 0) phase = "locked";
  else if (millisecondsToStart <= LINEUP_WINDOW_MS) phase = "lineup_window";
  else if (millisecondsToStart <= MONITORING_WINDOW_MS) phase = "monitoring";
  else phase = "too_early";

  const eventStarted = phase === "live" || phase === "final" || phase === "locked";
  const evidenceAfterStart = observed >= scheduled;
  const evidenceStale = sourceAgeMilliseconds > MAX_SOURCE_AGE_MS;
  const inMonitorBand = phase === "monitoring" || phase === "lineup_window";

  let lockReason: string | null = null;
  if (eventStarted) lockReason = "Event has started; pregame decisions are locked.";
  else if (evidenceAfterStart) lockReason = "Evidence was observed at or after event start.";
  else if (evidenceStale) lockReason = "Evidence snapshot is stale.";
  else if (phase !== "lineup_window") lockReason = "Outside the four-hour decision window.";

  return {
    now: input.now.toISOString(),
    scheduledAt: new Date(scheduled).toISOString(),
    observedAt: new Date(observed).toISOString(),
    phase,
    millisecondsToStart,
    sourceAgeMilliseconds,
    canSnapshot: lockReason === null,
    canMonitor: !eventStarted && !evidenceAfterStart && !evidenceStale && inMonitorBand,
    lockReason,
  };
}
