import React from 'react';
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
      badge: 'border-amber-500/25 bg-amber-500/10 text-amber-300',
      border: 'border-amber-500/20',
    };
  }
  if (/available|complete|pending/.test(value)) {
    return {
      text: 'text-emerald-400',
      badge: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400',
      border: 'border-white/[0.08] hover:border-white/[0.18]',
    };
  }
  return {
    text: 'text-[#F4F4F5]',
    badge: 'border-white/[0.08] bg-white/[0.04] text-zinc-300',
    border: 'border-white/[0.08] hover:border-white/[0.18]',
  };
}

export function TodayNextAttention({ decision, onRoute }: TodayNextAttentionProps) {
  return (
    <section aria-label="What needs attention" className="font-mono space-y-3">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
        <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
          SYSTEM ATTENTION &amp; INTEGRITY
        </h2>
        <span className="text-[9px] text-zinc-500 uppercase font-mono">STAGE 01 AUDIT</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {decision.attention.map((item) => {
          const Icon = KIND_ICON[item.kind];
          const routable = Boolean(item.section);
          const tone = toneFor(item);

          return (
            <div
              key={item.id}
              onClick={routable ? () => onRoute(item.section!) : undefined}
              className={`group flex flex-col justify-between border ${tone.border} bg-[#111113] p-4 font-mono rounded-xl transition-all shadow-md ${
                routable ? 'cursor-pointer hover:bg-[#18181B]' : ''
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[9px] font-mono font-medium uppercase tracking-wider text-zinc-400">
                    <Icon className="h-3 w-3 text-zinc-500" aria-hidden="true" />
                    {item.label}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className={`px-1.5 py-0.5 text-[8px] font-mono font-medium uppercase border rounded ${tone.badge}`}>
                      {item.kind}
                    </span>
                    {routable && (
                      <ArrowUpRight className="h-3 w-3 text-sky-400 opacity-60 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </div>

                <strong className={`block text-sm font-bold leading-tight ${tone.text}`}>
                  {item.value}
                </strong>

                <p className="text-[11px] leading-relaxed text-zinc-400 font-sans">{item.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default TodayNextAttention;
