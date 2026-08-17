/**
 * TrustModelQualityPage — read-only staff console for model-quality telemetry.
 *
 * Two server contracts, both staff-gated:
 *   GET /api/v3/trust/calibration  → public.trust_calibration_metrics (view)
 *   GET /api/v3/resolution/sla     → public.resolution_sla_metrics (table)
 *
 * Honesty contract for this surface:
 *   - Every rendered figure comes straight from the API response.
 *   - A null/absent statistic renders the NO_DATA marker ("----"). Nothing is
 *     defaulted to zero, interpolated, smoothed, or derived from a row index.
 *   - There is no chart: the SLA table only ever has as many rows as the
 *     server returned windows, so a table cannot imply data that is missing.
 *   - Load, error, and empty are three distinct visible states. Errors surface
 *     the server's own message.
 *   - Both queries are awaited together and the page renders in one piece, so
 *     no panel pops in after another.
 */

import React from 'react';
import { AlertOctagon, Gauge, RefreshCw, Timer } from 'lucide-react';
import {
  AURORA_PAGE,
  AURORA_PAGE_GAP,
  AURORA_PAGE_PAD_Y,
  AURORA_LABEL,
  AURORA_TABULAR,
  AURORA_MAX_SHELL,
} from '../../theme/auroraTokens';
import {
  AuroraMaxCommandHeader,
  AuroraMaxControl,
  AuroraMaxEyebrow,
  AuroraMaxFallback,
  AuroraMaxPanel,
  AuroraMaxTruthBadge,
} from '../../components/aurora-max/AuroraMaxPrimitives';
import {
  RESOLUTION_SLA_WINDOW_LIMIT,
  useResolutionSla,
  useTrustCalibration,
  type ResolutionSlaWindow,
  type TrustCalibrationMetrics,
} from '../../hooks/queries/useModelQualityMetrics';

/** Rendered wherever the database reported no value. Never a stand-in number. */
const NO_DATA = '----';

function formatInteger(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return NO_DATA;
  return Math.round(value).toLocaleString('en-US');
}

function formatDecimal(value: number | null | undefined, digits = 2): string {
  if (value == null || !Number.isFinite(value)) return NO_DATA;
  return value.toFixed(digits);
}

function formatPercent(value: number | null | undefined, digits = 2): string {
  if (value == null || !Number.isFinite(value)) return NO_DATA;
  return `${value.toFixed(digits)}%`;
}

function formatHours(value: number | null | undefined, digits = 2): string {
  if (value == null || !Number.isFinite(value)) return NO_DATA;
  return `${value.toFixed(digits)}h`;
}

function formatTimestamp(iso: string | null | undefined): string {
  if (!iso) return NO_DATA;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return NO_DATA;
  return parsed.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Surfaces the server's own error text (apiClient throws the error envelope). */
function serverErrorMessage(error: unknown): string {
  if (!error) return 'Request failed with no message.';
  if (typeof error === 'string') return error;

  if (typeof error === 'object') {
    const record = error as Record<string, unknown>;
    const message =
      typeof record.message === 'string' && record.message.trim() ? record.message.trim() : null;
    const code =
      typeof record.code === 'string' && record.code.trim()
        ? record.code.trim()
        : typeof record.error === 'string' && record.error.trim()
          ? record.error.trim()
          : null;
    const status = typeof record.status === 'number' ? record.status : null;

    const parts: string[] = [];
    if (message) parts.push(message);
    const tags = [status != null ? `HTTP ${status}` : null, code].filter(Boolean).join(' · ');
    if (tags) parts.push(`(${tags})`);
    if (parts.length > 0) return parts.join(' ');
  }

  if (error instanceof Error && error.message) return error.message;
  return 'Request failed with no message.';
}

// ── Shared primitives ──────────────────────────────────────────────────────

function MetricCell({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  const missing = value === NO_DATA;
  return (
    <div className="min-w-0 border border-white/10 bg-black/30 px-3 py-2.5">
      <p className={`${AURORA_LABEL} truncate text-white/45`}>{label}</p>
      <p
        className={`${AURORA_TABULAR} mt-1 font-mono text-[17px] font-black leading-tight ${
          missing ? 'text-white/30' : 'text-white'
        }`}
        title={missing ? 'Not reported by the database' : undefined}
      >
        {value}
      </p>
      {hint ? <p className="mt-0.5 truncate text-[11px] text-white/35">{hint}</p> : null}
    </div>
  );
}

function DataCell({ value, align = 'right' }: { value: string; align?: 'left' | 'right' }) {
  const missing = value === NO_DATA;
  return (
    <td
      className={`${AURORA_TABULAR} whitespace-nowrap border-t border-white/8 px-3 py-2 font-mono text-[12px] ${
        align === 'right' ? 'text-right' : 'text-left'
      } ${missing ? 'text-white/30' : 'text-white/85'}`}
    >
      {value}
    </td>
  );
}

function SectionError({ title, message }: { title: string; message: string }) {
  return (
    <div className="border border-rose-500/30 bg-rose-500/10 px-4 py-3.5" role="alert">
      <div className="flex items-center gap-2">
        <AlertOctagon className="h-4 w-4 shrink-0 text-rose-300" aria-hidden="true" />
        <p className={`${AURORA_LABEL} text-rose-200`}>{title}</p>
      </div>
      <p className="mt-1.5 break-words font-mono text-[12px] leading-relaxed text-rose-100/90">
        {message}
      </p>
    </div>
  );
}

// ── Loading skeleton ───────────────────────────────────────────────────────
// Fixed heights matching the loaded layout so swapping in real content does
// not shift anything, and both sections appear at the same moment.

function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`border border-white/8 bg-white/[0.04] ${className}`} aria-hidden="true" />;
}

