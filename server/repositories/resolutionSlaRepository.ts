import { getSupabaseAdmin } from "../middleware/auth";
import { AppError } from "../errors/AppError";

/**
 * Reads `public.resolution_sla_metrics` — the Resolution Engine's per-window
 * SLA telemetry defined in supabase/migrations/20260727000002_resolution_engine.sql.
 *
 * Rows are written by the Resolution Engine per measurement window. When no
 * window has been recorded yet the table is empty and this repository returns
 * an empty list; the caller renders an explicit empty state rather than a
 * synthesized window.
 */
export interface ResolutionSlaMetricsRow {
  id: string;
  window_start: string;
  window_end: string;
  sla_target_hours: number | null;
  sla_target_percentage: number | null;
  total_outcomes: number | null;
  sla_met_count: number | null;
  sla_missed_count: number | null;
  sla_percentage: number | null;
  avg_resolution_hours: number | null;
  p50_resolution_hours: number | null;
  p95_resolution_hours: number | null;
  max_resolution_hours: number | null;
  market_breakdown: Record<string, unknown>;
  created_at: string;
}

/** Exact column list of the table — explicit so schema drift fails loudly. */
const SLA_COLUMNS = [
  "id",
  "window_start",
  "window_end",
  "sla_target_hours",
  "sla_target_percentage",
  "total_outcomes",
  "sla_met_count",
  "sla_missed_count",
  "sla_percentage",
  "avg_resolution_hours",
  "p50_resolution_hours",
  "p95_resolution_hours",
  "max_resolution_hours",
  "market_breakdown",
  "created_at",
].join(",");

function numericOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function mapRow(raw: Record<string, unknown>): ResolutionSlaMetricsRow {
  return {
    id: String(raw.id ?? ""),
    window_start: typeof raw.window_start === "string" ? raw.window_start : "",
    window_end: typeof raw.window_end === "string" ? raw.window_end : "",
    sla_target_hours: numericOrNull(raw.sla_target_hours),
    sla_target_percentage: numericOrNull(raw.sla_target_percentage),
    total_outcomes: numericOrNull(raw.total_outcomes),
    sla_met_count: numericOrNull(raw.sla_met_count),
    sla_missed_count: numericOrNull(raw.sla_missed_count),
    sla_percentage: numericOrNull(raw.sla_percentage),
    avg_resolution_hours: numericOrNull(raw.avg_resolution_hours),
    p50_resolution_hours: numericOrNull(raw.p50_resolution_hours),
    p95_resolution_hours: numericOrNull(raw.p95_resolution_hours),
    max_resolution_hours: numericOrNull(raw.max_resolution_hours),
    market_breakdown: isRecord(raw.market_breakdown) ? raw.market_breakdown : {},
    created_at: typeof raw.created_at === "string" ? raw.created_at : "",
  };
}

export class ResolutionSlaRepository {
  /**
   * Most recent SLA windows, newest first. Throws on database failure so the
   * client can surface a real error instead of an empty-looking success.
   */
  async getRecentWindows(limit = 12): Promise<ResolutionSlaMetricsRow[]> {
    const supabase = await getSupabaseAdmin();

    const { data, error } = await supabase
      .from("resolution_sla_metrics")
      .select(SLA_COLUMNS)
      .order("window_start", { ascending: false })
      .limit(limit);

    if (error) {
      throw new AppError({
        status: 502,
        code: "external_service_error",
        message: `Resolution SLA metrics are unavailable: ${error.message}`,
        // Staff-only surface — the real database message is the diagnostic.
        expose: true,
        cause: error,
      });
    }

    return ((data ?? []) as unknown as Record<string, unknown>[]).map(mapRow);
  }
}

export const resolutionSlaRepository = new ResolutionSlaRepository();
