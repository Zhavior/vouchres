import React from 'react';
import { Flame, Heart, Trophy, Plus, Search } from 'lucide-react';
import type { PlayerVouchSummary } from '../../../../hooks/queries/usePlayerVouchLayer';
import PlayerHeadshot from '../../../../components/parlays/PlayerHeadshot';
import { logoByTeamName } from '../../../../lib/teamLogos';
import {
  AuroraMaxEyebrow,
  AuroraMaxControl,
} from '../../../../components/aurora-max/AuroraMaxPrimitives';

export interface MostVouchedPodiumProps {
  players: Array<PlayerVouchSummary & {
    rank?: number;
    hrScore?: number;
    hitterPower?: number;
    pitcherVulnerability?: number;
    parkFactor?: number;
    primaryReason?: string;
  }>;
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

  const podiumItems = [
    {
      rank: 2,
      player: second,
      metal: 'silver',
      title: '02 // SILVER',
      borderColor: 'border-[var(--aurora-max-line)]',
      tagColor: 'text-[var(--aurora-max-paper)] bg-white/10',
    },
    {
      rank: 1,
      player: first,
      metal: 'gold',
      title: '01 // GOLD APEX',
      borderColor: 'border-[var(--aurora-max-line-strong)]',
      tagColor: 'text-[#02100d] bg-[var(--aurora-max-emerald)]',
    },
    {
      rank: 3,
      player: third,
      metal: 'bronze',
      title: '03 // BRONZE',
      borderColor: 'border-[var(--aurora-max-line)]',
      tagColor: 'text-[var(--aurora-max-amber)] bg-[rgba(217,156,74,0.15)]',
    },
  ].filter((item) => item.player != null);

  return (
    <section className="w-full min-w-0 max-w-full space-y-3">
      <div className="flex items-center justify-between gap-2 border-b border-[var(--aurora-max-line)] pb-2 px-1">
        <div className="flex items-center gap-2">
          <span className="grid h-5 w-5 place-items-center border border-[var(--aurora-max-emerald)] text-[var(--aurora-max-emerald)]">
            <Trophy className="h-3 w-3" />
          </span>
          <AuroraMaxEyebrow className="text-[var(--aurora-max-emerald)]">
            COMMUNITY LEADERS PODIUM · TOP 3 CONSENSUS
          </AuroraMaxEyebrow>
        </div>
        <span className="font-mono text-[10px] text-[var(--aurora-max-muted)] uppercase">
          LIVE SLATE VOTES
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-stretch w-full min-w-0 max-w-full">
        {podiumItems.map(({ rank, player, borderColor, tagColor, title }) => {
          if (!player) return null;
          const isGold = rank === 1;
          const logo = logoByTeamName(player.team);

          return (
            <article
              key={`${player.playerId}-podium-${rank}`}
              className={`aurora-max-panel relative flex flex-col justify-between border ${borderColor} bg-[rgba(5,12,13,0.65)] p-4 shadow-[var(--aurora-max-shadow)] backdrop-blur-[18px] ${
                isGold ? 'bg-[rgba(0,217,160,0.03)]' : ''
              }`}
            >
              {/* Header: Rank + Team */}
              <div className="flex items-center justify-between gap-2 border-b border-[var(--aurora-max-line)] pb-2.5">
                <span className={`px-2 py-0.5 font-mono text-[9px] font-black uppercase tracking-wider ${tagColor}`}>
                  {title}
                </span>

                <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-[var(--aurora-max-muted)]">
                  {logo && <img src={logo} alt="" className="h-3.5 w-3.5 object-contain" />}
                  <span className="text-[var(--aurora-max-paper)]">{player.team ?? 'MLB'}</span>
                  {player.opponent ? <span>vs {player.opponent}</span> : null}
                </div>
              </div>

              {/* Player Body */}
              <div
                className="mt-3 flex items-start gap-3 cursor-pointer min-w-0 group"
                onClick={() => onSelectPlayer?.(player.playerId)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelectPlayer?.(player.playerId); }}
              >
                <div className="relative shrink-0">
                  <div className="flex h-14 w-14 items-end justify-center border border-[var(--aurora-max-line)] bg-black/40 overflow-hidden group-hover:border-[var(--aurora-max-emerald)] transition">
                    <PlayerHeadshot name={player.playerName} playerId={player.playerId} size={50} priority={isGold} />
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-z8 text-base font-black uppercase tracking-tight text-[var(--aurora-max-paper)] group-hover:text-[var(--aurora-max-emerald)] transition">
                    {player.playerName}
                  </h3>
                  <div className="mt-1 flex items-center gap-2 font-mono text-[10px]">
                    <span className="text-[var(--aurora-max-emerald)] font-black">
                      {Math.round(player.hrScore ?? 80)} HRPI
                    </span>
                    <span className="text-[var(--aurora-max-muted)]">·</span>
                    <span className="text-[var(--aurora-max-muted)]">{player.totalVouches} vouches</span>
                  </div>
                </div>
              </div>

              {/* Primary Catalyst Snippet */}
              {player.primaryReason && (
                <div className="mt-3 border-t border-[var(--aurora-max-line)] bg-[rgba(3,8,10,0.5)] p-2">
                  <p className="font-mono text-[10px] text-[var(--aurora-max-paper)] truncate">
                    <strong className="text-[var(--aurora-max-emerald)] uppercase text-[9px] mr-1">Catalyst:</strong>
                    {player.primaryReason}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="mt-3 flex items-center justify-between gap-2 border-t border-[var(--aurora-max-line)] pt-2.5 font-mono">
                <button
                  type="button"
                  onClick={() => onToggleVouch?.(player)}
                  disabled={vouchPendingId === String(player.playerId) || !onToggleVouch}
                  className={`flex h-8 items-center gap-1.5 border px-2.5 text-[10px] font-black uppercase tracking-wider transition ${
                    player.viewerHasVouched
                      ? 'border-[var(--aurora-max-emerald)] bg-[rgba(0,217,160,0.15)] text-[var(--aurora-max-emerald)]'
                      : 'border-[var(--aurora-max-line)] bg-black/30 text-[var(--aurora-max-muted)] hover:border-[var(--aurora-max-line-strong)] hover:text-[var(--aurora-max-paper)]'
                  } disabled:opacity-40`}
                  title="Vouch for player"
                >
                  <Heart className={`h-3 w-3 ${player.viewerHasVouched ? 'fill-current' : ''}`} />
                  <span>{player.totalVouches}</span>
                </button>

                <div className="flex items-center gap-1.5">
                  {onAddToSlip && (
                    <AuroraMaxControl
                      tone="primary"
                      onClick={() => onAddToSlip(player)}
                      className="!min-h-8 !px-2.5 !text-[10px] font-bold"
                      title="Add to slip"
                    >
                      <Plus className="h-3 w-3" /> Slip
                    </AuroraMaxControl>
                  )}

                  <AuroraMaxControl
                    onClick={() => onSelectPlayer?.(player.playerId)}
                    className="!min-h-8 !px-2"
                    title="View Dossier"
                  >
                    <Search className="h-3 w-3" />
                  </AuroraMaxControl>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default MostVouchedPodium;
