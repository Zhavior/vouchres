import { ShieldCheck, TrendingUp, Activity, CloudSun, HelpCircle, TriangleAlert } from 'lucide-react';

export type EvidenceTone = 'strongest' | 'matchup' | 'form' | 'environment' | 'uncertainty' | 'counter';

export interface EvidenceItem {
  tone: EvidenceTone;
  /** Short category label, e.g. "Strongest signal" — auto-filled from tone if omitted. */
  label?: string;
  text: string;
}

export interface EvidenceStackProps {
  items: EvidenceItem[];
  className?: string;
}

const TONE_META: Record<EvidenceTone, { label: string; icon: typeof ShieldCheck; color: string }> = {
  strongest: { label: 'Strongest signal', icon: TrendingUp, color: 'hsl(var(--ve-positive))' },
  matchup: { label: 'Supporting matchup', icon: ShieldCheck, color: 'hsl(var(--ve-accent))' },
  form: { label: 'Recent form', icon: Activity, color: 'hsl(var(--ve-positive))' },
  environment: { label: 'Environment', icon: CloudSun, color: 'hsl(var(--ve-accent))' },
  uncertainty: { label: 'Uncertainty', icon: HelpCircle, color: 'hsl(var(--ve-caution))' },
  counter: { label: 'Counter-signal', icon: TriangleAlert, color: 'hsl(var(--ve-negative))' },
};

/**
 * Converts model output into structured, ranked evidence — never a single
 * generic paragraph. Each item is one claim with one category, so a reader
 * can scan "why" in seconds instead of parsing prose.
 */
export function EvidenceStack({ items, className = '' }: EvidenceStackProps) {
  if (items.length === 0) return null;
  return (
    <div className={`flex flex-col ${className}`}>
      {items.map((item, i) => {
        const meta = TONE_META[item.tone];
        const Icon = meta.icon;
        return (
          <div
            key={i}
            className={`flex items-start gap-3 py-2.5 ${i > 0 ? 'border-t border-white/[0.06]' : ''}`}
          >
            <span
              className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg"
              style={{ background: `${meta.color.replace('hsl(', 'hsl(').replace(')', ' / 0.12)')}` }}
            >
              <Icon className="h-3.5 w-3.5" style={{ color: meta.color }} />
            </span>
            <div className="min-w-0">
              <p className="font-mono text-[9px] font-black uppercase tracking-[0.14em]" style={{ color: meta.color }}>
                {item.label ?? meta.label}
              </p>
              <p className="mt-0.5 text-sm leading-snug text-white/75">{item.text}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
