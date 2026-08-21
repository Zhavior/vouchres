import { unwrapApiPayload } from '../apiEnvelope';
import type { DailyMlbReport } from '../../types/mlb';

declare global {
  interface Window {
    __veDailyReportEarly?: Promise<unknown>;
  }
}

const EARLY_TTL_MS = 15_000;

let parsed: Promise<DailyMlbReport> | null = null;
let claimedAt: number | null = null;

function normalizeDailyReport(raw: any): DailyMlbReport {
  const source = raw?.payload ?? raw?.report ?? raw?.data ?? raw ?? {};

  return {
    ...source,
    date: source.date ?? raw?.date ?? new Date().toISOString().slice(0, 10),
    gameCount: source.gameCount ?? source.games?.length ?? raw?.gameCount ?? 0,
    dataQuality: source.dataQuality ?? raw?.dataQuality ?? raw?.status ?? 'limited',
    games: source.games ?? [],
    vulnerablePitchers: source.vulnerablePitchers ?? [],
    hrTargets: source.hrTargets ?? [],
    sneakyHr: source.sneakyHr ?? [],
    runEnvironments: source.runEnvironments ?? [],
  } as DailyMlbReport;
}

/**
 * Returns the daily report request started by the inline script in index.html.
 * Resolves in parallel with JS parsing so Today Page paints immediately.
 */
export function claimEarlyDailyReport(): Promise<DailyMlbReport> | null {
  if (typeof window === 'undefined') return null;

  if (parsed) {
    return claimedAt != null && performance.now() - claimedAt <= EARLY_TTL_MS ? parsed : null;
  }

  const early = window.__veDailyReportEarly;
  if (!early) return null;

  claimedAt = performance.now();
  parsed = early.then((body) => normalizeDailyReport(unwrapApiPayload(body)));

  delete window.__veDailyReportEarly;

  return parsed;
}

export function resetEarlyDailyReportForTests(): void {
  parsed = null;
  claimedAt = null;
}
