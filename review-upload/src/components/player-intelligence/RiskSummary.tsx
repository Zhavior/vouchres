import { AlertTriangle } from 'lucide-react';

export interface RiskSummaryProps {
  /** The single biggest reason this signal could be wrong. */
  risk: string;
  /** What condition would change the read, e.g. "Verify the lineup before saving." */
  whatCouldChange?: string | null;
  className?: string;
}

/**
 * Isolates the "this could be wrong because..." read from the positive case
 * in EvidenceStack/MarketDecision — risk gets its own visual weight (caution
 * tone) so it can't be skimmed past as just another bullet.
 */
export function RiskSummary({ risk, whatCouldChange, className = '' }: RiskSummaryProps) {
  return (
    <div
      className={`flex items-start gap-3 rounded-2xl px-4 py-3.5 ring-1 ${className}`}
      style={{ background: 'hsl(var(--ve-caution) / 0.08)', borderColor: 'transparent' }}
    >
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg" style={{ background: 'hsl(var(--ve-caution) / 0.16)' }}>
        <AlertTriangle className="h-3.5 w-3.5" style={{ color: 'hsl(var(--ve-caution))' }} />
      </span>
      <div className="min-w-0">
        <p className="font-mono text-[9px] font-black uppercase tracking-[0.14em]" style={{ color: 'hsl(var(--ve-caution))' }}>
          Biggest risk
        </p>
        <p className="mt-0.5 text-sm leading-snug text-white/80">{risk}</p>
        {whatCouldChange && <p className="mt-1 text-xs text-white/45">{whatCouldChange}</p>}
      </div>
    </div>
  );
}
