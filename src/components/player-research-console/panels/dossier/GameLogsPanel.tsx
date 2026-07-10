import React from 'react';
import { Calendar, Info } from 'lucide-react';
import type { PlayerResearchModel } from "../../hooks/usePlayerResearchConsole";

export default function GameLogsPanel({ model }: { model: PlayerResearchModel }) {
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
              {/* Bento Row 4: Comprehensive Game Logs Table */}
              <div className="bg-black/34 border border-white/30 rounded-3xl p-5 shadow-xl space-y-4" id="game-logs-block">
                <div className="border-b border-white/28 pb-2.5 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-vouch-emerald" />
                    <span className="text-xs font-black text-white/70 font-mono uppercase tracking-wider">
                      RECENT ATHLETE CONTEST STATISTICS LOG
                    </span>
                  </div>
                  <span className="text-[10px] text-white/45 font-mono">{activePlayer.gameLogs.length} CONTRASTS LOGGED</span>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-white/30 bg-black/72" id="game-logs-layout-container">
                  <table className="w-full text-left text-xs font-mono border-collapse min-w-[650px]">
                    <thead>
                      <tr className="border-b border-white/24 text-white/45 text-[9.5px] uppercase tracking-wider">
                        <th className="py-3.5 px-4 font-black">Date</th>
                        <th className="py-3.5 px-4 font-black">Opponent Matchup</th>
                        <th className="py-3.5 px-4 text-center font-black">Result</th>
                        <th className="py-3.5 px-4 text-center font-black">AB</th>
                        <th className="py-3.5 px-4 text-center font-black">Hits</th>
                        <th className="py-3.5 px-4 text-center font-black">HR</th>
                        <th className="py-3.5 px-4 text-center font-black">RBI</th>
                        <th className="py-3.5 px-4 text-center font-black">R</th>
                        <th className="py-3.5 px-4 text-right font-black pr-4">Batter Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/24 text-white/70" id="game-logs-rows">
                      {activePlayer.gameLogs.map((log, idx) => {
                        const isWin = log.result.startsWith('W');
                        return (
                          <tr key={idx} className="hover:bg-black/34 transition-colors">
                            <td className="py-3 px-4 text-white/45 font-mono">{log.date}</td>
                            <td className="py-3 px-4 text-white font-black font-mono">{log.opponent}</td>
                            <td className="py-3 px-4 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black ${isWin ? 'bg-vouch-emerald/10 text-vouch-emerald border border-vouch-emerald/20' : 'bg-red-500/10 text-red-400'}`}>
                                {log.result}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-white/70">{log.ab}</td>
                            <td className="py-3 px-4 text-center font-bold text-white">{log.h}</td>
                            <td className="py-3 px-4 text-center font-bold text-orange-400">{log.hr}</td>
                            <td className="py-3 px-4 text-center font-bold text-white/70">{log.rbi}</td>
                            <td className="py-3 px-4 text-center font-bold text-white/70">{log.r}</td>
                            <td className="py-3 px-4 text-right pr-4">
                              <span className={`font-black ${
                                log.batterScore >= 90 ? 'text-vouch-emerald' :
                                log.batterScore >= 70 ? 'text-amber-400' : 'text-red-400'
                              }`}>
                                {log.batterScore}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center gap-1.5 text-[9.5px] text-white/45 mt-2 font-mono">
                  <Info className="w-3.5 h-3.5 text-vouch-emerald" />
                  <span>Individual game-level Sabermetric coefficients calculated on actual plate-level exit distributions.</span>
                </div>
              </div>
    </>
  );
}
