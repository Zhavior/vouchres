import React from 'react';
import { RefreshCw } from 'lucide-react';
import { MLB_PLAYER_RECORDS } from '../../../data/playerData';
import { Z8_PANEL_PREMIUM } from '../../../theme/z8Tokens';
import type { PlayerResearchModel } from '../../hooks/usePlayerResearchConsole';

export default function ConsoleHeader({ model }: { model: PlayerResearchModel }) {
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
      {/* Header Profile Dashboard */}
      <div id="console-welcome-header" className={`${Z8_PANEL_PREMIUM} flex flex-col xl:flex-row xl:items-center justify-between gap-6 p-6 rounded-3xl`}>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-vouch-emerald/10 text-vouch-emerald border border-vouch-emerald/20 text-[10px] font-black font-mono px-2.5 py-0.5 rounded-full uppercase tracking-widest">
              Live Edge Pro Roster
            </span>
            <span className="flex items-center gap-1.5 text-[10px] text-vouch-cyan font-mono">
              <span className="w-1.5 h-1.5 bg-vouch-cyan rounded-full animate-pulse" /> Sabermetric Grounding Engine v3.5
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mt-2 font-display">
            MLB Roster Research Lab
          </h1>
          <p className="text-white/45 text-xs mt-1.5 max-w-2xl leading-relaxed">
            Extract live edge advantages from custom metrics. Combine authentic Baseball-Reference metadata formulas and real-time live MLB.com search queries inside an interactive, server-side simulated dashboard.
          </p>
        </div>

        {/* Dynamic overall dashboard stats summary */}
        <div className="flex flex-wrap items-center gap-4 bg-black/40 border border-white/30 p-4 rounded-2xl">
          <div className="px-4 border-r border-white/28">
            <span className="block text-[9px] text-white/45 font-mono tracking-wider uppercase">MLB PLAYERS LOADED</span>
            <span className="text-lg font-black text-white/70 font-mono">{displayedPlayers.length} Active</span>
          </div>
          <div className="px-4 border-r border-white/28">
            <span className="block text-[9px] text-white/45 font-mono tracking-wider uppercase">COMPUTATION METHOD</span>
            <span className="text-xs bg-vouch-emerald/10 text-vouch-emerald font-black font-mono px-2.5 py-1 rounded border border-vouch-emerald/20 block mt-0.5 uppercase tracking-wider">
              Gemini Search Grounded
            </span>
          </div>
          <div className="px-2">
            <button
              onClick={() => {
                const randomPlayer = MLB_PLAYER_RECORDS[Math.floor(Math.random() * MLB_PLAYER_RECORDS.length)];
                selectActivePlayer(randomPlayer);
                showToast(`Loaded ${randomPlayer.name} automatically.`);
              }}
              className="text-white bg-black/54 hover:bg-black/72 p-2 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-1.5 border border-white/34"
            >
              <RefreshCw className="w-3.5 h-3.5 text-white/70" /> Randomize
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
