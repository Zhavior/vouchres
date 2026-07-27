import { Clock3, ShieldCheck, Sparkles, TriangleAlert } from 'lucide-react';

export type DataFreshnessTone = 'fresh' | 'stale' | 'unavailable';

export interface DataFreshnessProps {
  /** e.g. "Updated 3m ago", "Confirmed lineup", "Projected — not yet posted" */
  label: string;
  tone?: DataFreshnessTone;
  /** Optional second line, e.g. source name or lineup detail */
  detail?: string;
  className?: string;
}

const TONE: Record<DataFreshnessTone, { icon: typeof Clock3; text: string; ring: string; bg: string }> = {
  fresh: { icon: ShieldCheck, text: 'text-[hsl(var(--ve-positive))]', ring: 'ring-[hsl(var(--ve-positive)/0.28)]', bg: 'bg-[hsl(var(--ve-positive)/0.10)]' },
  stale: { icon: TriangleAlert, text: 'text-[hsl(var(--ve-caution))]', ring: 'ring-[hsl(var(--ve-caution)/0.28)]', bg: 'bg-[hsl(var(--ve-caution)/0.10)]' },
  unavailable: { icon: Sparkles, text: 'text-white/40', ring: 'ring-white/15', bg: 'bg-white/[0.03]' },
};

/**
 * A single, reusable "how current is this?" signal — freshness, lineup
 * confirmation, or source status. Used anywhere a card needs to disclose
 * data recency instead of implying everything shown is live-confirmed.
 */
export function DataFreshness({ label, tone = 'fresh', detail, className = '' }: DataFreshnessProps) {
  const t = TONE[tone];
  const Icon = t.icon;
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${t.text} ${t.ring} ${t.bg} ${className}`}
    >
      <Icon className="h-3 w-3 shrink-0" />
      <span>{label}</span>
      {detail && <span className="text-white/35 font-normal">· {detail}</span>}
    </div>
  );
}
