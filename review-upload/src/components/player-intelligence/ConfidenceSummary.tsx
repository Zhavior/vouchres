export interface ConfidenceStat {
  label: string;
  value: string | number;
}

export interface ConfidenceSummaryProps {
  /** 0-100 confidence/signal score. */
  score: number;
  /** e.g. "Weighted composite", "Model confidence" */
  label: string;
  color?: string;
  /** Compact breakdown row, e.g. Power / Pitcher / Form sub-scores. */
  stats?: ConfidenceStat[];
  /** Model-vs-market edge, when a market comparison exists. */
  edge?: { value: number; positive: boolean } | null;
  size?: number;
  className?: string;
}

/**
 * A score or probability must never appear without accessible reasoning
 * nearby — this renders the number, but callers should always pair it with
 * an EvidenceStack explaining why. Ring uses conic-gradient, not a chart
 * library, since it's a single value on a fixed 0-100 scale.
 */
export function ConfidenceSummary({
  score,
  label,
  color = 'hsl(var(--ve-accent))',
  stats = [],
  edge,
  size = 80,
  className = '',
}: ConfidenceSummaryProps) {
  const pct = Math.max(0, Math.min(100, score));
  return (
    <div className={className}>
      <div className="flex items-center gap-4">
        <div
          className="relative flex shrink-0 items-center justify-center rounded-full"
          style={{
            width: size,
            height: size,
            background: `conic-gradient(${color} ${pct * 3.6}deg, rgba(255,255,255,0.08) 0)`,
          }}
        >
          <div
            className="flex items-center justify-center rounded-full"
            style={{ width: size - 14, height: size - 14, background: 'hsl(var(--ve-surface-1))' }}
          >
            <span className="text-xl font-black tabular-nums text-white">{score > 0 ? Math.round(score) : '—'}</span>
          </div>
        </div>

        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/40">{label}</p>
          {stats.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-white/60">
              {stats.map((s) => (
                <span key={s.label}>
                  {s.label} <strong className="text-white">{s.value}</strong>
                </span>
              ))}
            </div>
          )}
          {edge && (
            <p className={`mt-1.5 font-mono text-[11px] ${edge.positive ? 'text-[hsl(var(--ve-positive))]' : 'text-[hsl(var(--ve-negative))]'}`}>
              Edge {edge.value >= 0 ? '+' : ''}
              {(edge.value * 100).toFixed(1)}%
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
