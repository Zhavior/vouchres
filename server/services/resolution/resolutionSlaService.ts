/**
 * Resolution Engine SLA snapshot.
 *
 * Source of truth is `public.resolution_sla_metrics`
 * (supabase/migrations/20260727000002_resolution_engine.sql), one row per
 * measurement window written by the Resolution Engine.
 *
 * Honesty contract: windows are returned exactly as stored. Nothing is
 * back-filled, interpolated, or averaged across windows. An empty table means
 * `available: false` and zero windows — not a zeroed-out window.
 */
import {
  resolutionSlaRepository,
  type ResolutionSlaMetricsRow,
} from "../../repositories/resolutionSlaRepository";

export interface ResolutionSlaSnapshot {
  /** False when no SLA window has been recorded — render an empty state. */
  available: boolean;
  generatedAt: string;
  source: "resolution_sla_metrics";
  windowCount: number;
  /** Most recent window by window_start, or null when none exist. */
  latest: ResolutionSlaMetricsRow | null;
  /** Recent windows, newest first, capped by the caller's limit. */
  windows: ResolutionSlaMetricsRow[];
}

export async function getResolutionSlaSnapshot(limit: number): Promise<ResolutionSlaSnapshot> {
  const windows = await resolutionSlaRepository.getRecentWindows(limit);

  return {
    available: windows.length > 0,
    generatedAt: new Date().toISOString(),
    source: "resolution_sla_metrics",
    windowCount: windows.length,
    latest: windows[0] ?? null,
    windows,
  };
}
