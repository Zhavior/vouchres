import React from 'react';
import { Activity, AlertTriangle, Check, ChevronRight, Flame, Info, Plus } from 'lucide-react';
import { getMarketOdds, getSelectedBookieOddsValue, decimalToAmerican } from '../../../../utils/oddsHelper';
import type { PlayerResearchModel } from "../../hooks/usePlayerResearchConsole";

export default function PropsHealthBento({ model }: { model: PlayerResearchModel }) {
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
              {/* Bento Row 3: Propositions integration & Health risks */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6" id="bento-row-propositions">
                
                {/* Wager proposition cards list */}
                <div className="col-span-1 md:col-span-7 bg-black/34 border border-white/30 rounded-3xl p-5 shadow-lg space-y-4">
                  <div className="border-b border-white/28 pb-2.5 flex items-center justify-between">
                    <span className="text-xs font-black text-white/70 font-mono uppercase tracking-wider flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-orange-400" /> SABERMETRIC WAGER PROPS
                    </span>
                    <span className="text-[10px] text-white/45 font-mono font-bold">Select Line for Slip</span>
                  </div>

                  <p className="text-[10.5px] text-white/45 font-mono leading-relaxed bg-black/34 p-3.5 rounded-2xl border border-white/30">
                    Calculated via dynamic matchup coefficients. Stage straight onto your live active Parlay slip, or vouch to lock it on your public feed vouchboard.
                  </p>

                  <div className="space-y-3" id="props-channel-list">
                    {activePlayer.propositions.map((p) => {
                      const isVouched = savedVouchIds.includes(p.id);
                      const isAddedToParlay = activeLegs.some(l => l.id === p.id || l.id.includes(p.id) || p.spec.includes(l.selection));
                      const comparison = getMarketOdds(p.id, p.odds);
                      const isExpanded = expandedPropIds.includes(p.id);

                      return (
                        <div 
                          key={p.id} 
                          className="bg-black/38 border border-white/30 p-4 rounded-2xl flex flex-col gap-4 shadow hover:border-white/50 transition-colors"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <span className="text-[10px] bg-black/42 border border-white/30 text-vouch-cyan px-2.5 py-1 rounded-lg font-mono font-black uppercase">
                                {p.market}
                              </span>
                              <span className="block text-xs text-white/70 font-mono font-bold mt-2.5 truncate">
                                🎰 PROP SPEC: {p.spec}
                              </span>
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                <span className="text-[10px] text-white/45 font-mono">
                                  Market Average: <strong className="text-vouch-cyan font-bold">{comparison.marketAverageDecimal} ({comparison.marketAverageAmerican})</strong>
                                </span>
                                <span className="text-[9px] text-white/45 font-mono">•</span>
                                <span className="text-[10px] text-white/45 font-mono">
                                  Best Line: <strong className="text-vouch-emerald font-bold">{comparison.bestOddsDecimal.toFixed(2)} ({decimalToAmerican(comparison.bestOddsDecimal)}) via {comparison.bestBookieName}</strong>
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap flex-shrink-0 self-end sm:self-center">
                              
                              {/* Open multi-bookmaker details panel */}
                              <button
                                type="button"
                                onClick={() => togglePropDetails(p.id)}
                                className={`px-3 py-2 rounded-xl text-[10px] font-mono font-bold border transition-all ${
                                  isExpanded 
                                    ? 'bg-black/40 border-vouch-cyan/40 text-vouch-cyan' 
                                    : 'bg-black/42 border-white/30 text-white/45 hover:text-white/70'
                                }`}
                              >
                                {isExpanded ? 'Hide Bookies ⚖️' : 'Compare Bookies ⚖️'}
                              </button>

                              {/* Vouch toggle action badge */}
                              <button
                                onClick={() => handleVouchProposition(activePlayer, p)}
                                className={`px-3 py-2 rounded-xl text-[10px] font-mono font-black transition-all border ${
                                  isVouched 
                                    ? 'bg-vouch-cyan/16 border-vouch-cyan/42 text-vouch-cyan'
                                    : 'bg-black/42 border-white/30 text-white/45 hover:text-white/70'
                                }`}
                                title={isVouched ? "Remove from Board" : "Collect & Vouch on Board"}
                              >
                                {isVouched ? 'VOUCHED ✓' : 'VOUCH PROP'}
                              </button>

                              {/* Parlay constructor trigger */}
                              {(() => {
                                const playerTeam = activePlayer.team ? activePlayer.team.toLowerCase() : '';
                                const matchedGame = liveGames.find((g: any) => 
                                  g.homeTeam.toLowerCase() === playerTeam || 
                                  g.awayTeam.toLowerCase() === playerTeam
                                );
                                const isFinal = matchedGame && matchedGame.status.toLowerCase() === 'final';

                                return (
                                  <button
                                    onClick={() => handleWagerProposition(activePlayer, p)}
                                    disabled={isAddedToParlay || isFinal}
                                    className={`py-2 px-3.5 rounded-xl text-[10px] font-extrabold font-mono transition-all flex items-center gap-1.5 ${
                                      isAddedToParlay
                                        ? 'bg-black/42 border border-white/30 text-white/45 cursor-not-allowed'
                                        : isFinal
                                        ? 'bg-red-950/45 border border-red-900/30 text-red-400 cursor-not-allowed font-bold'
                                        : 'bg-emerald-500 hover:bg-vouch-emerald text-white/45 font-black shadow-md'
                                    }`}
                                  >
                                    {isFinal ? null : <Plus className="w-3.5 h-3.5" />}
                                    <span>{isAddedToParlay ? 'STAGED' : isFinal ? '🔒 LOCKED' : `SLIP +${p.odds.toFixed(2)}`}</span>
                                  </button>
                                );
                              })()}

                            </div>
                          </div>

                          {/* Expanded comparison detail component */}
                          {isExpanded && (
                            <div className="bg-black/34 border border-white/28 rounded-xl p-3 space-y-2">
                              <div className="text-[10px] text-white/45 font-mono font-bold uppercase tracking-wider flex justify-between">
                                <span>Real-Time Sportsbook Lines Comparison</span>
                                <span className="text-vouch-emerald font-extrabold">Best payout highlighted</span>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {/* Bet365 */}
                                <div className={`p-2 rounded-xl flex flex-col justify-center bg-black/38 border ${comparison.bet365.isBest ? 'border-emerald-600/60 bg-emerald-950/10' : 'border-white/30'}`}>
                                  <span className="text-[9px] text-white/45 font-mono uppercase">Bet365</span>
                                  <strong className={`text-xs ${comparison.bet365.isBest ? 'text-vouch-emerald font-extrabold' : 'text-white/70'}`}>
                                    {comparison.bet365.oddsDecimal.toFixed(2)} ({comparison.bet365.oddsAmerican})
                                  </strong>
                                </div>
                                {/* FanDuel */}
                                <div className={`p-2 rounded-xl flex flex-col justify-center bg-black/38 border ${comparison.fanduel.isBest ? 'border-emerald-600/60 bg-emerald-950/10 text-white/70' : 'border-white/30'}`}>
                                  <span className="text-[9px] text-white/45 font-mono uppercase">FanDuel</span>
                                  <strong className={`text-xs ${comparison.fanduel.isBest ? 'text-vouch-emerald font-extrabold' : 'text-white/70'}`}>
                                    {comparison.fanduel.oddsDecimal.toFixed(2)} ({comparison.fanduel.oddsAmerican})
                                  </strong>
                                </div>
                                {/* DraftKings */}
                                <div className={`p-2 rounded-xl flex flex-col justify-center bg-black/38 border ${comparison.draftkings.isBest ? 'border-emerald-600/60 bg-emerald-950/10 text-white/70' : 'border-white/30'}`}>
                                  <span className="text-[9px] text-white/45 font-mono uppercase">DraftKings</span>
                                  <strong className={`text-xs ${comparison.draftkings.isBest ? 'text-vouch-emerald font-extrabold' : 'text-white/70'}`}>
                                    {comparison.draftkings.oddsDecimal.toFixed(2)} ({comparison.draftkings.oddsAmerican})
                                  </strong>
                                </div>
                                {/* Caesars */}
                                <div className={`p-2 rounded-xl flex flex-col justify-center bg-black/38 border ${comparison.caesars.isBest ? 'border-emerald-600/60 bg-emerald-950/10 text-white/70' : 'border-white/30'}`}>
                                  <span className="text-[9px] text-white/45 font-mono uppercase">Caesars</span>
                                  <strong className={`text-xs ${comparison.caesars.isBest ? 'text-vouch-emerald font-extrabold' : 'text-white/70'}`}>
                                    {comparison.caesars.oddsDecimal.toFixed(2)} ({comparison.caesars.oddsAmerican})
                                  </strong>
                                </div>
                                {/* BetMGM */}
                                <div className={`p-2 rounded-xl flex flex-col justify-center bg-black/38 border ${comparison.betmgm.isBest ? 'border-emerald-600/60 bg-emerald-950/10 text-white/70' : 'border-white/30'}`}>
                                  <span className="text-[9px] text-white/45 font-mono uppercase">BetMGM</span>
                                  <strong className={`text-xs ${comparison.betmgm.isBest ? 'text-vouch-emerald font-extrabold' : 'text-white/70'}`}>
                                    {comparison.betmgm.oddsDecimal.toFixed(2)} ({comparison.betmgm.oddsAmerican})
                                  </strong>
                                </div>
                                {/* Market Average */}
                                <div className="p-2 rounded-xl flex flex-col justify-center bg-vouch-cyan/10 border border-vouch-cyan/28">
                                  <span className="text-[9px] text-vouch-cyan font-mono uppercase">Market Avg</span>
                                  <strong className="text-xs text-vouch-cyan font-black">
                                    {comparison.marketAverageDecimal.toFixed(2)} ({comparison.marketAverageAmerican})
                                  </strong>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Injury HEALTH RISK REPORT */}
                <div className="col-span-1 md:col-span-5 bg-black/34 border border-white/30 rounded-3xl p-5 shadow-lg flex flex-col justify-between" id="injury-advisory-risk-box">
                  <div className="border-b border-white/28 pb-2.5 flex items-center gap-1.5 text-xs font-black text-white/70 font-mono uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4 text-amber-500" /> HEALTH Roster report
                  </div>

                  <div className="my-4 bg-black/38 p-4 rounded-2xl border border-white/28 space-y-4 flex-1 flex flex-col justify-center">
                    
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl flex items-center justify-center ${
                        activePlayer.injurySeverity === 'NONE' ? 'bg-vouch-emerald/10' : 'bg-amber-500/10'
                      }`}>
                        <Activity className={`w-5 h-5 ${
                          activePlayer.injurySeverity === 'NONE' ? 'text-vouch-emerald' : 'text-amber-400'
                        }`} />
                      </div>
                      <div>
                        <span className="block text-[8px] text-white/45 font-mono tracking-widest uppercase">RISK LEVEL INDICATOR:</span>
                        <strong className={`block text-xs uppercase font-black font-mono tracking-wide ${
                          activePlayer.injurySeverity === 'NONE' ? 'text-vouch-emerald' : 'text-amber-400'
                        }`}>
                          {activePlayer.injurySeverity === 'NONE' ? 'Cleared / Low risk' : `${activePlayer.injurySeverity} Warning`}
                        </strong>
                      </div>
                    </div>

                    <p className="text-xs text-white/70 font-mono leading-relaxed bg-black/34 p-3 rounded-xl border border-white/30">
                      <span className="text-white font-extrabold capitalize">{activePlayer.injuryStatus}: </span>
                      {activePlayer.injuryNotes}
                    </p>

                  </div>

                  <span className="text-[9px] text-white/45 block font-mono text-center leading-none mt-2 uppercase">
                    Updated live relative to team dugout bulletins
                  </span>
                </div>

              </div>
    </>
  );
}
