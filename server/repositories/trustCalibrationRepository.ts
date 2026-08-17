import { getSupabaseAdmin } from "../middleware/auth";
import { AppError } from "../errors/AppError";

/**
 * Reads `public.trust_calibration_metrics` — the system-wide aggregate view
 * defined in supabase/migrations/20260727000001_trust_ledger_projections.sql.
 *
 * The view aggregates `public.trust_projections`, so it always yields exactly
 * one row. With zero projections that row is `total_users_with_trust = 0` and
 * every statistical column is NULL. Those NULLs are propagated verbatim — the
 * client renders them as "no data", it never substitutes a number.
 */
export interface TrustCalibrationMetricsRow {
  total_users_with_trust: number | null;
  avg_trust_score: number | null;
  max_trust_score: number | null;
  min_trust_score: number | null;
  trust_score_stddev: number | null;
  total_commits: number | null;
  total_locks: number | null;
  total_grades: number | null;
  total_graded_wins: number | null;
  total_graded_losses: number | null;
  avg_win_rate: number | null;
}

/** Exact column list of the view — kept explicit so a schema drift fails loudly. */
const CALIBRATION_COLUMNS = [
  "total_users_with_trust",
  "avg_trust_score",
  "max_trust_score",
  "min_trust_score",
  "trust_score_stddev",
  "total_commits",
  "total_locks",
  "total_grades",
  "total_graded_wins",
  "total_graded_losses",
  "avg_win_rate",
].join(",");

function numericOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export class TrustCalibrationRepository {
  /**
   * Returns the single calibration row, or `null` when the view yields no row
   * at all. Never invents values: a database failure throws so the caller can
   * surface a real error instead of rendering fabricated zeros.
   */
  async getCalibrationMetrics(): Promise<TrustCalibrationMetricsRow | null> {
    const supabase = await getSupabaseAdmin();

    const { data, error } = await supabase
      .from("trust_calibration_metrics")
      .select(CALIBRATION_COLUMNS)
      .maybeSingle();

    if (error) {
      throw new AppError({
        status: 502,
        code: "external_service_error",
        message: `Trust calibration metrics are unavailable: ${error.message}`,
        // Staff-only surface — the real database message is the diagnostic.
        expose: true,
        cause: error,
      });
    }

    if (!data) return null;

    const row = data as unknown as Record<string, unknown>;
    return {
      total_users_with_trust: numericOrNull(row.total_users_with_trust),
      avg_trust_score: numericOrNull(row.avg_trust_score),
      max_trust_score: numericOrNull(row.max_trust_score),
      min_trust_score: numericOrNull(row.min_trust_score),
      trust_score_stddev: numericOrNull(row.trust_score_stddev),
      total_commits: numericOrNull(row.total_commits),
      total_locks: numericOrNull(row.total_locks),
      total_grades: numericOrNull(row.total_grades),
      total_graded_wins: numericOrNull(row.total_graded_wins),
      total_graded_losses: numericOrNull(row.total_graded_losses),
      avg_win_rate: numericOrNull(row.avg_win_rate),
    };
  }
}

export const trustCalibrationRepository = new TrustCalibrationRepository();
