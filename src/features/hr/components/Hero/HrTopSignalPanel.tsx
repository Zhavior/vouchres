import React, { useState } from 'react';
import { Check, ChevronDown, ChevronUp, Crosshair, Heart, Plus, Search, ShieldAlert, ShieldCheck, ShieldOff, Trophy } from 'lucide-react';
import PlayerHeadshot from '../../../../components/parlays/PlayerHeadshot';
import type { HrWatchRow } from '../../types/hrWatch';
import type { HrBoardFreshness } from '../../utils/hrDecisionBrief';
import { logoByTeamName } from '../../../../lib/teamLogos';

interface HrTopSignalPanelProps {
  player: HrWatchRow | null;
  freshness: HrBoardFreshness;
  generatedAt: Date | null;
  dateLabel: string;
  onResearch: (player: HrWatchRow) => void;
  onAddToSlip?: (player: HrWatchRow) => void;
  onTogglePlayerVouch?: (player: HrWatchRow) => void;
  onOpenBuild: () => void;
  playerVouchCount?: number;
  playerVouchedByViewer?: boolean;
  playerVouchPending?: boolean;
}

function numberLabel(value: number | null | undefined): string {
  return value == null || !Number.isFinite(value) ? '-' : String(Math.round(value));
}

function MetricChip({ label, value, colorClass }: { label: string; value: string; colorClass: string }) {
  return (
    <div className="flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-black/40 px-2.5 py-1 font-mono text-xs">
      <span className="text-[10px] uppercase font-bold text-slate-400">{label}</span>
      <span className={`font-black ${colorClass}`}>{value}</span>
    </div>
  );
}

