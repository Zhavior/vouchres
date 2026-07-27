import { Minus, TrendingUp } from 'lucide-react';

export interface MatchupStat {
  label: string;
  value: string | number;
  color?: string;
}

export type MatchupBreakdownState = 'loading' | 'empty' | 'ready';

export interface MatchupBreakdownProps {
  title: string;
  subtitle?: string;
  state: MatchupBreakdownState;
  emptyMessage?: string;
  /** Headline stat tiles, e.g. career PA / HR / AVG / SLG. */
  stats?: MatchupStat[];
  /** A single closing read, e.g. "3 recorded career HRs against this pitcher." */
  narrative?: string;
  narrativeTone?: 'positive' | 'neutral' | 'caution';
  className?: string;
}

/**
 * Head-to-head history against a specific opponent (pitcher, defender,
 * team) — distinct from EvidenceStack's model signals because this is raw
 * recorded history, not a weighted score.
 */
export function MatchupBreakdown({
  title,
  subtitle,
  state,
  emptyMessage = 'No recorded history for this matchup. This is missing evidence, not a negative signal.',
  stats = [],
  narrative,
  narrativeTone = 'neutral',
  className = '',
}: MatchupBreakdownProps) {
  return (
    <div className={className}>
      <p className="text-sm font-black uppercase tracking-[0.1em] text-white">{title}</p>
      {subtitle && <p className="mt-0.5 text-xs text-white/40">{subtitle}</p>}

      {state === 'loading' && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-white/[0.04]" />
          ))}
        </div>
      )}

      {state === 'empty' && (
        <div className="mt-4 rounded-2xl border border-dashed border-white/15 px-4 py-6 text-center text-sm text-white/45">
          {emptyMessage}
        </div>
      )}

      {state === 'ready' && (
        <>
          {stats.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label} className="flex flex-col items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3">
                  <span className="text-2xl font-extrabold tabular-nums" style={{ color: s.color ?? '#ffffff' }}>
                    {s.value}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wide text-white/40">{s.label}</span>
                </div>
              ))}
            </div>
          )}

          {narrative && (
            <div className="mt-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              {narrativeTone === 'positive' ? (
                <TrendingUp className="h-5 w-5 shrink-0" style={{ color: 'hsl(var(--ve-positive))' }} />
              ) : (
                <Minus className="h-5 w-5 shrink-0 text-white/35" />
              )}
              <p className="text-sm text-white/75">{narrative}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
