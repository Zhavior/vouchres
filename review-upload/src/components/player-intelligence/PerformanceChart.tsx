export interface PerformanceGameRow {
  /** Short label under the bar — date or opponent abbreviation. */
  label: string;
  /** The counted outcome for this game, e.g. total bases, HRs, points. */
  value: number;
  /** True if this game cleared the evaluated line/threshold. */
  hit: boolean;
}

export type PerformanceChartState = 'loading' | 'empty' | 'ready';

export interface PerformanceChartProps {
  title: string;
  games: PerformanceGameRow[];
  state: PerformanceChartState;
  emptyMessage?: string;
  /** e.g. "Total bases" — shown as the y-axis / bar meaning. */
  metricLabel?: string;
  /** The line being evaluated, e.g. "Line 1.5" — renders as a dashed threshold. */
  thresholdLabel?: string;
  threshold?: number;
  className?: string;
}

/**
 * A chart is a decision instrument, not decoration: every bar shows whether
 * that game cleared the evaluated line, with the threshold drawn explicitly
 * rather than left for the reader to infer from color alone.
 */
export function PerformanceChart({
  title,
  games,
  state,
  emptyMessage = 'No game log available for this window yet.',
  metricLabel,
  thresholdLabel,
  threshold,
  className = '',
}: PerformanceChartProps) {
  const max = Math.max(1, ...games.map((g) => g.value));
  const hitCount = games.filter((g) => g.hit).length;

  return (
    <div className={className}>
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-black uppercase tracking-[0.1em] text-white">{title}</p>
        {thresholdLabel && <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/35">{thresholdLabel}</span>}
      </div>

      {state === 'loading' && (
        <div className="mt-4 flex h-32 items-end gap-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex-1 animate-pulse rounded-t-md bg-white/[0.06]" style={{ height: `${30 + (i % 5) * 12}%` }} />
          ))}
        </div>
      )}

      {state === 'empty' && (
        <div className="mt-4 rounded-2xl border border-dashed border-white/15 px-4 py-8 text-center text-sm text-white/45">
          {emptyMessage}
        </div>
      )}

      {state === 'ready' && games.length > 0 && (
        <>
          <div className="relative mt-4 flex h-32 items-end gap-2" role="img" aria-label={`${title}: ${hitCount} of ${games.length} games cleared ${thresholdLabel ?? 'the line'}.`}>
            {threshold != null && (
              <div
                className="pointer-events-none absolute inset-x-0 border-t border-dashed"
                style={{ bottom: `${Math.min(100, (threshold / max) * 100)}%`, borderColor: 'hsl(var(--ve-accent) / 0.4)' }}
                aria-hidden="true"
              />
            )}
            {games.map((g, i) => {
              const heightPct = Math.max(6, (g.value / max) * 100);
              return (
                <div key={i} className="group relative flex flex-1 flex-col items-center justify-end gap-1.5">
                  <span className="text-[10px] font-bold tabular-nums text-white/50 opacity-0 transition-opacity group-hover:opacity-100">
                    {g.value}
                  </span>
                  <div
                    className="w-full rounded-t-md transition-[filter]"
                    style={{
                      height: `${heightPct}%`,
                      background: g.hit ? 'hsl(var(--ve-positive))' : 'rgba(255,255,255,0.10)',
                    }}
                  />
                  <span className="max-w-full truncate text-[9px] font-semibold text-white/35">{g.label}</span>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-white/45">
            <strong className="text-white">{hitCount} of {games.length}</strong>
            {thresholdLabel ? ` cleared ${thresholdLabel.toLowerCase()}` : ' hit'}
            {metricLabel ? ` · ${metricLabel}` : ''}
          </p>
        </>
      )}
    </div>
  );
}
