import type { ReactNode } from 'react';

export interface MarketDecisionProps {
  /** e.g. "Decision brief" */
  eyebrow: string;
  title: string;
  score: number;
  /** Compact status row — freshness, lineup, pitcher labels. */
  statusItems?: string[];
  action: ReactNode;
  className?: string;
}

/**
 * The above-the-fold answer to "what does VouchEdge currently think, and how
 * confident is it." Deliberately score-forward and short — the supporting
 * "why" belongs in an adjacent EvidenceStack, not inside this card.
 */
export function MarketDecision({ eyebrow, title, score, statusItems = [], action, className = '' }: MarketDecisionProps) {
  return (
    <section
      className={`rounded-3xl border border-white/10 bg-white/[0.03] p-5 ${className}`}
      aria-label="Player decision brief"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[hsl(var(--ve-accent))]">{eyebrow}</p>
          <h3 className="mt-1 max-w-md text-balance text-base font-black leading-snug text-white">{title}</h3>
        </div>
        <span className="shrink-0 text-3xl font-black tabular-nums text-white">{Math.round(score)}</span>
      </div>

      {statusItems.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-white/10 pt-3 text-[11px] font-semibold text-white/45">
          {statusItems.map((item, i) => (
            <span key={i} className="flex items-center gap-3">
              {i > 0 && <span className="text-white/15">·</span>}
              {item}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4">{action}</div>
    </section>
  );
}
