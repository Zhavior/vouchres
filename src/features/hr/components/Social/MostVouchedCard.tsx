import React from 'react';
import { Heart, Plus, ShieldCheck, Clock3, Search } from 'lucide-react';
import type { PlayerVouchSummary } from '../../../../hooks/queries/usePlayerVouchLayer';
import PlayerHeadshot from '../../../../components/parlays/PlayerHeadshot';
import { logoByTeamName } from '../../../../lib/teamLogos';
import {
  AuroraMaxControl,
  AuroraMaxTruthBadge,
} from '../../../../components/aurora-max/AuroraMaxPrimitives';

export interface MostVouchedCardProps {
  player: PlayerVouchSummary & {
    rank?: number;
    hitterPower?: number;
    pitcherVulnerability?: number;
    parkFactor?: number;
    hrScore?: number;
    primaryReason?: string;
    truthStatus?: string;
  };
  onSelectPlayer?: (playerId: string) => void;
  onToggleVouch?: (player: PlayerVouchSummary) => void;
  onAddToSlip?: (player: PlayerVouchSummary) => void;
  isPending?: boolean;
}

function metric(value: number | null | undefined): string {
  return value == null || !Number.isFinite(value) ? '—' : String(Math.round(value));
}

export const MostVouchedCard: React.FC<MostVouchedCardProps> = ({
  player,
  onSelectPlayer,
  onToggleVouch,
  onAddToSlip,
  isPending = false,
}) => {
  const logo = logoByTeamName(player.team);
  const isOfficial = player.truthStatus === 'official';

  return (
    <article className="aurora-max-panel relative flex flex-col justify-between border border-[var(--aurora-max-line)] bg-[rgba(5,12,13,0.65)] p-3.5 shadow-[var(--aurora-max-shadow)] backdrop-blur-[18px] transition duration-150 hover:border-[var(--aurora-max-line-strong)]">
      <div>
        {/* Top: Rank + Matchup + Status */}
        <div className="flex items-center justify-between gap-2 border-b border-[var(--aurora-max-line)] pb-2 font-mono text-[10px]">
          <div className="flex items-center gap-1.5 min-w-0">
            {player.rank != null && (
              <span className="font-black text-[var(--aurora-max-emerald)]">
                [{String(player.rank).padStart(2, '0')}]
              </span>
            )}
            {logo && <img src={logo} alt="" className="h-3 w-3 object-contain inline" />}
            <span className="font-bold text-[var(--aurora-max-paper)] truncate">
              {player.team ?? 'MLB'} {player.opponent ? `vs ${player.opponent}` : ''}
            </span>
          </div>

          {player.truthStatus && (
            <span className={`font-mono text-[9px] font-bold uppercase ${isOfficial ? 'text-[var(--aurora-max-emerald)]' : 'text-[var(--aurora-max-muted)]'}`}>
              {isOfficial ? 'Official' : 'Projected'}
            </span>
          )}
        </div>

        {/* Center: Headshot + Info */}
        <div
          className="mt-2.5 flex items-center gap-3 cursor-pointer min-w-0 group"
          onClick={() => onSelectPlayer?.(player.playerId)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelectPlayer?.(player.playerId); }}
        >
          <div className="relative shrink-0">
            <div className="flex h-12 w-12 items-end justify-center border border-[var(--aurora-max-line)] bg-black/40 overflow-hidden group-hover:border-[var(--aurora-max-emerald)] transition">
              <PlayerHeadshot name={player.playerName} playerId={player.playerId} size={44} />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="truncate font-z8 text-sm font-black uppercase text-[var(--aurora-max-paper)] group-hover:text-[var(--aurora-max-emerald)] transition">
              {player.playerName}
            </h4>

            <div className="mt-1 flex items-center gap-2 font-mono text-[9px] text-[var(--aurora-max-muted)]">
              <span>PWR: <strong className="text-[var(--aurora-max-paper)]">{metric(player.hitterPower)}</strong></span>
              <span>·</span>
              <span>P-VULN: <strong className="text-[var(--aurora-max-paper)]">{metric(player.pitcherVulnerability)}</strong></span>
            </div>
          </div>

          {player.hrScore != null && (
            <div className="shrink-0 text-right font-mono border border-[var(--aurora-max-line-strong)] bg-[rgba(0,217,160,0.06)] px-2 py-1">
              <span className="block text-base font-black text-[var(--aurora-max-emerald)] leading-none">
                {Math.round(player.hrScore)}
              </span>
              <span className="block text-[7px] font-bold text-[var(--aurora-max-muted)] uppercase mt-0.5">
                HRPI
              </span>
            </div>
          )}
        </div>

        {/* Catalyst Edge */}
        {player.primaryReason && (
          <div className="mt-2.5 border-t border-[var(--aurora-max-line)] bg-[rgba(3,8,10,0.5)] px-2 py-1">
            <p className="font-mono text-[10px] text-[var(--aurora-max-muted)] truncate">
              <strong className="text-[var(--aurora-max-emerald)] uppercase text-[9px] mr-1">Edge:</strong>
              {player.primaryReason}
            </p>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-[var(--aurora-max-line)] pt-2 font-mono">
        <button
          type="button"
          onClick={() => onToggleVouch?.(player)}
          disabled={isPending || !onToggleVouch}
          className={`flex h-7 items-center gap-1.5 border px-2 text-[10px] font-black uppercase tracking-wider transition ${
            player.viewerHasVouched
              ? 'border-[var(--aurora-max-emerald)] bg-[rgba(0,217,160,0.15)] text-[var(--aurora-max-emerald)]'
              : 'border-[var(--aurora-max-line)] bg-black/30 text-[var(--aurora-max-muted)] hover:border-[var(--aurora-max-line-strong)] hover:text-[var(--aurora-max-paper)]'
          }`}
          title="Vouch for player"
        >
          <Heart className={`h-3 w-3 ${player.viewerHasVouched ? 'fill-current' : ''}`} />
          <span>{player.totalVouches}</span>
        </button>

        <div className="flex items-center gap-1">
          {onAddToSlip && (
            <button
              type="button"
              onClick={() => onAddToSlip(player)}
              className="flex h-7 items-center gap-1 border border-[rgba(0,217,160,0.3)] bg-[rgba(0,217,160,0.08)] px-2 text-[10px] font-bold text-[var(--aurora-max-emerald)] transition hover:bg-[var(--aurora-max-emerald)] hover:text-[#02100d]"
              title="Add to Parlay Slip"
            >
              <Plus className="h-3 w-3" /> Slip
            </button>
          )}

          {onSelectPlayer && (
            <button
              type="button"
              onClick={() => onSelectPlayer(player.playerId)}
              className="flex h-7 w-7 items-center justify-center border border-[var(--aurora-max-line)] bg-black/30 text-[var(--aurora-max-muted)] hover:border-[var(--aurora-max-line-strong)] hover:text-[var(--aurora-max-paper)] transition"
              title="Open Player Research"
            >
              <Search className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

export default MostVouchedCard;
