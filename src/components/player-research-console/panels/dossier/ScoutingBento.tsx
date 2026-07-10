import React from 'react';
import { Trophy, Target, Activity } from 'lucide-react';
import type { PlayerResearchModel } from '../../../hooks/usePlayerResearchConsole';

export default function ScoutingBento({ model }: { model: PlayerResearchModel }) {
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
              {/* Bento Row 2: static default reports & Interactive Strike-Zone map */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6" id="bento-scouting-reports">
                
                {/* AI Scouting narrative logs */}
                <div className="col-span-1 md:col-span-7 bg-black/34 border border-white/30 rounded-3xl p-5 shadow-lg space-y-4">
                  <h3 className="text-xs font-black text-white/70 font-mono uppercase tracking-wider flex items-center gap-1.5 border-b border-white/28 pb-2.5">
                    <Trophy className="w-4 h-4 text-vouch-emerald" /> SABERMETRIC ATHLETE ADVANTAGE METRICS
                  </h3>

                  <div className="space-y-4 text-xs text-white/70 leading-relaxed">
                    
                    {/* Contact projection */}
                    <div>
                      <span className="font-extrabold text-white/45 font-mono text-[9px] uppercase block mb-1">■ ZONE BARREL CORRELATION INDEX:</span>
                      <p className="bg-black/38 p-3 rounded-2xl border border-white/30 font-mono text-[11px] text-white/70">
                        {activePlayer.scoutingReport.contactText}
                      </p>
                    </div>

                    {/* Power Projection */}
                    <div>
                      <span className="font-extrabold text-white/45 font-mono text-[9px] uppercase block mb-1">■ RAW BALLISTIC RETENTION PROFILE:</span>
                      <p className="bg-black/38 p-3 rounded-2xl border border-white/30 font-mono text-[11px] text-white/70">
                        {activePlayer.scoutingReport.powerText}
                      </p>
                    </div>

                    {/* Overall Summary block */}
                    <div className="pt-2">
                      <span className="font-extrabold text-vouch-emerald font-mono text-[9.5px] uppercase block mb-1">■ BASELINE MODEL RECOMMENDATION:</span>
                      <p className="text-white/70 text-[11.5px] italic font-semibold">
                        "{activePlayer.scoutingReport.overallScouting}"
                      </p>
                    </div>

                  </div>
                </div>

                {/* Strike zone Hotness map */}
                <div className="col-span-1 md:col-span-5 bg-black/34 border border-white/30 rounded-3xl p-5 shadow-lg flex flex-col justify-between" id="strike-zone-matrix">
                  <div className="border-b border-white/28 pb-2.5 flex items-center justify-between">
                    <span className="text-xs font-black text-white/70 font-mono uppercase tracking-wider flex items-center gap-1.5">
                      <Target className="w-4 h-4 text-red-400" /> PITCH SWEET SPOTS
                    </span>
                    <span className="text-[9px] text-white/45 font-mono">3x3 Strike Zone</span>
                  </div>

                  <p className="text-[10px] text-white/45 font-mono leading-tight my-3">
                    Red-highlighted cells indicate high contact frequency for {activePlayer.name}.
                  </p>

                  {/* 3x3 Grid Strike Map visualization */}
                  <div className="grid grid-cols-3 gap-2 p-3 bg-black/72 rounded-2xl border border-white/28 justify-center">
                    
                    {/* Zone boxes */}
                    {[
                      { l: "Up & In", color: "bg-red-950/20 text-red-400 border-red-500/10" },
                      { l: "Up-Middle", color: "bg-amber-950/20 text-amber-500 border-amber-500/10" },
                      { l: "Up & Away", color: "bg-black/38 text-white/45 border-white/28" },
                      { l: "Middle-In", color: "bg-red-500/5 text-red-350 border-red-500/10" },
                      { l: "Middle-Middle", color: "bg-red-500/20 text-red-200 border-red-500/30 font-extrabold" },
                      { l: "Middle-Away", color: "bg-black/38 text-white/45 border-white/28" },
                      { l: "Down & In", color: "bg-red-500/10 text-red-300 border-red-500/20 font-bold" },
                      { l: "Low-Middle", color: "bg-amber-950/20 text-amber-500 border-amber-500/10" },
                      { l: "Low-Away", color: "bg-black/38 text-white/45 border-white/28" }
                    ].map((box, bidx) => {
                      const isHot = activePlayer.scoutingReport.hotZones.includes(box.l);
                      const finalColor = isHot
                        ? "bg-red-500/25 text-red-100 border-red-500 animate-pulse font-extrabold border-2"
                        : box.color + " border";
                      return (
                        <div 
                          key={bidx} 
                          title={`Zone split index: ${box.l}`}
                          className={`aspect-square rounded-xl flex items-center justify-center text-[10px] text-center font-mono p-1.5 transition-all hover:scale-105 select-none ${finalColor}`}
                        >
                          <span className="truncate max-w-full block leading-none">{box.l}</span>
                        </div>
                      );
                    })}

                  </div>

                  {/* Hot zones listed labels */}
                  <div className="flex flex-wrap gap-1.5 mt-4 justify-center">
                    {activePlayer.scoutingReport.hotZones.map((h, hidx) => (
                      <span key={hidx} className="text-[9.5px] font-mono font-bold bg-red-500/10 border border-red-500/20 text-red-405 text-red-400 px-3 py-1 rounded-full">
                        🔥 {h} Spot
                      </span>
                    ))}
                  </div>

                </div>

              </div>
    </>
  );
}
