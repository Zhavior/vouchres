import React from 'react';
import { X, Activity, TrendingUp, Sparkles, AlertTriangle, Plus, Box, Zap } from 'lucide-react';
import type { TouchdownPlayer } from '../../../types/touchdown';
import PlayerHeadshot from '../../../components/parlays/PlayerHeadshot';
import { useAmbient3dEnabled } from '../../../stores/ambient3dStore';
import { TdFieldMatrix3D } from './TdFieldMatrix3D';

interface MatchupDossierModalProps {
  player: TouchdownPlayer | null;
  onClose: () => void;
  onAddToSlip: (player: TouchdownPlayer) => void;
}

export const MatchupDossierModal: React.FC<MatchupDossierModalProps> = ({
  player,
  onClose,
  onAddToSlip,
}) => {
  const is3DEnabled = useAmbient3dEnabled();
  if (!player) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border-2 border-cyan-400 bg-[#090A0F] shadow-[0_0_40px_rgba(6,182,212,0.3)] font-mono flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 bg-black/60 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-cyan-400/20 text-cyan-300 border border-cyan-400/30">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-cyan-300">
                MATCHUP INTELLIGENCE DOSSIER
              </span>
              <p className="text-[10px] text-zinc-400">
                Deterministic Red-Zone Telemetry & Scoring Model
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Scroll Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Player Identity Spotlight */}
          <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/40 p-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="h-16 w-16 overflow-hidden rounded-lg border-2 border-cyan-400/40 bg-zinc-900 shadow-[2px_2px_0px_0px_#06b6d4] shrink-0">
                {player.headshotUrl ? (
                  <img
                    src={player.headshotUrl}
                    alt={player.name}
                    className="h-full w-full object-cover object-top"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-zinc-500 font-bold">
                    {player.team}
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-black text-white">{player.name}</h2>
                  <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-[10px] font-bold text-cyan-300 border border-cyan-500/30">
                    {player.position} · {player.team}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  vs <strong className="text-white">{player.opponent}</strong> | Implied Team Total: <strong className="text-cyan-300">{player.impliedTeamTotal.toFixed(1)}</strong>
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="text-[10px] text-zinc-500 uppercase">TDPI Index</div>
              <div className="text-2xl font-black text-cyan-300 font-mono">
                {player.tdpiScore.toFixed(1)}
              </div>
              <div className="text-[9px] font-bold text-emerald-400">
                Tier: {player.tier}
              </div>
            </div>
          </div>

          {/* TDPI Formula Mathematical Decomposition */}
          {/* TDPI Formula / 3D Field Matrix */}
          <div className="space-y-2">
            {is3DEnabled ? (
              <TdFieldMatrix3D player={player} />
            ) : (
              <>
                <div className="text-[11px] font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5" />
                  TDPI Telemetry Vector Breakdown
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <div className="rounded-lg border border-white/10 bg-black/40 p-2.5">
                    <div className="text-[9px] text-zinc-500 uppercase">RZ Touch Share (30%)</div>
                    <div className="text-sm font-black text-white font-mono mt-0.5">
                      {player.rzTouchShare.toFixed(1)}%
                    </div>
                    <div className="text-[8.5px] text-zinc-400 mt-0.5">Rank 1 in team scheme</div>
                  </div>

                  <div className="rounded-lg border border-white/10 bg-black/40 p-2.5">
                    <div className="text-[9px] text-zinc-500 uppercase">Inside-10 Volume (25%)</div>
                    <div className="text-sm font-black text-white font-mono mt-0.5">
                      {player.inside10Touches} Touches
                    </div>
                    <div className="text-[8.5px] text-zinc-400 mt-0.5">{player.inside5Carries ?? 6} inside-5 carries</div>
                  </div>

                  <div className="rounded-lg border border-white/10 bg-black/40 p-2.5">
                    <div className="text-[9px] text-zinc-500 uppercase">Opp RZ Vulnerability (20%)</div>
                    <div className="text-sm font-black text-rose-400 font-mono mt-0.5">
                      #{player.oppRzDefRank} Def Rank
                    </div>
                    <div className="text-[8.5px] text-zinc-400 mt-0.5">{player.oppRzTdPercentAllowed}% TD Allowed</div>
                  </div>

                  <div className="rounded-lg border border-white/10 bg-black/40 p-2.5">
                    <div className="text-[9px] text-zinc-500 uppercase">Implied Total (15%)</div>
                    <div className="text-sm font-black text-white font-mono mt-0.5">
                      {player.impliedTeamTotal.toFixed(1)} Pts
                    </div>
                    <div className="text-[8.5px] text-zinc-400 mt-0.5">Projected ~3.2 Team TDs</div>
                  </div>

                  <div className="rounded-lg border border-white/10 bg-black/40 p-2.5">
                    <div className="text-[9px] text-zinc-500 uppercase">Goal-Line Snap Share (10%)</div>
                    <div className="text-sm font-black text-white font-mono mt-0.5">
                      {player.goalLineSnapPercent ?? 85}%
                    </div>
                    <div className="text-[8.5px] text-zinc-400 mt-0.5">Primary goal-line package</div>
                  </div>

                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-2.5">
                    <div className="text-[9px] text-emerald-400 uppercase">Model EV Edge</div>
                    <div className="text-sm font-black text-emerald-400 font-mono mt-0.5">
                      +{player.modelEdgePercent.toFixed(1)}%
                    </div>
                    <div className="text-[8.5px] text-zinc-400 mt-0.5">Book Odds: {player.marketOdds}</div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* AI Vouch Rationale & Collision Analysis */}
          <div className="space-y-2">
            <div className="text-[11px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              AI Vouch Model Rationale
            </div>
            <div className="rounded-lg border border-white/10 bg-black/50 p-3 space-y-2 text-xs">
              {player.reasons && player.reasons.length > 0 ? (
                player.reasons.map((r, i) => (
                  <div key={i} className="flex items-start gap-2 text-zinc-300">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{r}</span>
                  </div>
                ))
              ) : (
                <p className="text-zinc-400">High leverage touchdown volume projected.</p>
              )}

              {player.warnings && player.warnings.length > 0 && (
                <div className="pt-2 border-t border-white/10 space-y-1">
                  <div className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Risk Snapshot
                  </div>
                  {player.warnings.map((w, i) => (
                    <div key={i} className="text-zinc-400 text-[11px] pl-4">
                      {w}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Historical Trend */}
          {player.historicalTrend && (
            <div className="space-y-2">
              <div className="text-[11px] font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" />
                Touchdown Game Log (Last 5 Games)
              </div>
              <div className="flex items-center gap-2">
                {player.historicalTrend.map((tdCount, idx) => (
                  <div
                    key={idx}
                    className={`flex-1 rounded border p-2 text-center ${
                      tdCount > 0
                        ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300 font-bold'
                        : 'border-white/10 bg-black/40 text-zinc-500'
                    }`}
                  >
                    <div className="text-[8.5px] uppercase">G-{5 - idx}</div>
                    <div className="text-sm font-black mt-0.5">{tdCount} TD</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between border-t border-white/10 bg-black/80 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded border border-white/20 text-xs font-bold text-zinc-300 hover:text-white hover:border-white/40 transition-colors cursor-pointer"
          >
            Close Dossier
          </button>

          <button
            type="button"
            onClick={() => {
              onAddToSlip(player);
              onClose();
            }}
            className="flex items-center gap-1.5 rounded-lg border-2 border-cyan-400 bg-cyan-400 px-5 py-2 text-xs font-black text-black uppercase tracking-wider hover:bg-cyan-300 shadow-[2px_2px_0px_0px_#ffffff] transition-all cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 stroke-[3]" />
            Add To Parlay Slip
          </button>
        </div>
      </div>
    </div>
  );
};