function ConsoleSkeleton() {
  return (
    <div className={AURORA_PAGE_GAP} role="status" aria-label="Loading model quality metrics">
      <SkeletonBlock className="h-[300px]" />
      <SkeletonBlock className="h-[300px]" />
      <span className="sr-only">Loading model quality metrics…</span>
    </div>
  );
}

// ── Trust calibration ──────────────────────────────────────────────────────

const CALIBRATION_ROWS: ReadonlyArray<{
  key: keyof TrustCalibrationMetrics;
  label: string;
  format: (value: number | null) => string;
}> = [
  { key: 'total_users_with_trust', label: 'Users with trust', format: formatInteger },
  { key: 'avg_trust_score', label: 'Avg trust score', format: (v) => formatDecimal(v) },
  { key: 'max_trust_score', label: 'Max trust score', format: (v) => formatDecimal(v) },
  { key: 'min_trust_score', label: 'Min trust score', format: (v) => formatDecimal(v) },
  { key: 'trust_score_stddev', label: 'Trust score stddev', format: (v) => formatDecimal(v) },
  { key: 'total_commits', label: 'Total commits', format: formatInteger },
  { key: 'total_locks', label: 'Total locks', format: formatInteger },
  { key: 'total_grades', label: 'Total grades', format: formatInteger },
  { key: 'total_graded_wins', label: 'Graded wins', format: formatInteger },
  { key: 'total_graded_losses', label: 'Graded losses', format: formatInteger },
  { key: 'avg_win_rate', label: 'Avg win rate', format: (v) => formatPercent(v) },
];

function CalibrationSection() {
  const query = useTrustCalibration();
  const snapshot = query.data;
  const metrics = snapshot?.metrics ?? null;

  return (
    <AuroraMaxPanel as="section" className="p-4 sm:p-5" ariaLabel="Trust calibration metrics">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <AuroraMaxEyebrow>Trust calibration</AuroraMaxEyebrow>
          <h2 className="flex items-center gap-2 text-[15px] font-black tracking-tight text-white">
            <Gauge className="h-4 w-4 text-vouch-cyan/70" aria-hidden="true" />
            Trust model health
          </h2>
          <p className="mt-1 font-mono text-[11px] text-white/40">
            public.trust_calibration_metrics · aggregate of public.trust_projections
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          {snapshot ? (
            <AuroraMaxTruthBadge state={snapshot.available ? 'confirmed' : 'missing'}>
              {snapshot.available ? 'View reported' : 'No row returned'}
            </AuroraMaxTruthBadge>
          ) : null}
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">
            Read {formatTimestamp(snapshot?.generatedAt)}
          </p>
        </div>
      </header>

      <div className="mt-4">
        {query.isError ? (
          <SectionError title="Calibration read failed" message={serverErrorMessage(query.error)} />
        ) : !metrics ? (
          <AuroraMaxFallback
            title="No calibration row"
            detail="public.trust_calibration_metrics returned no row. Nothing is displayed because there is nothing to display."
          />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              <MetricCell label="Users with trust" value={formatInteger(metrics.total_users_with_trust)} />
              <MetricCell label="Avg trust score" value={formatDecimal(metrics.avg_trust_score)} />
              <MetricCell
                label="Score spread"
                value={
                  metrics.min_trust_score == null || metrics.max_trust_score == null
                    ? NO_DATA
                    : `${formatDecimal(metrics.min_trust_score)} – ${formatDecimal(metrics.max_trust_score)}`
                }
                hint="min – max"
              />
              <MetricCell label="Avg win rate" value={formatPercent(metrics.avg_win_rate)} />
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[320px] border-collapse text-left">
                <caption className="sr-only">
                  All columns of the trust_calibration_metrics view
                </caption>
                <thead>
                  <tr>
                    <th scope="col" className={`${AURORA_LABEL} px-3 py-2 text-white/45`}>
                      Column
                    </th>
                    <th scope="col" className={`${AURORA_LABEL} px-3 py-2 text-right text-white/45`}>
                      Value
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {CALIBRATION_ROWS.map((row) => (
                    <tr key={row.key}>
                      <th
                        scope="row"
                        className="border-t border-white/8 px-3 py-2 text-left font-mono text-[12px] font-semibold text-white/60"
                      >
                        {row.label}
                      </th>
                      <DataCell value={row.format(metrics[row.key])} />
                    </tr>
                  ))}
                  <tr>
                    <th
                      scope="row"
                      className="border-t border-white/8 px-3 py-2 text-left font-mono text-[12px] font-semibold text-white/60"
                    >
                      Graded decided (wins + losses)
                    </th>
                    <DataCell value={formatInteger(snapshot?.gradedDecided ?? null)} />
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="mt-2.5 font-mono text-[11px] leading-relaxed text-white/35">
              {NO_DATA} means the view returned NULL for that column — most often because no
              projection rows support the statistic. It is not a zero.
            </p>
          </>
        )}
      </div>
    </AuroraMaxPanel>
  );
}

