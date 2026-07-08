import { BarChart3, FlaskConical, Layers, Radio, ShieldCheck } from 'lucide-react';
import { VECard } from '../ui/ve';
import type { EdgeIslandSectionProps } from './edgeIslandTypes';

const ACTIONS = [
  { section: 'hr_board', label: 'HR Board', detail: 'Open today’s edge table', icon: Layers, tone: 'emerald' },
  { section: 'player_edge_lab', label: 'Player Lab', detail: 'Deep player research', icon: FlaskConical, tone: 'cyan' },
  { section: 'live_parlays', label: 'Saved Picks', detail: 'Track pending slips', icon: ShieldCheck, tone: 'emerald' },
  { section: 'live_game_lab', label: 'Live Lab', detail: 'Game context board', icon: Radio, tone: 'cyan' },
  { section: 'results', label: 'Results', detail: 'Proof and ledger', icon: BarChart3, tone: 'neutral' },
] as const;

export function QuickActionsRow({ onSectionChange }: EdgeIslandSectionProps) {
  return (
    <VECard strong className="p-4">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <div className="terminal-text text-vouch-cyan">Quick actions</div>
          <h2 className="mt-1 text-lg font-black text-white">Move fast from the morning board</h2>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          const accent = action.tone === 'emerald' ? 'text-vouch-emerald bg-emerald-400/10 border-emerald-400/20' : action.tone === 'cyan' ? 'text-vouch-cyan bg-cyan-300/10 border-cyan-300/20' : 'text-white/70 bg-white/[0.03] border-white/10';

          return (
            <button
              key={action.section}
              type="button"
              onClick={() => onSectionChange(action.section)}
              className="group rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-left transition hover:-translate-y-0.5 hover:border-white/20"
            >
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl border ${accent}`}>
                <Icon className="h-4.5 w-4.5" />
              </div>
              <div className="text-sm font-black text-white">{action.label}</div>
              <div className="mt-1 text-[11px] font-semibold text-white/42">{action.detail}</div>
            </button>
          );
        })}
      </div>
    </VECard>
  );
}