export function HrTopSignalPanel({
  player,
  freshness,
  generatedAt,
  dateLabel,
  onResearch,
  onAddToSlip,
  onTogglePlayerVouch,
  onOpenBuild,
  playerVouchCount = 0,
  playerVouchedByViewer = false,
  playerVouchPending = false,
}: HrTopSignalPanelProps) {
  const [expanded, setExpanded] = useState(false);

  if (!player) {
    return (
      <section className="flex min-h-20 items-center justify-center rounded-2xl border border-white/10 bg-black/40 p-4 text-center">
        <div className="flex items-center gap-2">
          <Crosshair className="h-4 w-4 text-vouch-cyan animate-pulse" />
          <p className="font-mono text-xs font-black uppercase tracking-wider text-slate-400">Scanning today&apos;s slate for top signal...</p>
        </div>
      </section>
    );
  }

  const isConfirmed = player.truthStatus === 'official';
  const teamLogo = logoByTeamName(player.team);
  const primaryReason = player.reasons && player.reasons.length > 0 ? player.reasons[0] : 'High composite power matchup';

  return (
    <section className="relative overflow-hidden rounded-2xl border border-vouch-cyan/40 bg-gradient-to-br from-[#0e1d33] via-[#091526] to-[#050a12] p-3.5 sm:p-5 shadow-[0_0_40px_rgba(0,240,255,0.15)] backdrop-blur-xl">
      {/* Background Graphic Accents */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-vouch-cyan/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-amber-400/10 blur-3xl" />

      <div className="relative z-10 space-y-3">
        {/* Top Header Row: Headshot + Info + Score Badge ALL IN THE SAME ROW */}
        <div className="flex items-center justify-between gap-3 min-w-0">
          {/* Left: Cutout Headshot & Player Details */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="relative shrink-0">
              <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-end justify-center rounded-xl border-2 border-vouch-cyan/50 bg-gradient-to-b from-black/80 to-[#0c192c] overflow-hidden shadow-[0_0_20px_rgba(0,240,255,0.25)]">
                <PlayerHeadshot name={player.playerName} playerId={player.playerId} headshotUrl={player.headshotUrl} size={58} priority />
              </div>
              <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 font-mono text-[9px] sm:text-[10px] font-black text-black shadow-[0_0_12px_rgba(251,191,36,0.6)] ring-1 ring-black">
                #1
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1 rounded-md border border-amber-400/40 bg-amber-400/15 px-1.5 py-0.5 font-mono text-[9px] font-black uppercase text-amber-300">
                  <Trophy className="h-3 w-3" /> Top Signal
                </span>
                <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 font-mono text-[9px] font-bold ${
                  isConfirmed
                    ? 'border-vouch-emerald/40 bg-vouch-emerald/15 text-vouch-emerald'
                    : 'border-amber-400/30 bg-amber-400/10 text-amber-200'
                }`}>
                  {isConfirmed ? <ShieldCheck className="h-3 w-3" /> : <ShieldOff className="h-3 w-3" />}
                  {isConfirmed ? 'Confirmed' : 'Projected'}
                </span>
              </div>

              <h2 className="truncate text-base sm:text-2xl font-black uppercase tracking-tight text-white mt-0.5">
                {player.playerName}
              </h2>

              <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium truncate mt-0.5">
                {teamLogo && <img src={teamLogo} alt="" className="h-3.5 w-3.5 object-contain inline" />}
                <span className="font-bold text-white">{player.team}</span> vs <span>{player.opponent}</span>
                {player.pitcherName ? <span className="hidden sm:inline text-slate-400"> / vs {player.pitcherName}</span> : null}
              </div>
            </div>
          </div>

          {/* Right: Model Score Dial (Inline in the SAME ROW on mobile) */}
          <div className="flex shrink-0 items-center justify-center rounded-xl border border-amber-400/40 bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 p-0.5 shadow-[0_0_16px_rgba(251,191,36,0.45)]">
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 flex-col items-center justify-center rounded-lg bg-black text-amber-300 px-1 py-0.5 text-center">
              <span className="font-mono text-[8px] sm:text-[9px] font-black uppercase tracking-tighter text-amber-400 leading-none">SCORE</span>
              <span className="font-mono text-base sm:text-xl font-black text-white leading-none mt-0.5">{numberLabel(player.hrScore)}</span>
            </div>
          </div>
        </div>

        {/* Row 2: Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => onResearch(player)}
            className="flex-1 flex h-9 items-center justify-center gap-1.5 rounded-xl border border-vouch-cyan/40 bg-vouch-cyan/15 px-3 font-mono text-xs font-black uppercase text-vouch-cyan transition hover:bg-vouch-cyan/25 shadow-[0_0_12px_rgba(0,240,255,0.2)]"
          >
            <Search className="h-3.5 w-3.5" /> Research
          </button>

          {onTogglePlayerVouch && (
            <button
              type="button"
              onClick={() => onTogglePlayerVouch(player)}
              disabled={playerVouchPending}
              title="Vouch for this player"
              className={`flex h-9 items-center gap-1.5 rounded-xl border px-3 font-mono text-xs font-bold transition ${
                playerVouchedByViewer
                  ? 'border-vouch-emerald/50 bg-vouch-emerald/20 text-vouch-emerald shadow-[0_0_12px_rgba(0,255,148,0.25)]'
                  : 'border-white/15 bg-black/40 text-slate-300 hover:border-vouch-emerald/40 hover:text-white'
              } disabled:opacity-40`}
            >
              <Heart className={`h-3.5 w-3.5 text-vouch-emerald ${playerVouchedByViewer ? 'fill-current' : ''}`} />
              <span>{playerVouchCount}</span>
            </button>
          )}

          {onAddToSlip && (
            <button
              type="button"
              onClick={() => onAddToSlip(player)}
              disabled={player.truthStatus === 'blocked'}
              className="flex h-9 items-center gap-1.5 rounded-xl border border-vouch-emerald/40 bg-vouch-emerald/15 px-3 font-mono text-xs font-black uppercase text-vouch-emerald transition hover:bg-vouch-emerald/25 disabled:opacity-40"
            >
              <Plus className="h-4 w-4" /> Slip
            </button>
          )}
        </div>

        {/* Metric Chip Slider Row */}
        <div className="flex overflow-x-auto gap-2 py-0.5 scrollbar-none snap-x font-mono text-xs">
          <MetricChip label="Hitter Power" value={numberLabel(player.hitterPower)} colorClass="text-vouch-cyan" />
          <MetricChip label="Pitcher Vuln" value={numberLabel(player.pitcherVulnerability)} colorClass="text-vouch-emerald" />
          <MetricChip label="Park Factor" value={numberLabel(player.parkFactor)} colorClass="text-amber-300" />
          {player.weather != null && (
            <MetricChip label="Weather Context" value={`${Math.round(player.weather)}/100`} colorClass="text-sky-300" />
          )}
        </div>

        {/* Primary Rationale Ticker */}
        <div className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mono font-bold text-vouch-emerald uppercase shrink-0 text-[10px]">Primary Edge:</span>
            <span className="text-slate-200 truncate text-[11px]">{primaryReason}</span>
          </div>

          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-[10px] font-bold text-vouch-cyan hover:underline shrink-0"
          >
            <span>{expanded ? 'Hide' : 'Details'}</span>
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </div>

        {/* Expanded Breakdown Drawer */}
        {expanded && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-white/10 text-xs">
            <div className="rounded-xl border border-white/10 bg-black/40 p-2.5 space-y-1">
              <p className="font-mono text-[9px] font-black uppercase text-vouch-emerald tracking-wider">Key Catalysts</p>
              {player.reasons?.slice(0, 3).map((r, i) => (
                <div key={i} className="flex items-start gap-1.5 text-slate-300 text-[11px]">
                  <Check className="h-3 w-3 text-vouch-emerald shrink-0 mt-0.5" />
                  <span>{r}</span>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-white/10 bg-black/40 p-2.5 space-y-1">
              <p className="font-mono text-[9px] font-black uppercase text-amber-300 tracking-wider">Risk Factors</p>
              {player.warnings && player.warnings.length > 0 ? (
                player.warnings.slice(0, 3).map((w, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-slate-300 text-[11px]">
                    <ShieldAlert className="h-3 w-3 text-amber-400 shrink-0 mt-0.5" />
                    <span>{w}</span>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-[11px]">No major negative risk factors identified.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default HrTopSignalPanel;
