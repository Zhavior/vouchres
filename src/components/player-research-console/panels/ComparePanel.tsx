import React from 'react';
import { BarChart3, Activity, Flame, Check, Plus } from 'lucide-react';
import { getMarketOdds, getSelectedBookieOddsValue, decimalToAmerican } from '../../../utils/oddsHelper';
import { getTeamColors } from '../utils/teamColors';
import type { PlayerResearchModel } from '../../hooks/usePlayerResearchConsole';

export default function ComparePanel({ model }: { model: PlayerResearchModel }) {
  const {
    searchTerm, setSearchTerm,
    selectedTeam, setSelectedTeam,
    selectedInjuryStatus, setSelectedInjuryStatus,
    selectedPosition, setSelectedPosition,
    opposingPitcherType, setOpposingPitcherType,
    dossierMode, setDossierMode,
    activePlayer, setActivePlayer,
    compareMode, setCompareMode,
    comparePlayer, setComparePlayer,
    displayedPlayers,
    ROSTER_RENDER_CAP,
    isSearchingApi,
    isRefreshingApi,
    activeSplitTab, setActiveSplitTab,
    activeMetricsTab, setActiveMetricsTab,
    expandedPropIds,
    togglePropDetails,
    aiReportCache,
    isResearching,
    toastMessage,
    showToast,
    runLiveAIResearch,
    teams,
    positions,
    filteredPlayers,
    handleWagerProposition,
    handleVouchProposition,
    selectActivePlayer,
    selectComparePlayer,
    activeColors,
    activeAiReport,
    savedVouchIds,
    activeLegs,
    liveGames
  } = model;

  return (
    <>
            <div className="bg-black/34 border border-white/30 rounded-3xl p-6 shadow-2xl space-y-6" id="comparison-metric-dossier">
              
              {/* Header Comp */}
              <div className="flex items-center justify-between border-b border-white/28 pb-4">
                <div className="flex items-center gap-2.5">
                  <BarChart3 className="w-5 h-5 text-vouch-cyan animate-pulse" />
                  <span className="text-xs font-black text-white/70 font-mono tracking-widest uppercase">HEAD-TO-HEAD SABERMETRIC MATCHUP ATOMIZER</span>
                </div>
                <button
                  onClick={() => setCompareMode(false)}
                  className="text-white/45 hover:text-vouch-emerald text-xs font-mono underline transition-colors"
                >
                  Exit Comparison
                </button>
              </div>

              {/* Quick Athlete Header Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Primary Athlete Card */}
                <div className="bg-emerald-950/5 border border-vouch-emerald/50/10 p-5 rounded-2xl flex flex-col items-center text-center relative overflow-hidden">
                  <div className="absolute right-0 top-0 text-[32px] font-black text-emerald-500/5 font-mono select-none pointer-events-none">A</div>
                  <span className="text-[9px] text-vouch-emerald font-mono font-extrabold tracking-widest uppercase mb-3">Athletic Alpha Target</span>
                  <img 
                    src={activePlayer.headshot} 
                    alt={activePlayer.name}
                    referrerPolicy="no-referrer"
                    loading="eager"
                    decoding="async"
                    fetchPriority="high"
                    className="w-20 h-20 rounded-2xl border border-vouch-emerald/50/30 shadow-xl object-cover"
                  />
                  <h3 className="font-extrabold text-white text-base mt-3 leading-tight font-display">{activePlayer.name}</h3>
                  <span className="text-xs text-white/45 font-mono mt-0.5">{activePlayer.team} • #{activePlayer.number}</span>
                  
                  <div className="mt-4 flex items-center gap-2.5 bg-black/42 px-4 py-1.5 rounded-full border border-white/30">
                    <span className="text-[10px] text-white/45 font-mono">BAT RATING:</span>
                    <span className="text-base font-black text-vouch-emerald font-mono">{aiReportCache[activePlayer.id]?.score || activePlayer.batterScore}</span>
                  </div>
                </div>

                {/* Secondary Athlete Card */}
                <div className="bg-vouch-cyan/5 border border-vouch-cyan/10 p-5 rounded-2xl flex flex-col items-center text-center relative overflow-hidden">
                  <div className="absolute right-0 top-0 text-[32px] font-black text-vouch-cyan/5 font-mono select-none pointer-events-none">B</div>
                  <span className="text-[9px] text-vouch-cyan font-mono font-extrabold tracking-widest uppercase mb-3">Comparison Beta Target</span>
                  <img 
                    src={comparePlayer.headshot} 
                    alt={comparePlayer.name}
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    decoding="async"
                    className="w-20 h-20 rounded-2xl border border-vouch-cyan/30 shadow-xl object-cover"
                  />
                  <h3 className="font-extrabold text-white text-base mt-3 leading-tight font-display">{comparePlayer.name}</h3>
                  <span className="text-xs text-white/45 font-mono mt-0.5">{comparePlayer.team} • #{comparePlayer.number}</span>
                  
                  <div className="mt-4 flex items-center gap-2.5 bg-black/42 px-4 py-1.5 rounded-full border border-white/30">
                    <span className="text-[10px] text-white/45 font-mono">BAT RATING:</span>
                    <span className="text-base font-black text-vouch-cyan font-mono">{aiReportCache[comparePlayer.id]?.score || comparePlayer.batterScore}</span>
                  </div>
                </div>

              </div>

              {/* Sabermetric Metrics Head to Head */}
              <div className="bg-black/40 border border-white/30 rounded-3xl p-5 space-y-4">
                <h4 className="text-xs font-black text-white/70 font-mono uppercase tracking-wider text-center border-b border-white/24 pb-3">
                  STATCAST METRIC RADAR COMPARISON
                </h4>

                {/* Metric comparisons list */}
                {[
                  { label: "Barrel Accuracy %", valA: activePlayer.advanced.barrelPercent, valB: comparePlayer.advanced.barrelPercent, suffix: "%", highGood: true, max: 25 },
                  { label: "Apex Launch Angle", valA: activePlayer.advanced.launchAngle, valB: comparePlayer.advanced.launchAngle, suffix: "°", highGood: true, max: 25 },
                  { label: "Average Exit Velocity", valA: activePlayer.advanced.exitVelocity, valB: comparePlayer.advanced.exitVelocity, suffix: " mph", highGood: true, max: 100 },
                  { label: "Hard Contact %", valA: activePlayer.advanced.hardHitPercent, valB: comparePlayer.advanced.hardHitPercent, suffix: "%", highGood: true, max: 70 },
                  { label: "O-Swing / Chase %", valA: activePlayer.advanced.chasePercent, valB: comparePlayer.advanced.chasePercent, suffix: "%", highGood: false, max: 40 },
                  { label: "Estimated wOBA", valA: activePlayer.advanced.woba, valB: comparePlayer.advanced.woba, suffix: "", precision: 3, highGood: true, max: 0.5 },
                  { label: "Expected xwOBA", valA: activePlayer.advanced.xwoba, valB: comparePlayer.advanced.xwoba, suffix: "", precision: 3, highGood: true, max: 0.5 }
                ].map((m, idx) => {
                  const betterA = m.highGood ? m.valA > m.valB : m.valA < m.valB;
                  const ratioA = Math.min((m.valA / m.max) * 100, 100);
                  const ratioB = Math.min((m.valB / m.max) * 100, 100);

                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className={`font-mono font-extrabold ${betterA ? 'text-vouch-emerald' : 'text-white/45'}`}>
                          {m.precision ? m.valA.toFixed(m.precision) : m.valA}{m.suffix}
                        </span>
                        <span className="text-[10px] text-white/45 font-mono tracking-wide uppercase">{m.label}</span>
                        <span className={`font-mono font-extrabold ${!betterA ? 'text-vouch-cyan' : 'text-white/45'}`}>
                          {m.precision ? m.valB.toFixed(m.precision) : m.valB}{m.suffix}
                        </span>
                      </div>

                      {/* Head-to-Head Double Bar Slider */}
                      <div className="h-2 w-full flex bg-black/72 rounded-full overflow-hidden border border-white/30">
                        {/* Athlete A */}
                        <div className="w-1/2 flex justify-end">
                          <div 
                            className="h-full bg-gradient-to-l from-emerald-500 to-emerald-700/50 rounded-l"
                            style={{ width: `${ratioA}%` }}
                          />
                        </div>
                        {/* Center gap segment */}
                        <div className="w-[1px] bg-white/15"></div>
                        {/* Athlete B */}
                        <div className="w-1/2 flex justify-start">
                          <div 
                            className="h-full bg-gradient-to-r from-vouch-cyan to-vouch-cyan/50 rounded-r"
                            style={{ width: `${ratioB}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Splits comparison summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-black/40 border border-white/30 p-4 rounded-2xl space-y-3">
                  <h5 className="text-[10px] font-black text-vouch-emerald font-mono uppercase tracking-wider text-center">
                    {activePlayer.name.toUpperCase()} PLATOON SPLITS
                  </h5>
                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between pb-1 border-b border-white/24 text-[9px] text-white/45">
                      <span>SITUATION</span>
                      <span>STATS (OPS)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/45">vs Left Pitcher:</span>
                      <strong className="text-white/70">{activePlayer.splits.vLHP.ops} OPS</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/45">vs Right Pitcher:</span>
                      <strong className="text-white/70">{activePlayer.splits.vRHP.ops} OPS</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/45">At Home Arena:</span>
                      <strong className="text-white/70">{activePlayer.splits.home.ops} OPS</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/45">Last 10 Starts:</span>
                      <strong className="text-vouch-emerald font-black">{activePlayer.splits.last10.ops} OPS</strong>
                    </div>
                  </div>
                </div>

                <div className="bg-black/40 border border-white/30 p-4 rounded-2xl space-y-3">
                  <h5 className="text-[10px] font-black text-vouch-cyan font-mono uppercase tracking-wider text-center">
                    {comparePlayer.name.toUpperCase()} PLATOON SPLITS
                  </h5>
                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between pb-1 border-b border-white/24 text-[9px] text-white/45">
                      <span>SITUATION</span>
                      <span>STATS (OPS)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/45">vs Left Pitcher:</span>
                      <strong className="text-white/70">{comparePlayer.splits.vLHP.ops} OPS</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/45">vs Right Pitcher:</span>
                      <strong className="text-white/70">{comparePlayer.splits.vRHP.ops} OPS</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/45">At Home Arena:</span>
                      <strong className="text-white/70">{comparePlayer.splits.home.ops} OPS</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/45">Last 10 Starts:</span>
                      <strong className="text-vouch-cyan font-black">{comparePlayer.splits.last10.ops} OPS</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Multi-Prop builder comparison card */}
              <div className="bg-black/40 border border-white/30 rounded-3xl p-5">
                <h5 className="text-xs font-black font-mono text-white/70 uppercase tracking-widest mb-4">HEAD-TO-HEAD EDGE PROPOSITIONS</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Props A */}
                  <div className="space-y-2">
                    <span className="text-[9.5px] text-white/45 font-mono font-extrabold tracking-wider">{activePlayer.name.toUpperCase()} WAGERS</span>
                    {activePlayer.propositions.map((p) => {
                      const playerTeam = activePlayer.team ? activePlayer.team.toLowerCase() : '';
                      const matchedGame = liveGames.find((g: any) => 
                        g.homeTeam.toLowerCase() === playerTeam || 
                        g.awayTeam.toLowerCase() === playerTeam
                      );
                      const isFinal = matchedGame && matchedGame.status.toLowerCase() === 'final';

                      return (
                        <div key={p.id} className="bg-black/38 p-3 rounded-xl border border-white/30 flex items-center justify-between">
                          <div className="min-w-0 pr-2">
                            <span className="text-[11px] font-bold text-white block truncate leading-tight">{p.market}</span>
                            <span className="text-[9.5px] text-white/45 font-mono block mt-1 truncate">{p.spec}</span>
                          </div>
                          <button 
                            onClick={() => handleWagerProposition(activePlayer, p)}
                            disabled={isFinal}
                            className={`border-2 px-2.5 py-1 rounded-xl text-[10px] font-extrabold font-mono transition-all flex-shrink-0 ${
                              isFinal
                                ? 'bg-red-950/20 border-red-900/30 text-red-400 cursor-not-allowed opacity-65'
                                : 'bg-vouch-emerald/10 border-vouch-emerald/20 text-vouch-emerald hover:bg-emerald-500 hover:text-white'
                            }`}
                          >
                            {isFinal ? 'LOCKED' : `+${p.odds.toFixed(2)}`}
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Props B */}
                  <div className="space-y-2">
                    <span className="text-[9.5px] text-white/45 font-mono font-extrabold tracking-wider">{comparePlayer.name.toUpperCase()} WAGERS</span>
                    {comparePlayer.propositions.map((p) => {
                      const playerTeam = comparePlayer.team ? comparePlayer.team.toLowerCase() : '';
                      const matchedGame = liveGames.find((g: any) => 
                        g.homeTeam.toLowerCase() === playerTeam || 
                        g.awayTeam.toLowerCase() === playerTeam
                      );
                      const isFinal = matchedGame && matchedGame.status.toLowerCase() === 'final';

                      return (
                        <div key={p.id} className="bg-black/38 p-3 rounded-xl border border-white/30 flex items-center justify-between">
                          <div className="min-w-0 pr-2">
                            <span className="text-[11px] font-bold text-white block truncate leading-tight">{p.market}</span>
                            <span className="text-[9.5px] text-white/45 font-mono block mt-1 truncate">{p.spec}</span>
                          </div>
                          <button 
                            onClick={() => handleWagerProposition(comparePlayer, p)}
                            disabled={isFinal}
                            className={`border-2 px-2.5 py-1 rounded-xl text-[10px] font-extrabold font-mono transition-all flex-shrink-0 ${
                              isFinal
                                ? 'bg-red-950/20 border-red-900/30 text-red-400 cursor-not-allowed opacity-65'
                                : 'bg-vouch-cyan/10 border-vouch-cyan/20 text-vouch-cyan hover:bg-vouch-cyan hover:text-white'
                            }`}
                          >
                            {isFinal ? 'LOCKED' : `+${p.odds.toFixed(2)}`}
                          </button>
                        </div>
                      );
                    })}
                  </div>

                </div>
              </div>

            </div>
    </>
  );
}
