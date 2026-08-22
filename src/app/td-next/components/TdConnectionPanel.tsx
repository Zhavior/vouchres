import React from 'react';
import { AlertTriangle, CheckCircle2, Database, RefreshCw, WifiOff } from 'lucide-react';
import type { TdBoardConnectionState, TdBoardV2Response } from '../../../types/touchdown';

const LABELS: Record<TdBoardConnectionState, string> = {
  live: 'Live source-backed board',
  refreshing: 'Refreshing provider data',
  partial: 'Partial provider coverage',
  stale: 'Bounded last-good snapshot',
  unavailable: 'Provider unavailable',
  not_configured: 'Production feed required',
};

export function TdConnectionPanel({
  connection,
  board,
  error,
  onRefresh,
}: {
  connection: TdBoardConnectionState;
  board: TdBoardV2Response | null;
  error: unknown;
  onRefresh: () => void;
}) {
  const healthy = connection === 'live';
  const caution = connection === 'partial' || connection === 'stale' || connection === 'refreshing';
  const Icon = healthy ? CheckCircle2 : caution ? Database : WifiOff;
  const ageMinutes = board?.staleAgeMs == null ? null : Math.max(1, Math.round(board.staleAgeMs / 60_000));
  const message = board?.warnings?.[0]
    ?? (error instanceof Error ? error.message : null)
    ?? 'TD Next is waiting for a verified NFL data source.';

  return (
    <section
      data-testid="td-connection-panel"
      className={`border px-4 py-3 font-mono ${
        healthy
          ? 'border-emerald-500/40 bg-emerald-950/20'
          : caution
            ? 'border-amber-500/40 bg-amber-950/20'
            : 'border-rose-500/40 bg-rose-950/20'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${healthy ? 'text-emerald-400' : caution ? 'text-amber-400' : 'text-rose-400'}`} />
          <div className="min-w-0">
            <div className="text-xs font-black uppercase tracking-widest text-white">{LABELS[connection]}</div>
            <p className="mt-1 text-[10px] leading-relaxed text-zinc-400">{message}</p>
            <div className="mt-1 flex flex-wrap gap-x-3 text-[9px] uppercase tracking-wider text-zinc-500">
              <span>Source: {board?.source ?? 'none'}</span>
              <span>Coverage: {board?.coverage.sourcedFieldPercent ?? 0}%</span>
              {ageMinutes != null && <span>Age: {ageMinutes}m</span>}
              {board?.sourceUpdatedAt && <span>Updated: {new Date(board.sourceUpdatedAt).toLocaleTimeString()}</span>}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-2 border border-white/15 bg-black px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-300 hover:border-cyan-400 hover:text-cyan-300"
        >
          {connection === 'refreshing' ? <RefreshCw className="h-3 w-3 animate-spin" /> : <AlertTriangle className="h-3 w-3" />}
          Retry
        </button>
      </div>
    </section>
  );
}
