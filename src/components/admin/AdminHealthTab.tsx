import { useCallback, useEffect, useState } from "react";
import { apiClient } from "../../lib/apiClient";

type BackendHealthReport = {
  status?: string;
  warnings?: string[];
  uptimeMs?: number;
  environment?: string;
  productionReadiness?: {
    requiredEnvComplete?: boolean;
    proofEnvComplete?: boolean;
    unsetCount?: number;
  };
  dependencies?: {
    redis?: { enabled?: boolean; mode?: string };
    sentry?: { enabled?: boolean; configured?: boolean };
    sportsHttp?: { upstreamFailures?: number; requests?: number };
  };
  cache?: Record<string, { hits?: number; misses?: number; size?: number }>;
  api?: {
    totals?: { requests?: number; errors?: number; slowRequests?: number };
    latencyMs?: { avg?: number; p95?: number; max?: number };
    statusClasses?: Record<string, number>;
    recent?: Array<{ at: string; route: string; status: number; durationMs: number; requestId?: string }>;
  };
  updatedAt?: string;
};

type MlbHealthReport = {
  status?: string;
  dataQuality?: string;
  warnings?: string[];
  consistency?: Record<string, unknown>;
  updatedAt?: string;
};

function StatusBadge({ status }: { status?: string }) {
  const tone =
    status === "ok"
      ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
      : status === "degraded"
        ? "border-amber-400/40 bg-amber-400/10 text-amber-200"
        : "border-red-400/40 bg-red-400/10 text-red-200";
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase ${tone}`}>
      {status ?? "unknown"}
    </span>
  );
}

export function AdminHealthTab() {
  const [backend, setBackend] = useState<BackendHealthReport | null>(null);
  const [mlb, setMlb] = useState<MlbHealthReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [backendRes, mlbRes] = await Promise.all([
        apiClient.get<BackendHealthReport>("/api/health/backend"),
        apiClient.get<MlbHealthReport>("/api/health/mlb"),
      ]);
      setBackend(backendRes);
      setMlb(mlbRes);
    } catch (err: unknown) {
      const message = err && typeof err === "object" && "message" in err
        ? String((err as { message?: string }).message)
        : "Health fetch failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), 60_000);
    return () => window.clearInterval(id);
  }, [refresh]);

  if (loading && !backend) {
    return <p className="text-sm text-white/60">Loading system health…</p>;
  }

  if (error && !backend) {
    return (
      <div className="rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-100">
        {error}
        <button type="button" className="ml-3 underline" onClick={() => void refresh()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="admin-health space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-bold text-white">System Health</h2>
        <button type="button" className="rounded-lg border border-white/15 px-3 py-1 text-sm text-white/80 hover:bg-white/5" onClick={() => void refresh()}>Refresh</button>
        {backend?.updatedAt && (
          <span className="text-xs text-white/45">Updated {new Date(backend.updatedAt).toLocaleTimeString()}</span>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="font-semibold text-white">Backend</h3>
            <StatusBadge status={backend?.status} />
          </div>
          <dl className="space-y-1 text-sm text-white/70">
            <div className="flex justify-between gap-2"><dt>Environment</dt><dd>{backend?.environment ?? "—"}</dd></div>
            <div className="flex justify-between gap-2"><dt>Uptime</dt><dd>{backend?.uptimeMs ? `${Math.round(backend.uptimeMs / 1000)}s` : "—"}</dd></div>
            <div className="flex justify-between gap-2"><dt>Redis</dt><dd>{backend?.dependencies?.redis?.mode ?? "—"}</dd></div>
            <div className="flex justify-between gap-2"><dt>Sentry</dt><dd>{backend?.dependencies?.sentry?.enabled ? "on" : "off"}</dd></div>
            <div className="flex justify-between gap-2"><dt>Env ready</dt><dd>{backend?.productionReadiness?.requiredEnvComplete ? "yes" : "no"}</dd></div>
          </dl>
          {backend?.warnings && backend.warnings.length > 0 && (
            <ul className="mt-3 space-y-1 text-xs text-amber-200/90">
              {backend.warnings.map((w) => <li key={w}>⚠ {w}</li>)}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="font-semibold text-white">MLB upstream</h3>
            <StatusBadge status={mlb?.status} />
          </div>
          <dl className="space-y-1 text-sm text-white/70">
            <div className="flex justify-between gap-2"><dt>Data quality</dt><dd>{mlb?.dataQuality ?? "—"}</dd></div>
          </dl>
          {mlb?.warnings && mlb.warnings.length > 0 && (
            <ul className="mt-3 space-y-1 text-xs text-amber-200/90">
              {mlb.warnings.map((w) => <li key={w}>⚠ {w}</li>)}
            </ul>
          )}
        </section>
      </div>

      {backend?.api && (
        <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <h3 className="mb-3 font-semibold text-white">API metrics (process lifetime)</h3>
          <div className="grid gap-3 text-sm text-white/70 sm:grid-cols-2 lg:grid-cols-4">
            <div>Requests: {backend.api.totals?.requests ?? 0}</div>
            <div>5xx: {backend.api.statusClasses?.["5xx"] ?? 0}</div>
            <div>p95: {backend.api.latencyMs?.p95 ?? 0}ms</div>
            <div>Slow: {backend.api.totals?.slowRequests ?? 0}</div>
          </div>
          {backend.api.recent && backend.api.recent.length > 0 && (
            <>
              <h4 className="mt-4 text-xs font-bold uppercase tracking-wider text-white/45">Recent errors / slow</h4>
              <ul className="mt-2 max-h-48 overflow-auto text-xs text-white/60">
                {backend.api.recent.slice(0, 8).map((row) => (
                  <li key={`${row.at}-${row.route}-${row.status}`} className="border-b border-white/5 py-1">
                    {row.status} {row.route} · {row.durationMs}ms
                    {row.requestId ? ` · ${row.requestId.slice(0, 8)}` : ""}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      <p className="text-xs text-white/40">
        Full JSON: <code className="text-white/55">GET /api/health/backend</code> · Runbook: <code className="text-white/55">docs/OPS.md</code>
      </p>
    </div>
  );
}
