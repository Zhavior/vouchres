import { useMemo, useState, type ReactNode } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Gauge,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Wrench,
} from 'lucide-react';
import type { ApiError } from '../../lib/apiClient';
import {
  AURORA_FONT_MONO,
  AURORA_LABEL,
  AURORA_PANEL_PREMIUM,
  AURORA_SECTION_HEADER,
  AURORA_TABULAR,
} from '../../theme/auroraTokens';
import {
  useOpsCoreHealth,
  useOpsRouteMetrics,
  useSelfHealActionMutation,
  useSelfHealOverview,
  useSelfHealRunMutation,
  useSelfHealScanMutation,
  type SelfHealActionDefinition,
  type SelfHealActionResult,
  type SelfHealCheck,
  type SelfHealLoopReport,
  type SelfHealScanReport,
} from '../../hooks/queries/useOpsSelfHeal';

/**
 * Ops panel over the v3 self-healing engine and the staff route telemetry
 * snapshot. Every value rendered here comes from a server field; anything the
 * server omits renders as `----`. See src/hooks/queries/useOpsSelfHeal.ts for
 * the transcribed contracts.
 *
 * Deliberately does NOT duplicate the existing SystemHealth panel, which reads
 * /api/health/backend (process memory, dependency wiring, config checks, and
 * the same request totals / p95 in summary form). This panel shows the parts of
 * /api/health/metrics that SystemHealth has no view of: per-route breakdown,
 * status-class distribution, recent slow/error events, parlay grading contract
 * telemetry, and legacy route hits.
 */

const PANEL = `rounded-lg ${AURORA_PANEL_PREMIUM}`;
const BUTTON =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45';
const PRIMARY_BUTTON = `${BUTTON} border-emerald-400/40 bg-emerald-500/20 text-emerald-100 hover:bg-emerald-500/30`;
const DANGER_BUTTON = `${BUTTON} border-rose-400/35 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20`;
const CELL = 'px-4 py-3';
const TH = 'px-4 py-3 font-medium';

/** Rendered wherever the server did not supply a value. Never a guess. */
const NO_VALUE = '----';

function errorMessage(error: unknown): string {
  if (!error) return 'The request could not be completed.';
  const apiError = error as ApiError;
  return apiError?.message || apiError?.error || 'The request could not be completed.';
}

function formatNumber(value: number | null | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return NO_VALUE;
  return new Intl.NumberFormat('en-US').format(value);
}

function formatMs(value: number | null | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return NO_VALUE;
  return `${new Intl.NumberFormat('en-US').format(Math.round(value))} ms`;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return NO_VALUE;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? NO_VALUE : date.toLocaleString();
}

function formatUptime(value: number | null | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return NO_VALUE;
  const seconds = Math.floor(value / 1000);
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatSpan(startedAt: string | null | undefined, finishedAt: string | null | undefined): string {
  if (!startedAt || !finishedAt) return NO_VALUE;
  const start = new Date(startedAt).getTime();
  const end = new Date(finishedAt).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return NO_VALUE;
  return formatMs(end - start);
}

function severityTone(severity: SelfHealCheck['severity']): string {
  if (severity === 'critical') return 'border-rose-400/35 bg-rose-500/10 text-rose-100';
  if (severity === 'warn') return 'border-amber-300/35 bg-amber-400/10 text-amber-100';
  return 'border-white/10 bg-white/[0.04] text-white/70';
}

function summaryValue(value: unknown): string {
  if (value === null || value === undefined) return NO_VALUE;
  if (typeof value === 'number') return Number.isFinite(value) ? formatNumber(value) : NO_VALUE;
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'string') return value.length ? value : NO_VALUE;
  try {
    return JSON.stringify(value);
  } catch {
    return NO_VALUE;
  }
}

function PanelTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className={`${AURORA_SECTION_HEADER} flex items-center justify-between gap-4 border-b border-white/5 px-4 py-4 sm:px-5`}>
      <h3 className={`${AURORA_LABEL} text-white`}>{children}</h3>
      {action}
    </div>
  );
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className={`${PANEL} p-4`}>
      <p className={`${AURORA_LABEL} text-white/50`}>{label}</p>
      <p className={`mt-2 text-2xl font-semibold text-white ${AURORA_TABULAR}`}>{value}</p>
      <p className="mt-1 min-h-4 text-xs text-white/45">{detail ?? ''}</p>
    </div>
  );
}

function ErrorNotice({ title, error }: { title: string; error: unknown }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-rose-400/30 bg-rose-500/10 p-3">
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-200" />
      <div>
        <p className="text-sm font-semibold text-rose-100">{title}</p>
        <p className="mt-1 text-xs text-rose-100/80">{errorMessage(error)}</p>
      </div>
    </div>
  );
}

