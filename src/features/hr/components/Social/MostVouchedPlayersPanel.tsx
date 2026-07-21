import React from 'react';
import { Flame, Heart, ArrowRight } from 'lucide-react';
import type { PlayerVouchSummary } from '../../../../hooks/queries/usePlayerVouchLayer';

interface MostVouchedPlayersPanelProps {
  title?: string;
  subtitle?: string;
  players: PlayerVouchSummary[];
  emptyLabel?: string;
  limit?: number;
  onSelectPlayer?: (playerId: string) => void;
  onOpenBoard?: () => void;
  onViewFullPage?: () => void;
}

export function MostVouchedPlayersPanel({
  title = 'Most Vouched Today',
  subtitle = 'Community heat, ranked by real player vouches.',
  players,
  emptyLabel = 'No one has vouched a player yet today.',
  limit = 4,
  onSelectPlayer,
  onOpenBoard,
  onViewFullPage,
}: MostVouchedPlayersPanelProps) {
  const visiblePlayers = players.slice(0, limit);

  return (
    <section className="rounded-xl border border-white/12 bg-gradient-to-r from-[#0b1624]/90 via-[#07111f]/90 to-[#050a12]/90 p-3 sm:p-4 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-400/20 text-amber-300">
            <Flame className="h-3.5 w-3.5 fill-current" />
          </span>
          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-tight text-white truncate">{title}</h2>
            <p className="hidden sm:block text-[11px] text-slate-400 truncate">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onViewFullPage ? (
            <button
              type="button"
              onClick={onViewFullPage}
              className="inline-flex h-7 items-center gap-1 rounded-lg border border-vouch-cyan/40 bg-vouch-cyan/15 px-2.5 font-mono text-[10px] font-black uppercase text-vouch-cyan transition hover:bg-vouch-cyan/25"
            >
              Full Page <ArrowRight className="h-3 w-3" />
            </button>
          ) : null}
          {onOpenBoard ? (
            <button
              type="button"
              onClick={onOpenBoard}
              className="inline-flex h-7 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 text-[10px] font-bold text-slate-300 transition hover:text-white"
            >
              HR Board <ArrowRight className="h-3 w-3" />
            </button>
          ) : null}
        </div>
      </div>

      {visiblePlayers.length === 0 ? (
        <div className="mt-2 rounded-lg border border-dashed border-white/10 bg-black/20 p-3 text-center text-xs text-slate-400 font-mono">
          {emptyLabel}
        </div>
      ) : (
        <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {visiblePlayers.map((player, index) => {
            const isFirst = index === 0;
            return (
              <button
                key={`${player.playerId}-${index}`}
                type="button"
                onClick={() => onSelectPlayer?.(player.playerId)}
                disabled={!onSelectPlayer}
                className={`flex items-center gap-2.5 rounded-lg border p-2 text-left transition ${
                  isFirst
                    ? 'border-amber-400/40 bg-amber-400/[0.06] shadow-[0_0_12px_rgba(251,191,36,0.1)]'
                    : 'border-white/10 bg-black/30 hover:border-vouch-cyan/40 hover:bg-black/50'
                } disabled:cursor-default min-w-0`}
              >
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-xs font-black ${
                  isFirst ? 'bg-amber-400 text-black' : 'bg-white/10 text-slate-300'
                }`}>
                  #{index + 1}
                </span>

                <div className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-black text-white">{player.playerName}</span>
                  <span className="block truncate font-mono text-[9px] text-slate-400">
                    {player.team ?? 'TBD'}{player.opponent ? ` vs ${player.opponent}` : ''}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0 rounded-md border border-vouch-cyan/30 bg-vouch-cyan/10 px-1.5 py-0.5 font-mono text-[9px] font-black text-vouch-cyan">
                  <Heart className={`h-3 w-3 text-vouch-emerald ${player.viewerHasVouched ? 'fill-current' : ''}`} />
                  <span>{player.totalVouches}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default MostVouchedPlayersPanel;
