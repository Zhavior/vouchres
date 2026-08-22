import "../../features/hr-next/hr-next.css";

import React, { useCallback, useState } from 'react';
import { useTouchdownEngine } from '../../features/nfl-touchdown/hooks/useTouchdownEngine';
import { MatchupTicker } from './components/MatchupTicker';
import { SlateAlphaHero } from './components/SlateAlphaHero';
import { TacticalRadar } from './components/TacticalRadar';
import { TacticalPresets } from './components/TacticalPresets';
import { TierBoard } from './components/TierBoard';
import { LiveRedZoneBanner } from './components/LiveRedZoneBanner';
import { MatchupDossierModal } from './components/MatchupDossierModal';
import { TdLedgerView } from './components/TdLedgerView';
import { openParlayAdd } from '../../lib/parlays/parlayAddContract';
import type { TouchdownPlayer } from '../../types/touchdown';
import { TdConnectionPanel } from './components/TdConnectionPanel';

export function TdNextPage() {
  const {
    players,
    allPlayers,
    games,
    filters,
    updateFilter,
    resetFilters,
    applyPreset,
    selectGame,
    slateAlphaPlayer,
    tierPartition,
    boardConnection,
    boardMeta,
    boardError,
    refreshBoard,
    liveThreats,
    selectedPlayerDossier,
    openDossier,
    closeDossier,
    isLoading,
  } = useTouchdownEngine();

  const [activeView, setActiveView] = useState<'BOARD' | 'LEDGER'>('BOARD');

  const handleAddToSlip = useCallback((player: TouchdownPlayer) => {
    const oddsNum = player.marketOdds
      ? player.marketOdds.startsWith('+')
        ? parseInt(player.marketOdds.slice(1), 10)
        : parseInt(player.marketOdds, 10)
      : 100;

    openParlayAdd({
      player: {
        id: player.id,
        name: player.name,
        team: player.team,
        opponent: player.opponent,
        position: player.position,
        image: player.headshotUrl,
      } as any,
      source: 'today',
      dataStatus: player.lineupStatus === 'CONFIRMED' ? 'official' : 'projected',
      reasoningSnapshot:
        player.reasons?.[0] ||
        `TDPI score of ${player.tdpiScore.toFixed(1)} with ${player.rzTouchShare.toFixed(1)}% RZ touch share.`,
      riskSnapshot:
        player.warnings?.[0] ||
        `Opponent red zone defense rank #${player.oppRzDefRank} (${player.oppRzTdPercentAllowed}% TD allowance).`,
      propHint: {
        playerId: player.id,
        playerName: player.name,
        team: player.team,
        opponent: player.opponent,
        market: 'Anytime Touchdown Scorer',
        spec: 'Anytime TD',
        odds: Number.isFinite(oddsNum) ? oddsNum : 100,
        point: 0.5,
      } as any,
    });
  }, []);

  return (
    <div className="hr-next ve-page-shell relative z-10 flex min-h-0 w-full min-w-0 flex-1 bg-black text-white font-mono selection:bg-cyan-500 selection:text-black">
      {/* Left Control Rail (Hidden on Mobile, block on Desktop) */}
      <aside className="ve-hr-control-rail sticky top-0 hidden w-64 shrink-0 space-y-5 self-start overflow-y-auto border-r-2 border-white/15 bg-black p-4 font-mono lg:block h-screen tn-scrollbar-none">
        <TacticalPresets onApplyPreset={applyPreset} onReset={resetFilters} />
        <div className="h-px w-full bg-white/10 my-4" />
        <TacticalRadar
          filters={filters}
          onUpdateFilter={updateFilter}
          onResetFilters={resetFilters}
          filteredCount={players.length}
          totalCount={allPlayers.length}
        />
      </aside>

      <main className="flex min-w-0 flex-1 flex-col h-screen overflow-y-auto ve-scroll-pane scroll-smooth relative">
        <LiveRedZoneBanner threats={liveThreats} onSelectGame={selectGame} />
        
        {/* Sticky Top Header */}
        <div className="sticky top-0 z-30 space-y-3 border-b-2 border-white/15 bg-black/95 px-4 py-3 sm:px-6 font-mono backdrop-blur-xl">
          {games.length > 0 && (
            <MatchupTicker
              games={games}
              selectedGameId={filters.selectedGameId}
              onSelectGame={selectGame}
            />
          )}
          <TdConnectionPanel
            connection={boardConnection}
            board={boardMeta}
            error={boardError}
            onRefresh={() => { void refreshBoard(); }}
          />

          <div className="flex items-center gap-2 pt-2 border-t border-white/10">
            <button
              onClick={() => setActiveView('BOARD')}
              className={`px-4 py-1.5 rounded-none text-xs font-bold uppercase tracking-widest border transition-colors ${
                activeView === 'BOARD'
                  ? 'border-cyan-400 bg-cyan-950/40 text-cyan-300'
                  : 'border-white/10 bg-black text-zinc-500 hover:text-white'
              }`}
            >
              Command Board
            </button>
            <button
              onClick={() => setActiveView('LEDGER')}
              className={`px-4 py-1.5 rounded-none text-xs font-bold uppercase tracking-widest border transition-colors ${
                activeView === 'LEDGER'
                  ? 'border-cyan-400 bg-cyan-950/40 text-cyan-300'
                  : 'border-white/10 bg-black text-zinc-500 hover:text-white'
              }`}
            >
              Ledger
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 min-w-0 w-full p-4 sm:p-6 space-y-6">
          {activeView === 'LEDGER' ? (
            <TdLedgerView players={allPlayers} />
          ) : (
            <>
              {slateAlphaPlayer && !filters.selectedGameId && (
                <SlateAlphaHero
                  player={slateAlphaPlayer}
                  onOpenDossier={openDossier}
                  onAddToSlip={handleAddToSlip}
                />
              )}

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 border border-white/10 bg-[#07080C]/80">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-400/30 border-t-cyan-400 mb-4" />
                  <div className="font-mono text-xs font-bold text-cyan-300">CALIBRATING SLATE TELEMETRY...</div>
                  <div className="font-mono text-[10px] text-zinc-500 mt-2">Computing TDPI values for all active skill players</div>
                </div>
              ) : allPlayers.length > 0 ? (
                <TierBoard
                  tierPartition={tierPartition}
                  onOpenDossier={openDossier}
                  onAddToSlip={handleAddToSlip}
                />
              ) : (
                <div className="border border-white/10 bg-[#07080C]/80 px-6 py-16 text-center font-mono">
                  <div className="text-sm font-black uppercase tracking-widest text-white">No verified touchdown candidates</div>
                  <p className="mx-auto mt-3 max-w-xl text-xs leading-relaxed text-zinc-500">
                    TD Next will populate only after the licensed provider returns a complete, source-backed board. Demo players are intentionally disabled.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {selectedPlayerDossier && (
        <MatchupDossierModal
          player={selectedPlayerDossier}
          onClose={closeDossier}
          onAddToSlip={handleAddToSlip}
        />
      )}
    </div>
  );
}

export default TdNextPage;