function EmptyRow({ columns, children }: { columns: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={columns} className="px-4 py-9 text-center text-sm text-white/45">
        {children}
      </td>
    </tr>
  );
}

function SummaryList({ summary }: { summary: Record<string, unknown> | null | undefined }) {
  const entries = Object.entries(summary ?? {});
  if (!entries.length) {
    return <p className="text-xs text-white/45">The server returned no summary fields for this action.</p>;
  }
  return (
    <dl className="grid gap-2 sm:grid-cols-2">
      {entries.map(([key, value]) => (
        <div key={key} className="rounded-md border border-white/8 bg-white/[0.03] px-3 py-2">
          <dt className={`${AURORA_FONT_MONO} text-[10px] uppercase tracking-[0.08em] text-white/45`}>{key}</dt>
          <dd className={`mt-1 break-words text-sm text-white ${AURORA_TABULAR}`}>{summaryValue(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

function ActionResultCard({ result }: { result: SelfHealActionResult }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/30 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-white">{result.title || result.actionId || NO_VALUE}</span>
        <span
          className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
            result.dryRun
              ? 'border-white/15 bg-white/[0.05] text-white/70'
              : 'border-amber-300/35 bg-amber-400/10 text-amber-100'
          }`}
        >
          {result.dryRun ? 'Dry run · no writes' : 'Live · wrote changes'}
        </span>
        <span
          className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
            result.ok
              ? 'border-emerald-400/35 bg-emerald-500/10 text-emerald-100'
              : 'border-rose-400/35 bg-rose-500/10 text-rose-100'
          }`}
        >
          {result.ok ? 'Completed' : 'Failed'}
        </span>
      </div>
      <p className="mt-1.5 text-xs text-white/45">
        Started {formatDate(result.startedAt)} · Duration {formatSpan(result.startedAt, result.finishedAt)}
      </p>
      <div className="mt-3">
        <SummaryList summary={result.summary} />
      </div>
    </div>
  );
}

function ScanChecksTable({ scan }: { scan: SelfHealScanReport | null | undefined }) {
  const checks = scan?.checks ?? [];
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm text-white/70">
        <thead className="border-b border-white/5 bg-white/[0.02] text-xs uppercase text-white/45">
          <tr>
            <th className={TH}>Check</th>
            <th className={TH}>Status</th>
            <th className={TH}>Backlog</th>
            <th className={TH}>Detail reported by the engine</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {checks.length ? (
            checks.map((check) => (
              <tr key={check.id}>
                <td className={CELL}>
                  <p className="font-medium text-white">{check.title || check.id || NO_VALUE}</p>
                  <p className={`${AURORA_FONT_MONO} mt-0.5 text-[10px] text-white/40`}>{check.id || NO_VALUE}</p>
                </td>
                <td className={CELL}>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                      check.status === 'ok'
                        ? 'border-emerald-400/35 bg-emerald-500/10 text-emerald-100'
                        : severityTone(check.severity)
                    }`}
                  >
                    {check.status === 'ok' ? 'Clear' : 'Drift detected'}
                  </span>
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-white/35">
                    Severity {check.severity || NO_VALUE}
                  </p>
                </td>
                <td className={`${CELL} ${AURORA_TABULAR} text-white`}>{formatNumber(check.detectedCount)}</td>
                <td className={`${CELL} max-w-[420px] text-xs text-white/55`}>
                  {check.detail || 'The engine returned no detail for this check.'}
                  {check.repairActionIds?.length ? (
                    <p className={`${AURORA_FONT_MONO} mt-1 text-[10px] text-white/35`}>
                      Repairs: {check.repairActionIds.join(', ')}
                    </p>
                  ) : null}
                </td>
              </tr>
            ))
          ) : (
            <EmptyRow columns={4}>The scan returned no checks.</EmptyRow>
          )}
        </tbody>
      </table>
    </div>
  );
}

function LoopReportCard({ report }: { report: SelfHealLoopReport }) {
  return (
    <div className="space-y-3 p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2 text-xs text-white/50">
        <span
          className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
            report.dryRun
              ? 'border-white/15 bg-white/[0.05] text-white/70'
              : 'border-amber-300/35 bg-amber-400/10 text-amber-100'
          }`}
        >
          {report.dryRun ? 'Dry run · no writes' : 'Live · wrote changes'}
        </span>
        <span>Started {formatDate(report.startedAt)}</span>
        <span>·</span>
        <span>Duration {formatSpan(report.startedAt, report.finishedAt)}</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-md border border-white/8 bg-white/[0.03] px-3 py-2">
          <p className={`${AURORA_LABEL} text-white/45`}>Before</p>
          <p className="mt-1 text-sm text-white">{report.before?.healthy ? 'Healthy' : 'Drift detected'}</p>
          <p className="mt-0.5 text-[11px] text-white/40">{formatDate(report.before?.generatedAt)}</p>
        </div>
        <div className="rounded-md border border-white/8 bg-white/[0.03] px-3 py-2">
          <p className={`${AURORA_LABEL} text-white/45`}>After</p>
          <p className="mt-1 text-sm text-white">{report.after?.healthy ? 'Healthy' : 'Drift detected'}</p>
          <p className="mt-0.5 text-[11px] text-white/40">{formatDate(report.after?.generatedAt)}</p>
        </div>
        <div className="rounded-md border border-white/8 bg-white/[0.03] px-3 py-2">
          <p className={`${AURORA_LABEL} text-white/45`}>Actions executed</p>
          <p className={`mt-1 text-sm text-white ${AURORA_TABULAR}`}>{formatNumber(report.actions?.length)}</p>
        </div>
      </div>
      {report.actions?.length ? (
        <div className="space-y-2">
          {report.actions.map((action) => (
            <ActionResultCard key={`${action.actionId}-${action.startedAt}`} result={action} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-white/45">
          This loop executed no actions. The engine only runs repairs for checks reporting drift.
        </p>
      )}
    </div>
  );
}

export default function SelfHealPanel() {
  const overview = useSelfHealOverview();
  const routeMetrics = useOpsRouteMetrics();
  const coreHealth = useOpsCoreHealth();

  const scanMutation = useSelfHealScanMutation();
  const runMutation = useSelfHealRunMutation();
  const actionMutation = useSelfHealActionMutation();

  const [runConfirmOpen, setRunConfirmOpen] = useState(false);
  const [runDryRun, setRunDryRun] = useState(true);
  const [maxActions, setMaxActions] = useState(3);
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);
  const [probedResult, setProbedResult] = useState<SelfHealActionResult | null>(null);

  const scan = overview.data?.scan ?? null;
  const lastLoop = overview.data?.lastLoop ?? null;
  const metrics = routeMetrics.data?.metrics ?? null;
  const parlayGrade = routeMetrics.data?.parlayGrade ?? null;
  const legacyRoutes = routeMetrics.data?.legacyRoutes ?? null;

  const actionCatalog: SelfHealActionDefinition[] = useMemo(() => scan?.actionCatalog ?? [], [scan]);
  const driftChecks = useMemo(
    () => (scan?.checks ?? []).filter((check) => check.status === 'drift_detected'),
    [scan],
  );

  /** The exact actions the engine will pick, in the engine's own order. */
  const pendingRunActionIds = useMemo(() => {
    const ids = driftChecks.flatMap((check) => check.repairActionIds ?? []);
    const unique = ids.filter((id, index) => ids.indexOf(id) === index);
    return unique.slice(0, maxActions);
  }, [driftChecks, maxActions]);

  const selectedAction = useMemo(
    () => actionCatalog.find((action) => action.id === selectedActionId) ?? null,
    [actionCatalog, selectedActionId],
  );

  const selectedActionChecks = useMemo(
    () =>
      selectedActionId
        ? (scan?.checks ?? []).filter((check) => (check.repairActionIds ?? []).includes(selectedActionId))
        : [],
    [scan, selectedActionId],
  );

  const selectedActionLastResult = useMemo(
    () => (lastLoop?.actions ?? []).find((action) => action.actionId === selectedActionId) ?? null,
    [lastLoop, selectedActionId],
  );

  const maxActionsOptions = useMemo(() => {
    const ceiling = Math.max(1, Math.min(actionCatalog.length || 1, 10));
    return Array.from({ length: ceiling }, (_, index) => index + 1);
  }, [actionCatalog.length]);

  const isBootstrapping = overview.isPending || routeMetrics.isPending || coreHealth.isPending;
  const isBusy = scanMutation.isPending || runMutation.isPending || actionMutation.isPending;
  const isRefreshing = overview.isFetching || routeMetrics.isFetching || coreHealth.isFetching;

  function refreshAll() {
    void overview.refetch();
    void routeMetrics.refetch();
    void coreHealth.refetch();
  }

  function confirmRun() {
    runMutation.mutate(
      { dryRun: runDryRun, maxActions },
      { onSuccess: () => setRunConfirmOpen(false) },
    );
  }

  function probeAction(actionId: string) {
    setProbedResult(null);
    actionMutation.mutate(
      { actionId, dryRun: true },
      { onSuccess: (result) => setProbedResult(result) },
    );
  }

  // One gate for the whole surface: nothing renders in pieces, and the layout
  // does not shift as the three requests land.
  if (isBootstrapping) {
    return (
      <div className={`${PANEL} flex items-center gap-3 p-5 text-sm text-white/55`}>
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading the self-healing report and runtime telemetry...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-white">Ops · self-healing engine</h2>
            <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-100">
              Staff only · writes production data
            </span>
          </div>
          <p className="mt-1 max-w-3xl text-sm text-white/55">
            Reads the v3 self-healing scan and the staff route telemetry snapshot. Every number below is a field
            returned by the server; missing fields show as {NO_VALUE}.
          </p>
        </div>
        <button type="button" className={BUTTON} onClick={refreshAll} disabled={isRefreshing || isBusy}>
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {overview.isError ? <ErrorNotice title="Self-healing scan failed" error={overview.error} /> : null}
      {routeMetrics.isError ? <ErrorNotice title="Runtime metrics failed" error={routeMetrics.error} /> : null}
      {coreHealth.isError ? <ErrorNotice title="Core health check failed" error={coreHealth.error} /> : null}

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Engine verdict"
          value={scan ? (scan.healthy ? 'Healthy' : 'Drift detected') : NO_VALUE}
          detail={scan ? `Scanned ${formatDate(scan.generatedAt)}` : 'No scan returned'}
        />
        <MetricCard
          label="Checks reporting drift"
          value={scan ? formatNumber(driftChecks.length) : NO_VALUE}
          detail={scan ? `${formatNumber(scan.checks?.length)} checks evaluated` : undefined}
        />
        <MetricCard
          label="Items awaiting repair"
          value={scan ? formatNumber(driftChecks.reduce((total, check) => total + (check.detectedCount ?? 0), 0)) : NO_VALUE}
          detail="Sum of detectedCount across drifting checks"
        />
        <MetricCard
          label="Last repair loop"
          value={lastLoop ? (lastLoop.dryRun ? 'Dry run' : 'Live run') : 'Never run'}
          detail={lastLoop ? formatDate(lastLoop.finishedAt) : 'No loop has run since process start'}
        />
      </section>

      <section className={`${PANEL} overflow-hidden`}>
        <PanelTitle
          action={
            <button
              type="button"
              className={BUTTON}
              onClick={() => scanMutation.mutate()}
              disabled={isBusy}
            >
              {scanMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Gauge className="h-4 w-4" />
              )}
              Re-scan (read only)
            </button>
          }
        >
          Drift checks
        </PanelTitle>
        {scanMutation.isError ? (
          <div className="border-b border-white/5 p-4 sm:p-5">
            <ErrorNotice title="Re-scan failed" error={scanMutation.error} />
          </div>
        ) : null}
        {overview.isError && !scan ? (
          <p className="p-4 text-sm text-white/45 sm:p-5">
            No scan is available because the request failed. Fix the error above and refresh.
          </p>
        ) : (
          <ScanChecksTable scan={scan} />
        )}
      </section>

      <section className={`${PANEL} overflow-hidden`}>
        <PanelTitle>Run the repair loop</PanelTitle>
        <div className="space-y-4 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <Wrench className="mt-0.5 h-5 w-5 shrink-0 text-amber-200" />
            <p className="max-w-3xl text-sm text-white/60">
              A live run executes the repair actions the engine selects for every check currently reporting drift.
              Those actions grade pending picks, rewrite parlay leg identity fields, and recompute trust score
              summaries in the production database. A dry run performs the same work with writes suppressed.
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={`${AURORA_LABEL} text-white/45`}>Mode</span>
              <select
                value={runDryRun ? 'dry' : 'live'}
                onChange={(event) => {
                  setRunDryRun(event.target.value === 'dry');
                  setRunConfirmOpen(false);
                }}
                disabled={isBusy}
                className="min-h-10 rounded-md border border-white/10 bg-black/35 px-3 text-sm text-white focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400 disabled:opacity-45"
              >
                <option value="dry">Dry run — no writes</option>
                <option value="live">Live run — writes to production</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={`${AURORA_LABEL} text-white/45`}>Max actions</span>
              <select
                value={maxActions}
                onChange={(event) => {
                  setMaxActions(Number(event.target.value));
                  setRunConfirmOpen(false);
                }}
                disabled={isBusy}
                className="min-h-10 rounded-md border border-white/10 bg-black/35 px-3 text-sm text-white focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400 disabled:opacity-45"
              >
                {maxActionsOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            {runConfirmOpen ? null : (
              <button
                type="button"
                className={runDryRun ? PRIMARY_BUTTON : DANGER_BUTTON}
                onClick={() => setRunConfirmOpen(true)}
                disabled={isBusy || !scan}
              >
                <ChevronRight className="h-4 w-4" />
                {runDryRun ? 'Prepare dry run' : 'Prepare live run'}
              </button>
            )}
          </div>

          {runConfirmOpen ? (
            <div
              className={`rounded-md border p-4 ${
                runDryRun ? 'border-white/12 bg-white/[0.03]' : 'border-rose-400/35 bg-rose-500/10'
              }`}
            >
              <div className="flex items-start gap-2">
                <AlertTriangle
                  className={`mt-0.5 h-4 w-4 shrink-0 ${runDryRun ? 'text-white/60' : 'text-rose-200'}`}
                />
                <div>
                  <p className="text-sm font-semibold text-white">
                    {runDryRun
                      ? 'Confirm dry run — the engine will simulate repairs and write nothing.'
                      : 'Confirm live run — the engine will write to the production database.'}
                  </p>
                  <p className="mt-1 text-xs text-white/60">
                    Up to {maxActions} action{maxActions === 1 ? '' : 's'} will run against the scan from{' '}
                    {formatDate(scan?.generatedAt)}.
                  </p>
                </div>
              </div>

              <div className="mt-3">
                <p className={`${AURORA_LABEL} text-white/45`}>Actions this run will execute</p>
                {pendingRunActionIds.length ? (
                  <ul className="mt-2 space-y-1.5">
                    {pendingRunActionIds.map((actionId) => {
                      const definition = actionCatalog.find((entry) => entry.id === actionId) ?? null;
                      return (
                        <li
                          key={actionId}
                          className="rounded-md border border-white/8 bg-black/25 px-3 py-2 text-sm text-white/75"
                        >
                          <span className="font-medium text-white">{definition?.title ?? actionId}</span>
                          <span className={`${AURORA_FONT_MONO} ml-2 text-[10px] text-white/40`}>{actionId}</span>
                          <p className="mt-0.5 text-xs text-white/50">
                            {definition?.description ?? 'The action catalog returned no description for this action.'}
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-white/55">
                    No check is reporting drift, so this run would execute no actions.
                  </p>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className={runDryRun ? PRIMARY_BUTTON : DANGER_BUTTON}
                  onClick={confirmRun}
                  disabled={isBusy}
                >
                  {runMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wrench className="h-4 w-4" />}
                  {runDryRun ? 'Yes, run the dry run' : 'Yes, run live and write changes'}
                </button>
                <button
                  type="button"
                  className={BUTTON}
                  onClick={() => setRunConfirmOpen(false)}
                  disabled={runMutation.isPending}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}

          {runMutation.isPending ? (
            <p className="text-sm text-white/55">
              The loop is running. It re-scans, executes the selected actions, then re-scans again, so this can take a
              while on a large backlog.
            </p>
          ) : null}
          {runMutation.isError ? <ErrorNotice title="Repair loop failed" error={runMutation.error} /> : null}
        </div>
      </section>

      <section className={`${PANEL} overflow-hidden`}>
        <PanelTitle
          action={
            <span className="text-xs text-white/40">
              {runMutation.data
                ? `Finished ${formatDate(runMutation.data.finishedAt)}`
                : lastLoop
                  ? `Finished ${formatDate(lastLoop.finishedAt)}`
                  : ''}
            </span>
          }
        >
          {runMutation.data ? 'Loop report from this session' : 'Most recent loop report'}
        </PanelTitle>
        {runMutation.data ? (
          <LoopReportCard report={runMutation.data} />
        ) : lastLoop ? (
          <LoopReportCard report={lastLoop} />
        ) : (
          <p className="p-4 text-sm text-white/45 sm:p-5">
            The engine has not run a repair loop since the server process started, so there is no report to show.
          </p>
        )}
      </section>

      <section className={`${PANEL} overflow-hidden`}>
        <PanelTitle>Inspect a single action</PanelTitle>
        <div className="grid gap-0 lg:grid-cols-[280px_minmax(0,1fr)] lg:divide-x lg:divide-white/5">
          <div className="divide-y divide-white/5 border-b border-white/5 lg:border-b-0">
            {actionCatalog.length ? (
              actionCatalog.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => {
                    setSelectedActionId(action.id);
                    setProbedResult(null);
                  }}
                  className={`flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm transition-colors ${
                    selectedActionId === action.id
                      ? 'bg-emerald-500/10 text-white'
                      : 'text-white/60 hover:bg-white/[0.04] hover:text-white'
                  }`}
                >
                  <span>
                    <span className="block font-medium">{action.title || action.id}</span>
                    <span className={`${AURORA_FONT_MONO} block text-[10px] text-white/40`}>{action.id}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-white/30" />
                </button>
              ))
            ) : (
              <p className="px-4 py-9 text-center text-sm text-white/45">
                The scan returned no action catalog.
              </p>
            )}
          </div>

          <div className="p-4 sm:p-5">
            {!selectedAction ? (
              <p className="text-sm text-white/45">
                Select an action to see its definition, the checks it repairs, and its result in the most recent loop.
              </p>
            ) : (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-white">{selectedAction.title || selectedAction.id}</h4>
                  <p className="mt-1 text-sm text-white/55">
                    {selectedAction.description || 'The action catalog returned no description for this action.'}
                  </p>
                  <p className="mt-2 text-xs text-white/40">
                    Dry run supported: {selectedAction.dryRunSupported ? 'yes' : 'no'}
                  </p>
                </div>

                <div>
                  <p className={`${AURORA_LABEL} text-white/45`}>Checks this action repairs</p>
                  {selectedActionChecks.length ? (
                    <ul className="mt-2 space-y-1.5">
                      {selectedActionChecks.map((check) => (
                        <li
                          key={check.id}
                          className="flex items-start gap-2 rounded-md border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-white/70"
                        >
                          {check.status === 'ok' ? (
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                          ) : (
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" />
                          )}
                          <span>
                            <span className="block text-white">{check.title || check.id}</span>
                            <span className={`block text-xs text-white/45 ${AURORA_TABULAR}`}>
                              detectedCount {formatNumber(check.detectedCount)} · severity {check.severity || NO_VALUE}
                            </span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-white/45">
                      No check in the current scan lists this action as a repair.
                    </p>
                  )}
                </div>

                <div>
                  <p className={`${AURORA_LABEL} text-white/45`}>Result in the most recent loop</p>
                  <div className="mt-2">
                    {selectedActionLastResult ? (
                      <ActionResultCard result={selectedActionLastResult} />
                    ) : (
                      <p className="text-sm text-white/45">
                        This action did not run in the most recent loop report.
                      </p>
                    )}
                  </div>
                </div>

                <div className="border-t border-white/5 pt-4">
                  <p className="text-xs text-white/50">
                    The API has no read-only status endpoint for a single action. Probing runs the action with writes
                    suppressed and returns the summary the engine produced.
                  </p>
                  <button
                    type="button"
                    className={`${BUTTON} mt-3`}
                    onClick={() => probeAction(selectedAction.id)}
                    disabled={isBusy || !selectedAction.dryRunSupported}
                  >
                    {actionMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Gauge className="h-4 w-4" />
                    )}
                    Dry-run probe · no writes
                  </button>
                  {!selectedAction.dryRunSupported ? (
                    <p className="mt-2 text-xs text-amber-100/80">
                      This action does not support dry runs, so it cannot be probed without writing.
                    </p>
                  ) : null}
                  {actionMutation.isError ? (
                    <div className="mt-3">
                      <ErrorNotice title="Dry-run probe failed" error={actionMutation.error} />
                    </div>
                  ) : null}
                  {probedResult && probedResult.actionId === selectedAction.id ? (
                    <div className="mt-3">
                      <ActionResultCard result={probedResult} />
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Requests since boot"
          value={formatNumber(metrics?.totals?.requests)}
          detail={metrics ? `Uptime ${formatUptime(metrics.uptimeMs)}` : 'Metrics unavailable'}
        />
        <MetricCard
          label="5xx responses"
          value={formatNumber(metrics?.totals?.errors)}
          detail={metrics ? `${formatNumber(metrics.totals?.slowRequests)} slow requests` : undefined}
        />
        <MetricCard
          label="P95 latency"
          value={formatMs(metrics?.latencyMs?.p95)}
          detail={metrics ? `Avg ${formatMs(metrics.latencyMs?.avg)} · max ${formatMs(metrics.latencyMs?.max)}` : undefined}
        />
        <MetricCard
          label="Legacy route hits"
          value={formatNumber(legacyRoutes?.totals?.hits)}
          detail={
            legacyRoutes ? `${formatNumber(legacyRoutes.totals?.uniqueRoutes)} distinct legacy routes` : undefined
          }
        />
      </section>

      <section className={`${PANEL} overflow-hidden`}>
        <PanelTitle
          action={
            <span className="text-xs text-white/40">
              {routeMetrics.data?.schema ? `Schema ${routeMetrics.data.schema}` : ''}
            </span>
          }
        >
          Response status distribution
        </PanelTitle>
        {metrics?.statusClasses ? (
          <div className="grid grid-cols-2 divide-white/5 sm:grid-cols-4 sm:divide-x">
            {(['2xx', '3xx', '4xx', '5xx'] as const).map((statusClass) => (
              <div key={statusClass} className="p-4 sm:p-5">
                <p className={`${AURORA_LABEL} text-white/45`}>{statusClass}</p>
                <p className={`mt-2 text-xl font-semibold text-white ${AURORA_TABULAR}`}>
                  {formatNumber(metrics.statusClasses[statusClass])}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="p-4 text-sm text-white/45 sm:p-5">The metrics snapshot returned no status distribution.</p>
        )}
      </section>

      <section className={`${PANEL} overflow-hidden`}>
        <PanelTitle
          action={
            <span className="text-xs text-white/40">
              {routeMetrics.data?.updatedAt ? `Snapshot ${formatDate(routeMetrics.data.updatedAt)}` : ''}
            </span>
          }
        >
          Busiest routes
        </PanelTitle>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm text-white/70">
            <thead className="border-b border-white/5 bg-white/[0.02] text-xs uppercase text-white/45">
              <tr>
                <th className={TH}>Route</th>
                <th className={TH}>Requests</th>
                <th className={TH}>5xx</th>
                <th className={TH}>Avg</th>
                <th className={TH}>P95</th>
                <th className={TH}>Max</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {metrics?.routes?.length ? (
                metrics.routes.map((row) => (
                  <tr key={`${row.method} ${row.route}`}>
                    <td className={CELL}>
                      <span className={`${AURORA_FONT_MONO} text-xs text-white`}>
                        {row.method} {row.route}
                      </span>
                    </td>
                    <td className={`${CELL} ${AURORA_TABULAR}`}>{formatNumber(row.requests)}</td>
                    <td className={`${CELL} ${AURORA_TABULAR}`}>{formatNumber(row.errors)}</td>
                    <td className={`${CELL} ${AURORA_TABULAR}`}>{formatMs(row.avgMs)}</td>
                    <td className={`${CELL} ${AURORA_TABULAR}`}>{formatMs(row.p95Ms)}</td>
                    <td className={`${CELL} ${AURORA_TABULAR}`}>{formatMs(row.maxMs)}</td>
                  </tr>
                ))
              ) : (
                <EmptyRow columns={6}>
                  No route has been recorded since this server process started.
                </EmptyRow>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className={`${PANEL} overflow-hidden`}>
        <PanelTitle>Recent slow or failing requests</PanelTitle>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm text-white/70">
            <thead className="border-b border-white/5 bg-white/[0.02] text-xs uppercase text-white/45">
              <tr>
                <th className={TH}>When</th>
                <th className={TH}>Route</th>
                <th className={TH}>Status</th>
                <th className={TH}>Duration</th>
                <th className={TH}>Request ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {metrics?.recent?.length ? (
                metrics.recent.map((event) => (
                  <tr key={`${event.at}-${event.method}-${event.route}`}>
                    <td className={`${CELL} text-xs text-white/50`}>{formatDate(event.at)}</td>
                    <td className={CELL}>
                      <span className={`${AURORA_FONT_MONO} text-xs text-white`}>
                        {event.method} {event.route}
                      </span>
                    </td>
                    <td className={`${CELL} ${AURORA_TABULAR}`}>{formatNumber(event.status)}</td>
                    <td className={`${CELL} ${AURORA_TABULAR}`}>{formatMs(event.durationMs)}</td>
                    <td className={`${CELL} ${AURORA_FONT_MONO} text-[10px] text-white/45`}>
                      {event.requestId ?? NO_VALUE}
                    </td>
                  </tr>
                ))
              ) : (
                <EmptyRow columns={5}>
                  The server has recorded no slow or failing request since it started.
                </EmptyRow>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className={`${PANEL} overflow-hidden`}>
        <PanelTitle
          action={
            <span className="text-xs text-white/40">
              {parlayGrade?.contractVersion ? `Contract ${parlayGrade.contractVersion}` : ''}
            </span>
          }
        >
          Parlay grading pipeline
        </PanelTitle>
        {parlayGrade ? (
          <>
            <div className="grid grid-cols-2 divide-white/5 sm:grid-cols-5 sm:divide-x">
              <div className="p-4">
                <p className={`${AURORA_LABEL} text-white/45`}>Requests</p>
                <p className={`mt-2 text-lg font-semibold text-white ${AURORA_TABULAR}`}>
                  {formatNumber(parlayGrade.totals?.requests)}
                </p>
              </div>
              <div className="p-4">
                <p className={`${AURORA_LABEL} text-white/45`}>Successes</p>
                <p className={`mt-2 text-lg font-semibold text-white ${AURORA_TABULAR}`}>
                  {formatNumber(parlayGrade.totals?.successes)}
                </p>
              </div>
              <div className="p-4">
                <p className={`${AURORA_LABEL} text-white/45`}>Validation errors</p>
                <p className={`mt-2 text-lg font-semibold text-white ${AURORA_TABULAR}`}>
                  {formatNumber(parlayGrade.totals?.validationErrors)}
                </p>
              </div>
              <div className="p-4">
                <p className={`${AURORA_LABEL} text-white/45`}>Failures</p>
                <p className={`mt-2 text-lg font-semibold text-white ${AURORA_TABULAR}`}>
                  {formatNumber(parlayGrade.totals?.failures)}
                </p>
              </div>
              <div className="p-4">
                <p className={`${AURORA_LABEL} text-white/45`}>All legs pending</p>
                <p className={`mt-2 text-lg font-semibold text-white ${AURORA_TABULAR}`}>
                  {formatNumber(parlayGrade.totals?.allLegsPending)}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 border-t border-white/5 text-xs text-white/45 sm:grid-cols-3">
              <p className="p-3">P95 {formatMs(parlayGrade.latencyMs?.p95)}</p>
              <p className="p-3">Legs graded {formatNumber(parlayGrade.legs?.totalGraded)}</p>
              <p className="p-3">Avg legs per request {formatNumber(parlayGrade.legs?.avgPerRequest)}</p>
            </div>
            <div className="border-t border-white/5 p-4 sm:p-5">
              <p className={`${AURORA_LABEL} text-white/45`}>Top validation failure paths</p>
              {parlayGrade.validationFailurePaths?.length ? (
                <ul className="mt-2 space-y-1.5">
                  {parlayGrade.validationFailurePaths.map((entry) => (
                    <li
                      key={entry.path}
                      className="flex items-center justify-between gap-3 rounded-md border border-white/8 bg-white/[0.03] px-3 py-2"
                    >
                      <span className={`${AURORA_FONT_MONO} text-xs text-white/80`}>{entry.path || NO_VALUE}</span>
                      <span className={`text-sm text-white ${AURORA_TABULAR}`}>{formatNumber(entry.count)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-white/45">No grading request has failed validation since boot.</p>
              )}
            </div>
          </>
        ) : (
          <p className="p-4 text-sm text-white/45 sm:p-5">
            The metrics snapshot returned no parlay grading telemetry.
          </p>
        )}
      </section>

      <section className={`${PANEL} overflow-hidden`}>
        <PanelTitle
          action={
            <span className="text-xs text-white/40">
              {coreHealth.data?.time ? `Reported ${formatDate(coreHealth.data.time)}` : ''}
            </span>
          }
        >
          Core route registration
        </PanelTitle>
        <div className="p-4 sm:p-5">
          <p className="text-xs text-white/45">
            {coreHealth.data?.service ? `${coreHealth.data.service} · ` : ''}
            status {coreHealth.data?.status ?? NO_VALUE}. This endpoint reports which route groups the process
            registered at boot; it does not measure traffic.
          </p>
          {coreHealth.data?.routes && Object.keys(coreHealth.data.routes).length ? (
            <ul className="mt-3 grid gap-2 sm:grid-cols-3">
              {Object.entries(coreHealth.data.routes).map(([name, registered]) => (
                <li
                  key={name}
                  className="flex items-center gap-2 rounded-md border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-white/70"
                >
                  {registered ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-200" />
                  )}
                  <span className={`${AURORA_FONT_MONO} text-xs`}>{name}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-white/45">The endpoint returned no route registration map.</p>
          )}
        </div>
      </section>

      {legacyRoutes?.routes?.length ? (
        <section className={`${PANEL} overflow-hidden`}>
          <PanelTitle>Legacy routes still being called</PanelTitle>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm text-white/70">
              <thead className="border-b border-white/5 bg-white/[0.02] text-xs uppercase text-white/45">
                <tr>
                  <th className={TH}>Label</th>
                  <th className={TH}>Route</th>
                  <th className={TH}>Hits</th>
                  <th className={TH}>Last seen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {legacyRoutes.routes.map((row) => (
                  <tr key={`${row.label}-${row.method}-${row.route}`}>
                    <td className={CELL}>{row.label || NO_VALUE}</td>
                    <td className={CELL}>
                      <span className={`${AURORA_FONT_MONO} text-xs text-white`}>
                        {row.method} {row.route}
                      </span>
                    </td>
                    <td className={`${CELL} ${AURORA_TABULAR}`}>{formatNumber(row.hits)}</td>
                    <td className={`${CELL} text-xs text-white/50`}>{formatDate(row.lastSeenAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
