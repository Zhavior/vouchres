import { BarChart3, ChevronRight, FlaskConical, Flame, Radio, ShieldCheck } from 'lucide-react';
import type { EdgeIslandSectionProps } from './edgeIslandTypes';

const ACTIONS = [
  { section: 'hr_board', label: 'HR Board', detail: 'Today’s edge table', icon: Flame, tone: 'cyan' as const },
  { section: 'player_edge_lab', label: 'Player Lab', detail: 'Deep research', icon: FlaskConical, tone: 'cyan' as const },
  { section: 'live_parlays', label: 'Saved Picks', detail: 'Pending slips', icon: ShieldCheck, tone: 'emerald' as const },
  { section: 'live_game_lab', label: 'Live Lab', detail: 'Game context', icon: Radio, tone: 'cyan' as const },
  { section: 'results', label: 'Results', detail: 'Proof ledger', icon: BarChart3, tone: 'neutral' as const },
];

export function QuickActionsRow({ onSectionChange }: EdgeIslandSectionProps) {
  return (
    <section className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/35 backdrop-blur-2xl">
      <div className="border-b border-white/8 px-4 py-3.5 sm:px-5">
        <div className="terminal-text text-vouch-cyan">Quick launch</div>
        <h2 className="mt-1 text-base font-black text-white">Jump to your tools</h2>
      </div>

      <div className="grid gap-1.5 p-3 sm:p-4">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          const accent =
            action.tone === 'emerald'
              ? 'text-vouch-emerald bg-emerald-400/10 border-emerald-400/20'
              : action.tone === 'cyan'
                ? 'text-vouch-cyan bg-cyan-300/10 border-cyan-300/20'
                : 'text-white/70 bg-white/[0.03] border-white/10';

          return (
            <button
              key={action.section}
              type="button"
              onClick={() => onSectionChange(action.section)}
              className="group flex min-h-11 items-center gap-3 rounded-xl border border-transparent bg-white/[0.02] px-3 py-2.5 text-left transition hover:border-white/12 hover:bg-white/[0.05] touch-manipulation"
            >
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${accent}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-black text-white">{action.label}</div>
                <div className="text-[11px] font-semibold text-white/42">{action.detail}</div>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-white/20 transition group-hover:translate-x-0.5 group-hover:text-vouch-cyan" />
            </button>
          );
        })}
      </div>
    </section>
  );
}