// ── Resolution SLA ─────────────────────────────────────────────────────────

const SLA_COLUMNS: ReadonlyArray<{
  key: string;
  label: string;
  render: (row: ResolutionSlaWindow) => string;
}> = [
  { key: 'window_start', label: 'Window start', render: (row) => formatTimestamp(row.window_start) },
  { key: 'window_end', label: 'Window end', render: (row) => formatTimestamp(row.window_end) },
  { key: 'total_outcomes', label: 'Outcomes', render: (row) => formatInteger(row.total_outcomes) },
  { key: 'sla_met_count', label: 'Met', render: (row) => formatInteger(row.sla_met_count) },
  { key: 'sla_missed_count', label: 'Missed', render: (row) => formatInteger(row.sla_missed_count) },
  { key: 'sla_percentage', label: 'SLA %', render: (row) => formatPercent(row.sla_percentage) },
  {
    key: 'sla_target_percentage',
    label: 'Target %',
    render: (row) => formatPercent(row.sla_target_percentage),
  },
  {
    key: 'sla_target_hours',
    label: 'Target',
    render: (row) => formatHours(row.sla_target_hours),
  },
  { key: 'avg_resolution_hours', label: 'Avg', render: (row) => formatHours(row.avg_resolution_hours) },
  { key: 'p50_resolution_hours', label: 'p50', render: (row) => formatHours(row.p50_resolution_hours) },
  { key: 'p95_resolution_hours', label: 'p95', render: (row) => formatHours(row.p95_resolution_hours) },
  { key: 'max_resolution_hours', label: 'Max', render: (row) => formatHours(row.max_resolution_hours) },
];

function marketBreakdownEntries(row: ResolutionSlaWindow): Array<[string, string]> {
  return Object.entries(row.market_breakdown ?? {}).map(([key, value]) => {
    if (value == null) return [key, NO_DATA];
    if (typeof value === 'number') return [key, formatDecimal(value)];
    if (typeof value === 'string' || typeof value === 'boolean') return [key, String(value)];
    return [key, JSON.stringify(value)];
  });
}

