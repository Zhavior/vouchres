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

function toneFor(item: TodayAttentionItem): { text: string; badge: string; border: string } {
  const value = `${item.value} ${item.detail}`.toLowerCase();
  if (/unavailable|incomplete|missing|degraded|cannot|needs verification/.test(value)) {
    return {
      text: 'text-amber-300',
      badge: 'border-amber-400/40 bg-amber-950/40 text-amber-300',
      border: 'border-amber-400/30',
    };
  }
  if (/available|complete|pending/.test(value)) {
    return {
      text: 'text-emerald-400',
      badge: 'border-emerald-400/40 bg-emerald-950/40 text-emerald-300',
      border: 'border-white/10 hover:border-emerald-400/50',
    };
  }
  return {
    text: 'text-white',
    badge: 'border-white/20 bg-zinc-900 text-zinc-300',
    border: 'border-white/10 hover:border-white/30',
  };
}

export function TodayNextAttention({ decision, onRoute }: TodayNextAttentionProps) {
  return (
    <section aria-label="What needs attention" className="font-mono space-y-3">
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-400">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
          SYSTEM ATTENTION &amp; INTEGRITY
        </h2>
        <span className="text-[9px] text-zinc-600 uppercase">STAGE 01 AUDIT</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {decision.attention.map((item) => {
          const Icon = KIND_ICON[item.kind];
          const routable = Boolean(item.section);
          const tone = toneFor(item);

          return (
            <div
              key={item.id}
              className={`flex flex-col justify-between border-2 ${tone.border} bg-black p-4 font-mono transition-all`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-zinc-500">
                    <Icon className="h-3 w-3 text-zinc-400" aria-hidden="true" />
                    {item.label}
                  </span>
                  <span className={`px-1.5 py-0.2 text-[8px] font-bold uppercase border ${tone.badge}`}>
                    {item.kind}
                  </span>
                </div>

                <strong className={`block text-sm font-black leading-tight ${tone.text}`}>
                  {item.value}
                </strong>

                <p className="text-[11px] leading-relaxed text-zinc-400 font-sans">{item.detail}</p>
              </div>

              {routable && (
                <button
                  type="button"
                  onClick={() => onRoute(item.section!)}
                  className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-cyan-300 transition hover:text-white cursor-pointer"
                >
                  RESOLVE IN WORKSPACE <ArrowUpRight className="h-3 w-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

