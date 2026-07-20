import { Flame, Heart, ArrowRight } from 'lucide-react';
import type { PlayerVouchSummary } from '../../../../hooks/queries/usePlayerVouchLayer';

interface MostVouchedPlayersPanelProps {
  title?: string;
  subtitle?: string;
  players: PlayerVouchSummary[];
  emptyLabel?: string;
  onSelectPlayer?: (playerId: string) => void;
  onOpenBoard?: () => void;
}

export function MostVouchedPlayersPanel({
  title = 'Most Vouched Today',
  subtitle = 'Community heat, ranked by real player likes.',
  players,
  emptyLabel = 'No one has vouched a player yet today.',
  onSelectPlayer,
  onOpenBoard,
}: MostVouchedPlayersPanelProps) {
  return (
    <section className="ve-premium-panel rounded-xl border border-white/[0.09] p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-black uppercase tracking-[0.03em] text-white">{title}</h2>
          <p className="mt-1 text-xs text-white/46">{subtitle}</p>
        </div>
        {onOpenBoard ? (
          <button
            type="button"
            onClick={onOpenBoard}
            className="inline-flex min-h-9 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 text-[11px] font-bold text-white/60 transition hover:text-white"
          >
            HR Board <ArrowRight className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      {players.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-6 text-center text-sm text-white/45">
          {emptyLabel}
        </div>
      ) : (
        <div className="mt-4 grid gap-2">
          {players.map((player, index) => (
            <button
              key={`${player.playerId}-${index}`}
              type="button"
              onClick={() => onSelectPlayer?.(player.playerId)}
              disabled={!onSelectPlayer}
              className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-3 text-left transition hover:border-vouch-emerald/30 hover:bg-vouch-emerald/[0.04] disabled:cursor-default"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-vouch-emerald/25 bg-vouch-emerald/10 font-mono text-sm font-black text-vouch-emerald">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-black text-white">{player.playerName}</span>
                <span className="mt-0.5 block truncate text-[11px] text-white/45">
                  {player.team ?? 'Team TBD'}{player.opponent ? ` vs ${player.opponent}` : ''}
                </span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-vouch-cyan/20 bg-vouch-cyan/10 px-2.5 py-1 font-mono text-[10px] font-black uppercase tracking-[0.08em] text-vouch-cyan">
                {player.totalVouches} <Heart className={`h-3.5 w-3.5 ${player.viewerHasVouched ? 'fill-current' : ''}`} />
              </span>
              {index === 0 ? <Flame className="h-4 w-4 shrink-0 text-amber-300" /> : null}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