function SlaSection() {
  const query = useResolutionSla(RESOLUTION_SLA_WINDOW_LIMIT);
  const snapshot = query.data;
  const latest = snapshot?.latest ?? null;
  const windows = snapshot?.windows ?? [];
  const breakdown = latest ? marketBreakdownEntries(latest) : [];

  return (
    <AuroraMaxPanel as="section" className="p-4 sm:p-5" ariaLabel="Resolution engine SLA metrics">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <AuroraMaxEyebrow>Resolution engine</AuroraMaxEyebrow>
          <h2 className="flex items-center gap-2 text-[15px] font-black tracking-tight text-white">
            <Timer className="h-4 w-4 text-vouch-cyan/70" aria-hidden="true" />
            Settlement SLA
          </h2>
          <p className="mt-1 font-mono text-[11px] text-white/40">
            public.resolution_sla_metrics · newest {RESOLUTION_SLA_WINDOW_LIMIT} windows
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          {snapshot ? (
            <AuroraMaxTruthBadge state={snapshot.available ? 'confirmed' : 'missing'}>
              {snapshot.available
                ? `${formatInteger(snapshot.windowCount)} window${snapshot.windowCount === 1 ? '' : 's'}`
                : 'No windows recorded'}
            </AuroraMaxTruthBadge>
          ) : null}
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">
            Read {formatTimestamp(snapshot?.generatedAt)}
          </p>
        </div>
      </header>

      <div className="mt-4">
        {query.isError ? (
          <SectionError title="SLA read failed" message={serverErrorMessage(query.error)} />
        ) : windows.length === 0 ? (
          <AuroraMaxFallback
            title="No SLA windows"
            detail="public.resolution_sla_metrics has no rows yet. The Resolution Engine writes one row per measurement window; until then there is no SLA figure to report."
          />
        ) : (
          <>
            {latest ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                <MetricCell
                  label="Latest SLA"
                  value={formatPercent(latest.sla_percentage)}
                  hint={`target ${formatPercent(latest.sla_target_percentage)}`}
                />
                <MetricCell
                  label="Outcomes in window"
                  value={formatInteger(latest.total_outcomes)}
                  hint={`${formatInteger(latest.sla_met_count)} met · ${formatInteger(latest.sla_missed_count)} missed`}
                />
                <MetricCell
                  label="p95 resolution"
                  value={formatHours(latest.p95_resolution_hours)}
                  hint={`target ${formatHours(latest.sla_target_hours)}`}
                />
                <MetricCell
                  label="Window closed"
                  value={formatTimestamp(latest.window_end)}
                />
              </div>
            ) : null}

            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[880px] border-collapse text-left">
                <caption className="sr-only">
                  Recorded resolution SLA windows, newest first
                </caption>
                <thead>
                  <tr>
                    {SLA_COLUMNS.map((column, index) => (
                      <th
                        key={column.key}
                        scope="col"
                        className={`${AURORA_LABEL} whitespace-nowrap px-3 py-2 text-white/45 ${
                          index === 0 || index === 1 ? 'text-left' : 'text-right'
                        }`}
                      >
                        {column.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {windows.map((row) => (
                    <tr key={row.id || row.window_start}>
                      {SLA_COLUMNS.map((column, index) => (
                        <DataCell
                          key={column.key}
                          value={column.render(row)}
                          align={index === 0 || index === 1 ? 'left' : 'right'}
                        />
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3 border border-white/10 bg-black/30 px-3 py-2.5">
              <p className={`${AURORA_LABEL} text-white/45`}>
                Latest window market breakdown
              </p>
              {breakdown.length === 0 ? (
                <p className="mt-1 font-mono text-[12px] text-white/30">
                  {NO_DATA} — market_breakdown is empty for this window.
                </p>
              ) : (
                <dl className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
                  {breakdown.map(([key, value]) => (
                    <div key={key} className="flex min-w-0 items-baseline justify-between gap-2">
                      <dt className="truncate font-mono text-[12px] text-white/55">{key}</dt>
                      <dd
                        className={`${AURORA_TABULAR} shrink-0 font-mono text-[12px] font-bold ${
                          value === NO_DATA ? 'text-white/30' : 'text-white/85'
                        }`}
                      >
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>

            <p className="mt-2.5 font-mono text-[11px] leading-relaxed text-white/35">
              One row per recorded window, exactly as stored. No window is inferred and no
              cross-window average is computed here.
            </p>
          </>
        )}
      </div>
    </AuroraMaxPanel>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function TrustModelQualityPage() {
  const calibration = useTrustCalibration();
  const sla = useResolutionSla(RESOLUTION_SLA_WINDOW_LIMIT);

  // Gate on both queries so the console appears as one piece rather than two
  // panels popping in at different times.
  const initialLoading = calibration.isPending || sla.isPending;
  const refreshing = calibration.isFetching || sla.isFetching;

  const refresh = React.useCallback(() => {
    void calibration.refetch();
    void sla.refetch();
  }, [calibration, sla]);

  return (
    <div
      className={`${AURORA_PAGE} ${AURORA_MAX_SHELL} min-h-0 min-w-0 w-full max-w-full overflow-x-hidden ${AURORA_PAGE_PAD_Y} pb-16`}
    >
      <div className={AURORA_PAGE_GAP}>
        <AuroraMaxCommandHeader
          eyebrow="Model quality"
          title="Calibration & Settlement SLA"
          description="Read-only view of the trust calibration view and the Resolution Engine SLA table. Values are shown exactly as the database reports them."
          meta={
            <AuroraMaxControl onClick={refresh} disabled={refreshing} aria-label="Refresh metrics">
              <RefreshCw
                className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              {refreshing ? 'Refreshing' : 'Refresh'}
            </AuroraMaxControl>
          }
        />

        {initialLoading ? (
          <ConsoleSkeleton />
        ) : (
          <div className={AURORA_PAGE_GAP}>
            <CalibrationSection />
            <SlaSection />
          </div>
        )}
      </div>
    </div>
  );
}
