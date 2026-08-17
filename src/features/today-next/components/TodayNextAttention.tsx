import { AlertTriangle, ArrowUpRight, Database, Gamepad2, Target } from 'lucide-react';
import type { TodayAttentionItem, TodayDecision } from '../../../components/today/todayDecisionModel';

interface TodayNextAttentionProps {
  decision: TodayDecision;
  onRoute: (section: string) => void;
}

const KIND_ICON = {
  data: Database,
  slate: Gamepad2,
  action: Target,
} as const;

function toneFor(item: TodayAttentionItem): string {
  const value = `${item.value} ${item.detail}`.toLowerCase();
  if (/unavailable|incomplete|missing|degraded|cannot|needs verification/.test(value)) {
    return 'text-amber-300';
  }
  if (/available|complete|pending/.test(value)) return 'text-[var(--aurora-max-emerald)]';
  return 'text-white';
}

export function TodayNextAttention({ decision, onRoute }: TodayNextAttentionProps) {
  return (
    <section aria-label="What needs attention">
      <h2 className="mb-2.5 flex items-center gap-2 font-mono text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
        <AlertTriangle className="h-3 w-3" aria-hidden="true" />
        Needs attention
      </h2>

      <div className="grid gap-2.5 sm:grid-cols-3">
        {decision.attention.map((item) => {
          const Icon = KIND_ICON[item.kind];
          const routable = Boolean(item.section);

          return (
            <div
              key={item.id}
              className="flex flex-col rounded-xl border border-white/10 bg-ve-obsidian/90 p-3.5 font-mono transition-colors hover:border-white/20"
            >
              <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-white/35">
                <Icon className="h-3 w-3" aria-hidden="true" />
                {item.label}
              </span>

              <strong className={`mt-1.5 block text-sm font-black leading-tight ${toneFor(item)}`}>
                {item.value}
              </strong>

              <p className="mt-1.5 flex-1 text-[11px] leading-4 text-white/45">{item.detail}</p>

              {routable && (
                <button
                  type="button"
                  onClick={() => onRoute(item.section!)}
                  className="mt-2.5 inline-flex items-center gap-1 self-start text-[10px] font-black uppercase tracking-wider text-vouch-emerald transition hover:underline"
                >
                  Open <ArrowUpRight className="h-3 w-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
