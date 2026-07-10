import React from 'react';

import type { PlayerResearchModel } from '../../hooks/usePlayerResearchConsole';

export default function DossierModeToggle({ model }: { model: PlayerResearchModel }) {
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
              {/* MODE CONTROL TOGGLE PANEL */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-black/42 p-4 rounded-3xl border border-white/32 shadow-md" id="retro-dex-calibrator">
                <div className="min-w-0">
                  <h4 className="text-xs font-black font-mono text-white/70 uppercase tracking-widest flex items-center gap-1.5">
                    <span className="text-yellow-400">👾</span>
                    ATHLETE RESEARCH INTERFACE DECK
                  </h4>
                  <p className="text-[11px] text-white/45 mt-1 leading-snug font-mono">
                    Toggle interactive retro <b className="text-yellow-400">Pokémon Saber-Card Mode</b> or advanced <b className="text-[#10b981]">Pro Sabermetric Dossier</b> view.
                  </p>
                </div>
                <div className="flex bg-ve-obsidian border border-white/10 p-1 rounded-2xl text-[10.5px] font-mono shrink-0 select-none">
                  <button
                    type="button"
                    onClick={() => setDossierMode('POKEMON')}
                    className={`px-4 py-2 font-black rounded-xl transition-all uppercase flex items-center gap-1 leading-none ${
                      dossierMode === 'POKEMON'
                        ? 'bg-yellow-400 text-white/45 font-extrabold shadow-sm'
                        : 'text-white/45 hover:text-white/70'
                    }`}
                  >
                    <span>👾 POKÉDEX VIEW</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDossierMode('SABER')}
                    className={`px-4 py-2 font-black rounded-xl transition-all uppercase flex items-center gap-1 leading-none ${
                      dossierMode === 'SABER'
                        ? 'bg-emerald-500 text-white/45 font-extrabold shadow-sm'
                        : 'text-white/45 hover:text-white/70'
                    }`}
                  >
                    <span>📊 PRO METRICS</span>
                  </button>
                </div>
              </div>
    </>
  );
}
