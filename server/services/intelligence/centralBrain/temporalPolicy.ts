export type BrainEventPhase = "too_early" | "monitoring" | "lineup_window" | "locked" | "live" | "final";

export interface BrainTemporalContext {
  now: string;
  scheduledAt: string;
  observedAt: string;
  phase: BrainEventPhase;
  millisecondsToStart: number;
  sourceAgeMilliseconds: number;
  canSnapshot: boolean;
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

  let lockReason: string | null = null;
  if (phase === "live" || phase === "final" || phase === "locked") lockReason = "Event has started; pregame decisions are locked.";
  else if (observed >= scheduled) lockReason = "Evidence was observed at or after event start.";
  else if (sourceAgeMilliseconds > MAX_SOURCE_AGE_MS) lockReason = "Evidence snapshot is stale.";
  else if (phase !== "lineup_window") lockReason = "Outside the four-hour decision window.";

  return {
    now: input.now.toISOString(),
    scheduledAt: new Date(scheduled).toISOString(),
    observedAt: new Date(observed).toISOString(),
    phase,
    millisecondsToStart,
    sourceAgeMilliseconds,
    canSnapshot: lockReason === null,
    lockReason,
  };
}
