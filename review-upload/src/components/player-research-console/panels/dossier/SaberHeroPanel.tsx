import React from 'react';
import { Activity, ArrowRight, Check, Clock, HelpCircle, RefreshCw, Sparkles, Target, Trophy, Zap } from 'lucide-react';
import { renderMarkdownText } from '../../utils/markdown';
import type { PlayerResearchModel } from "../../hooks/usePlayerResearchConsole";

export default function SaberHeroPanel({ model }: { model: PlayerResearchModel }) {
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
                  {/* HERO BLOCK */}
                  <div className={`bg-gradient-to-br ${activeColors.gradient} border ${activeColors.border} rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col gap-6`} id="active-athlete-hero">
                
                {/* Background ambient light design glow */}
                <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

                {/* Top Section: Identity & Gauge */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-5 border-b border-white/28 w-full" id="hero-top-info">
                  
                  {/* Left Side: Avatar + Name / Team Info */}
                  <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left min-w-0 flex-1">
                    {/* Headshot */}
                    <div className="relative flex-shrink-0" id="hero-headshot-box">
                      <img 
                        src={activePlayer.headshot} 
                        alt={activePlayer.name}
                        referrerPolicy="no-referrer"
                        loading="eager"
                        decoding="async"
                        fetchPriority="high"
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border border-white/34 shadow-2xl object-cover bg-black/72"
                      />
                      <div className="absolute -bottom-2 -right-2 bg-black/74 border border-white/34 rounded-lg px-2.5 py-1 text-[10px] font-black text-vouch-emerald font-mono shadow-md">
                        #{activePlayer.number}
                      </div>
                    </div>
                    {/* Bio */}
                    <div className="space-y-2 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <span className="bg-black/52 border border-white/30 text-white/70 px-3 py-0.5 rounded-full text-[10px] font-black font-mono uppercase tracking-widest">
                          {activePlayer.team}
                        </span>
                        <span className="bg-black/52 border border-white/30 text-white/45 px-3 py-0.5 rounded-full text-[10px] font-medium font-mono uppercase">
                          {activePlayer.position}
                        </span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display select-text leading-tight tracking-tight">
                        {activePlayer.name}
                      </h2>
                    </div>
                  </div>

                  {/* Right Side: Batter Score Gauge */}
                  <div className="flex-shrink-0 bg-black/52 p-4 border border-white/30 rounded-2xl text-center flex flex-col items-center justify-center min-w-[130px]" id="primary-model-batter-gauge">
                    <span className="text-[9px] text-white/45 font-mono font-extrabold tracking-widest uppercase block mb-1.5">BATTER SCORE</span>
                    <div className="relative w-16 h-16 flex items-center justify-center">
                      {/* SVG Progress Ring */}
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="32" cy="32" r="28" stroke="rgba(255,255,255,0.15)" strokeWidth="3" fill="transparent" />
                        <circle 
                          cx="32" 
                          cy="32" 
                          r="28" 
                          stroke={activeAiReport ? "#10b981" : activePlayer.batterScore >= 90 ? "#10b981" : "#f59e0b"} 
                          strokeWidth="3.5" 
                          fill="transparent" 
                          strokeDasharray={175}
                          strokeDashoffset={175 - (175 * (activeAiReport?.score || activePlayer.batterScore)) / 100}
                          strokeLinecap="round"
                          className="transition-all duration-1000"
                        />
                      </svg>
                      <span className="absolute text-xl font-mono font-black text-white animate-pulse">
                        {activeAiReport?.score || activePlayer.batterScore}
                      </span>
                    </div>
                    <span className="text-[8.5px] text-white/45 font-mono block mt-2.5 uppercase tracking-wider leading-tight">
                      {activeAiReport ? 'Live Grounded' : 'Metadata Baseline'}
                    </span>
                  </div>

                </div>

                {/* Bottom Section Layout split into two sections: demographics grid & stats blocks */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full" id="hero-bottom-info">
                  
                  {/* Demographics */}
                  <div className="space-y-2">
                    <h4 className="text-[9.5px] text-white/45 font-black font-mono tracking-wider uppercase border-l-2 border-vouch-cyan/40 pl-2">
                      ATHLETE PROFILE INFO
                    </h4>
                    <div className="grid grid-cols-2 gap-3 bg-black/34 border border-white/28 p-4 rounded-2xl text-xs font-mono">
                      <div>
                        <span className="block text-[8.5px] text-white/45 uppercase tracking-wider">Bats / Throws</span>
                        <span className="text-white/70 mt-0.5 font-bold">{activePlayer.bats} / {activePlayer.throws}</span>
                      </div>
                      <div>
                        <span className="block text-[8.5px] text-white/45 uppercase tracking-wider">Height / Weight</span>
                        <span className="text-white/70 mt-0.5 font-bold">{activePlayer.height} / {activePlayer.weight}</span>
                      </div>
                      <div>
                        <span className="block text-[8.5px] text-white/45 uppercase tracking-wider">Birthdate & Age</span>
                        <span className="text-white/70 mt-0.5 font-bold truncate block" title={activePlayer.birthdate}>{activePlayer.birthdate}</span>
                      </div>
                      <div>
                        <span className="block text-[8.5px] text-white/45 uppercase tracking-wider">Injury Status</span>
                        <span className={`inline-flex items-center gap-1 mt-0.5 font-extrabold uppercase text-[9.5px] ${
                          activePlayer.injurySeverity === 'NONE' ? 'text-vouch-emerald' : 'text-amber-400 animate-pulse'
                        }`}>
                          {activePlayer.injurySeverity === 'NONE' ? 'Cleared' : 'Risk Flag'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Seasonal Stats Triple Crown */}
                  <div className="space-y-2">
                    <h4 className="text-[9.5px] text-white/45 font-black font-mono tracking-wider uppercase border-l-2 border-vouch-emerald/50 pl-2">
                      SEASON STAT BASELINE
                    </h4>
                    <div className="grid grid-cols-4 gap-2 text-center h-[calc(100%-20px)] min-h-[74px]">
                      <div className="bg-black/38 border border-white/30 p-2.5 rounded-2xl flex flex-col justify-center">
                        <span className="block text-[8.5px] text-white/45 font-mono tracking-wider">BAT AVG</span>
                        <span className="text-sm font-bold text-white/70 font-mono mt-0.5">{activePlayer.seasonStats.avg}</span>
                      </div>
                      <div className="bg-black/38 border border-white/30 p-2.5 rounded-2xl flex flex-col justify-center">
                        <span className="block text-[8.5px] text-white/45 font-mono tracking-wider">HRs</span>
                        <span className="text-sm font-bold text-white/70 font-mono mt-0.5">{activePlayer.seasonStats.hr}</span>
                      </div>
                      <div className="bg-black/38 border border-white/30 p-2.5 rounded-2xl flex flex-col justify-center">
                        <span className="block text-[8.5px] text-white/45 font-mono tracking-wider">RBIs</span>
                        <span className="text-sm font-bold text-white/70 font-mono mt-0.5">{activePlayer.seasonStats.rbi}</span>
                      </div>
                      <div className="bg-emerald-950/30 border-2 border-vouch-emerald/20 p-2.5 rounded-2xl flex flex-col justify-center">
                        <span className="block text-[8.5px] text-vouch-emerald/80 font-mono tracking-wider">SEAS OPS</span>
                        <span className="text-sm font-black text-vouch-emerald font-mono mt-0.5">{activePlayer.seasonStats.ops}</span>
                      </div>
                    </div>
                  </div>

                </div>

              </div>

              {/* LIVE AI SCUTTING & GROUNDED SCORE CONTROLLER */}
              <div className="bg-black/30 border border-white/28 rounded-3xl p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-vouch-emerald" />
                      Live Grounded AI Matchup Optimizer
                    </h3>
                    <p className="text-white/45 text-xs mt-0.5">
                      Connect metadata and real-time live MLB.com rosters, hot streaks, and pitching lineups.
                    </p>
                  </div>
                  <button
                    onClick={() => runLiveAIResearch(activePlayer)}
                    disabled={isResearching}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black font-mono tracking-wider transition-all flex items-center gap-2 border ${
                      isResearching 
                        ? 'bg-vouch-emerald/10 border-vouch-emerald/50/40 text-vouch-emerald cursor-not-allowed animate-pulse'
                        : 'bg-emerald-500 hover:bg-vouch-emerald text-obsidian-900 border-emerald-400 shadow-lg shadow-vouch-emerald/10 hover:shadow-emerald-400/20'
                    }`}
                  >
                    {isResearching ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>GROUNDING MODEL...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5" />
                        <span>RUN REAL-TIME MLB AI</span>
                      </>
                    )}
                  </button>
                </div>

                {activeAiReport ? (
                  <div className="bg-black/40 border-2 border-vouch-emerald/50/10 p-5 rounded-2xl space-y-4 shadow-inner">
                    <div className="flex items-center justify-between border-b border-white/24 pb-2.5 text-xs text-white/45 font-mono">
                      <span className="flex items-center gap-1.5 text-vouch-emerald">
                        <Check className="w-4 h-4" /> Sabermetric grounding successful
                      </span>
                      <span className="bg-black/42 text-white/70 px-2 py-0.5 rounded border border-white/30">
                        AI SCORE: {activeAiReport.score}
                      </span>
                    </div>
                    
                    {renderMarkdownText(activeAiReport.report)}

                    {activeAiReport.groundingSources && activeAiReport.groundingSources.length > 0 && (
                      <div className="pt-2 border-t border-white/24 flex flex-wrap items-center gap-2">
                        <span className="text-[10px] text-white/45 font-mono uppercase tracking-wider">Search Grounding citations:</span>
                        {activeAiReport.groundingSources.map((source, idx) => (
                          <a 
                            key={idx}
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[9.5px] bg-black/42 border border-white/30 hover:border-vouch-emerald/50 text-white/70 hover:text-vouch-emerald px-2 py-0.5 rounded font-mono transition-colors"
                          >
                            [Verified: {source.title}]
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-black/36 p-4 rounded-2xl border border-white/28 text-center space-y-2">
                    <Activity className="w-6 h-6 text-white/45 mx-auto" />
                    <p className="text-white/45 text-xs font-mono">
                      Query is currently un-analyzed on live search. Click the green button above to fuse MLB.com logs with the active model.
                    </p>
                  </div>
                )}
              </div>
    </>
  );
}
