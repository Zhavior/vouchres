import React from 'react';
import { Heart, Plus, ArrowRight, Zap, Shield, Landmark } from 'lucide-react';
import type { PlayerVouchSummary } from '../../../../hooks/queries/usePlayerVouchLayer';
import PlayerHeadshot from '../../../../components/parlays/PlayerHeadshot';
import { logoByTeamName } from '../../../../lib/teamLogos';

interface MostVouchedCardProps {
  player: PlayerVouchSummary & {
    rank?: number;
    hitterPower?: number;
    pitcherVulnerability?: number;
    parkFactor?: number;
    hrScore?: number;
    primaryReason?: string;
  };
  onSelectPlayer?: (playerId: string) => void;
  onToggleVouch?: (player: PlayerVouchSummary) => void;
  onAddToSlip?: (player: PlayerVouchSummary) => void;
  isPending?: boolean;
}

export const MostVouchedCard: React.FC<MostVouchedCardProps> = ({
  player,
  onSelectPlayer,
  onToggleVouch,
  onAddToSlip,
  isPending = false,
}) => {
  const logo = logoByTeamName(player.team);
  const totalVotes = player.totalVouches;
  // Calculate mock consensus index for rich Smart UI visual
  const consensusPct = Math.min(99, Math.max(65, 70 + Math.round(totalVotes * 3.5)));

  return (
    <div className="group relative flex flex-col justify-between rounded-xl border border-white/15 bg-[#0a121d] p-3.5 transition-all duration-200 hover:border-vouch-cyan/50 hover:bg-[#0f1c2b] shadow-md">
      <div>
        {/* Header: Rank + Team + Consensus Pill */}
        <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5">
          <div className="flex items-center gap-2">
            {player.rank && (
              <span className="flex h-6 min-w-6 items-center justify-center rounded-md border border-vouch-cyan/30 bg-vouch-cyan/10 font-mono text-[10px] font-black text-vouch-cyan">
                #{player.rank}
              </span>
            )}
            {logo && <img src={logo} alt={player.team ?? ''} className="h-5 w-5 object-contain" />}
            <span className="font-mono text-[11px] font-black text-slate-200 uppercase">
              {player.team ?? 'TBD'} {player.opponent ? `vs ${player.opponent}` : ''}
            </span>
          </div>

          <div className="flex items-center gap-1 font-mono text-[10px] font-bold text-vouch-emerald bg-vouch-emerald/10 border border-vouch-emerald/30 px-2 py-0.5 rounded">
            <span>{consensusPct}% Consensus</span>
          </div>
        </div>

        {/* Center: Headshot + Name + Edge */}
        <div className="mt-3 flex items-center gap-3 min-w-0">
          <div className="flex h-12 w-12 shrink-0 items-end justify-center rounded-lg border border-white/15 bg-black/40 overflow-hidden">
            <PlayerHeadshot name={player.playerName} playerId={player.playerId} size={44} />
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="truncate text-base font-black uppercase tracking-tight text-white group-hover:text-vouch-cyan transition">
              {player.playerName}
            </h4>

            <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px]">
              {player.hitterPower != null && (
                <span className="inline-flex items-center gap-1 font-mono text-slate-300">
                  <Zap className="h-3 w-3 text-vouch-cyan" /> {player.hitterPower} PWR
                </span>
              )}
              {player.pitcherVulnerability != null && (
                <span className="inline-flex items-center gap-1 font-mono text-slate-300">
                  <Shield className="h-3 w-3 text-vouch-emerald" /> {player.pitcherVulnerability} P-VULN
                </span>
              )}
              {player.parkFactor != null && (
                <span className="inline-flex items-center gap-1 font-mono text-slate-300">
                  <Landmark className="h-3 w-3 text-amber-300" /> {player.parkFactor} PARK
                </span>
              )}
            </div>
          </div>

          {player.hrScore != null && (
            <div className="shrink-0 text-right font-mono">
              <span className="block text-lg font-black text-white">{Math.round(player.hrScore)}</span>
              <span className="block text-[8px] font-bold text-vouch-cyan uppercase">HR Score</span>
            </div>
          )}
        </div>

        {player.primaryReason && (
          <p className="mt-2.5 truncate text-[11px] font-medium text-slate-300 bg-black/30 px-2 py-1 rounded border border-white/[0.06]">
            <span className="text-vouch-emerald font-bold">Edge:</span> {player.primaryReason}
          </p>
        )}
      </div>

      {/* Footer: Actions Bar */}
      <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-white/10 pt-2.5">
        <button
          type="button"
          onClick={() => onToggleVouch?.(player)}
          disabled={isPending || !onToggleVouch}
          className={`flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-mono font-black transition ${
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
              className="flex h-9 px-3 items-center gap-1 rounded-lg border border-white/15 bg-black/40 text-xs font-bold text-white transition hover:border-vouch-emerald/50 hover:text-vouch-emerald"
            >
              <Plus className="h-3.5 w-3.5" /> Slip
            </button>
          )}

          {onSelectPlayer && (
            <button
              type="button"
              onClick={() => onSelectPlayer(player.playerId)}
              className="flex h-9 items-center gap-1 rounded-lg border border-vouch-cyan/40 bg-vouch-cyan/15 px-3 text-xs font-black text-vouch-cyan transition hover:bg-vouch-cyan/25"
            >
              Research <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
