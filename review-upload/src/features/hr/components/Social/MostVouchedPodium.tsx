import React from 'react';
import { Flame, Heart, Trophy, ArrowRight, Plus } from 'lucide-react';
import type { PlayerVouchSummary } from '../../../../hooks/queries/usePlayerVouchLayer';
import PlayerHeadshot from '../../../../components/parlays/PlayerHeadshot';
import { logoByTeamName } from '../../../../lib/teamLogos';

interface MostVouchedPodiumProps {
  players: PlayerVouchSummary[];
  onSelectPlayer?: (playerId: string) => void;
  onToggleVouch?: (player: PlayerVouchSummary) => void;
  onAddToSlip?: (player: PlayerVouchSummary) => void;
  vouchPendingId?: string | null;
}

export const MostVouchedPodium: React.FC<MostVouchedPodiumProps> = ({
  players,
  onSelectPlayer,
  onToggleVouch,
  onAddToSlip,
  vouchPendingId,
}) => {
  if (!players || players.length === 0) return null;

  const first = players[0];
  const second = players[1];
  const third = players[2];

  // Reorder for visual podium presentation: 2nd (left), 1st (center elevated), 3rd (right)
  const podiumItems = [
    { rank: 2, player: second, metal: 'silver', border: 'border-slate-300/40', glow: 'shadow-[0_0_20px_rgba(203,213,225,0.2)]', badgeBg: 'bg-slate-300 text-black', title: 'SILVER' },
    { rank: 1, player: first, metal: 'gold', border: 'border-amber-400/60', glow: 'shadow-[0_0_30px_rgba(251,191,36,0.35)]', badgeBg: 'bg-gradient-to-r from-amber-300 to-yellow-500 text-black', title: 'GOLD #1' },
    { rank: 3, player: third, metal: 'bronze', border: 'border-amber-700/50', glow: 'shadow-[0_0_20px_rgba(180,83,9,0.2)]', badgeBg: 'bg-amber-700 text-white', title: 'BRONZE' },
  ].filter((item) => item.player != null);

  return (
    <section className="w-full min-w-0 max-w-full overflow-hidden space-y-3">
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-400" />
          <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-white">Community Leaders Podium</h2>
        </div>
        <span className="font-mono text-[10px] font-bold uppercase text-vouch-cyan border border-vouch-cyan/30 bg-vouch-cyan/10 px-2 py-0.5 rounded-lg">
          Live Top 3
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end w-full min-w-0 max-w-full">
        {podiumItems.map(({ rank, player, border, glow, badgeBg, title }) => {
          if (!player) return null;
          const isGold = rank === 1;
          const logo = logoByTeamName(player.team);

          return (
            <div
              key={`${player.playerId}-podium-${rank}`}
              className={`relative flex flex-col justify-between rounded-2xl border ${border} ${glow} bg-gradient-to-b from-[#0e1927] to-[#070e17] p-4 transition-all duration-300 hover:scale-[1.01] ${
                isGold ? 'sm:-translate-y-2 border-amber-400/80 bg-gradient-to-b from-[#1a1c12] via-[#0e1927] to-[#070e17]' : ''
              }`}
            >
              {/* Rank Badge */}
              <div className="flex items-center justify-between gap-2">
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-mono text-[10px] font-black uppercase tracking-wider ${badgeBg}`}>
                  {isGold ? <Flame className="h-3 w-3 fill-current" /> : null}
                  {title}
                </span>

                {logo && (
                  <img src={logo} alt={player.team ?? ''} className="h-6 w-6 object-contain filter drop-shadow-md" />
                )}
              </div>

              {/* Player Info */}
              <div className="mt-3 flex items-center gap-3 min-w-0">
                <div className="relative shrink-0">
                  <div className="flex h-14 w-14 items-end justify-center rounded-xl border border-white/20 bg-black/40 overflow-hidden">
                    <PlayerHeadshot name={player.playerName} playerId={player.playerId} size={52} priority={isGold} />
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-base font-black uppercase tracking-tight text-white">{player.playerName}</h3>
                  <p className="truncate text-xs font-bold text-slate-300">
                    <span className="text-vouch-cyan">{player.team ?? 'TBD'}</span>
                    {player.opponent ? ` vs ${player.opponent}` : ''}
                  </p>
                </div>
              </div>

              {/* Vouch Score & Actions */}
              <div className="mt-4 flex items-center justify-between gap-2 border-t border-white/10 pt-3">
                <button
                  type="button"
                  onClick={() => onToggleVouch?.(player)}
                  disabled={vouchPendingId === player.playerId || !onToggleVouch}
                  className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-mono text-xs font-black transition ${
                    player.viewerHasVouched
                      ? 'border-vouch-emerald/50 bg-vouch-emerald/20 text-vouch-emerald shadow-[0_0_10px_rgba(0,255,148,0.2)]'
                      : 'border-white/15 bg-black/40 text-white hover:border-vouch-cyan/40 hover:text-vouch-cyan'
                  }`}
                >
                  <Heart className={`h-3.5 w-3.5 ${player.viewerHasVouched ? 'fill-current' : ''}`} />
                  <span>{player.totalVouches}</span>
                </button>

                <div className="flex items-center gap-1.5">
                  {onAddToSlip && (
                    <button
                      type="button"
                      onClick={() => onAddToSlip(player)}
                      title="Add to ParlayOS Slip"
                      className="flex h-8 px-2.5 items-center gap-1 rounded-lg border border-white/15 bg-black/40 text-xs font-bold text-white transition hover:border-vouch-emerald/50 hover:text-vouch-emerald"
                    >
                      <Plus className="h-3.5 w-3.5" /> Slip
                    </button>
                  )}

                  {onSelectPlayer && (
                    <button
                      type="button"
                      onClick={() => onSelectPlayer(player.playerId)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-vouch-cyan/40 bg-vouch-cyan/15 text-vouch-cyan transition hover:bg-vouch-cyan/30"
                      title="View Player Dossier"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
