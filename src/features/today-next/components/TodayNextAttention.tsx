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

function toneFor(item: TodayAttentionItem): { text: string; badge: string; badgeText: string; border: string } {
  const value = `${item.value} ${item.detail}`.toLowerCase();
  if (/unavailable|incomplete|missing|degraded|cannot|needs verification/.test(value)) {
    return {
      text: 'text-ve-amber',
      badge: 'border-ve-amber/25 bg-ve-amber/10 text-ve-amber',
      badgeText: 'text-ve-amber',
      border: 'border-ve-amber/20',
    };
  }
  if (/available|complete|pending/.test(value)) {
    return {
      text: 'text-ve-emerald',
      badge: 'border-ve-emerald/25 bg-ve-emerald/10 text-ve-emerald',
      badgeText: 'text-ve-emerald',
      border: 'border-white/[0.08] hover:border-white/[0.18]',
    };
  }
  return {
    text: 'text-white',
    badge: 'border-white/[0.08] bg-white/[0.04] text-white/70',
    badgeText: 'text-white/40',
    border: 'border-white/[0.08] hover:border-white/[0.18]',
  };
}

export function TodayNextAttention({ decision, onRoute }: TodayNextAttentionProps) {
  return (
    <section aria-label="What needs attention" className="space-y-3">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
        <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/55">
          <AlertTriangle className="h-3.5 w-3.5 text-ve-amber" aria-hidden="true" />
          SYSTEM ATTENTION &amp; INTEGRITY
        </h2>
        <span className="text-[9px] text-white/40 uppercase font-mono">STAGE 01 AUDIT</span>
      </div>

      <div className="grid border-t border-white/[0.08] sm:grid-cols-3">
        {decision.attention.map((item) => {
          const Icon = KIND_ICON[item.kind];
          const routable = Boolean(item.section);
          const tone = toneFor(item);

          return (
            <div
              key={item.id}
              onClick={routable ? () => onRoute(item.section!) : undefined}
              className={`group flex flex-col justify-between border-b border-white/[0.08] px-4 py-4 transition-colors sm:[&:not(:first-child)]:border-l ${
                routable ? 'cursor-pointer hover:bg-white/[0.03]' : ''
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[9px] font-mono font-medium uppercase tracking-wider text-white/55">
                    <Icon className="h-3 w-3 text-white/40" aria-hidden="true" />
                    {item.label}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[8px] font-mono font-medium uppercase tracking-[0.18em] ${tone.badgeText}`}>
                      {item.kind}
                    </span>
                    {routable && (
                      <ArrowUpRight className="h-3 w-3 text-ve-cyan opacity-60 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </div>

                <strong className={`block font-sans text-base font-medium leading-snug ${tone.text}`}>
                  {item.value}
                </strong>

                <p className="font-sans text-xs font-light leading-relaxed text-white/45">{item.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default TodayNextAttention;
