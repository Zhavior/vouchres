/**
 * Trust calibration snapshot — system-wide trust-model health.
 *
 * Source of truth is the `public.trust_calibration_metrics` view
 * (supabase/migrations/20260727000001_trust_ledger_projections.sql), which
 * aggregates `public.trust_projections`.
 *
 * Honesty contract: every field is nullable and NULL is passed through. This
 * service never defaults a missing statistic to 0, never interpolates, and
 * never derives a value the database did not report. `available: false` means
 * the view returned no row at all.
 */
import {
  trustCalibrationRepository,
  type TrustCalibrationMetricsRow,
} from "../../repositories/trustCalibrationRepository";

export interface TrustCalibrationSnapshot {
  /** False when the view produced no row — render an empty state, not zeros. */
  available: boolean;
  generatedAt: string;
  source: "trust_calibration_metrics";
  metrics: TrustCalibrationMetricsRow | null;
  /**
   * Decided win/loss totals, present only when BOTH underlying sums are
   * reported by the view. Null otherwise — never partially reconstructed.
   */
  gradedDecided: number | null;
}

export async function getTrustCalibration(): Promise<TrustCalibrationSnapshot> {
  const metrics = await trustCalibrationRepository.getCalibrationMetrics();

  const wins = metrics?.total_graded_wins ?? null;
  const losses = metrics?.total_graded_losses ?? null;
  const gradedDecided = wins !== null && losses !== null ? wins + losses : null;

  return {
    available: metrics !== null,
    generatedAt: new Date().toISOString(),
    source: "trust_calibration_metrics",
    metrics,
    gradedDecided,
  };
}
