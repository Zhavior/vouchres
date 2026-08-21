import "../../features/hr-next/hr-next.css";

import React, { useCallback } from 'react';
import { useTouchdownEngine } from '../../features/nfl-touchdown/hooks/useTouchdownEngine';
import { MatchupTicker } from './components/MatchupTicker';
import { TelemetryHUD } from './components/TelemetryHUD';
import { SlateAlphaHero } from './components/SlateAlphaHero';
import { TacticalRadar } from './components/TacticalRadar';
import { TacticalPresets } from './components/TacticalPresets';
import { TierBoard } from './components/TierBoard';
import { LiveRedZoneBanner } from './components/LiveRedZoneBanner';
import { MatchupDossierModal } from './components/MatchupDossierModal';
import { TdLedgerView } from './components/TdLedgerView';
import { openParlayAdd } from '../../lib/parlays/parlayAddContract';
import type { TouchdownPlayer } from '../../types/touchdown';

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
    telemetry,
    liveThreats,
    selectedPlayerDossier,
    openDossier,
    closeDossier,
    isLoading,
  } = useTouchdownEngine();

  const [activeView, setActiveView] = React.useState<'BOARD' | 'LEDGER'>('BOARD');

  // Handle Add to ParlayOS Slip
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
    <main className="hr-next ve-page-shell flex min-h-screen w-full flex-col overflow-x-clip bg-black text-white font-mono selection:bg-cyan-500 selection:text-black">
      {/* 1. Live Threat Alert Marquee Banner */}
      <LiveRedZoneBanner threats={liveThreats} onSelectGame={selectGame} />

      {/* 2. Top Module: Compact Game Matchup Ticker */}
      <MatchupTicker
        games={games}
        selectedGameId={filters.selectedGameId}
        onSelectGame={selectGame}
      />

      {/* 3. Top Module: Telemetry HUD Ribbon */}
      <TelemetryHUD telemetry={telemetry} />

      {/* View Switcher */}
      <div className="mx-auto w-full max-w-[1720px] px-3 sm:px-5 lg:px-6 mt-4 flex items-center gap-2">
        <button
          onClick={() => setActiveView('BOARD')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border transition-colors ${
            activeView === 'BOARD'
              ? 'border-cyan-400 bg-cyan-950/40 text-cyan-300'
              : 'border-white/10 bg-black text-zinc-500 hover:text-white'
          }`}
        >
          TD Board
        </button>
        <button
          onClick={() => setActiveView('LEDGER')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border transition-colors ${
            activeView === 'LEDGER'
              ? 'border-cyan-400 bg-cyan-950/40 text-cyan-300'
              : 'border-white/10 bg-black text-zinc-500 hover:text-white'
          }`}
        >
          Ledger
        </button>
      </div>

      {activeView === 'LEDGER' ? (
        <div className="mx-auto w-full max-w-[1720px] p-3 sm:p-5 lg:p-6 flex flex-col items-start gap-5">
          <TdLedgerView players={allPlayers} />
        </div>
      ) : (
        <div className="mx-auto w-full max-w-[1720px] p-3 sm:p-5 lg:p-6 flex flex-col lg:flex-row items-start gap-5">
          {/* Left Radar Sidebar (w-64) */}
          <div className="flex flex-col w-full lg:w-64 shrink-0">
            <TacticalPresets onApplyPreset={applyPreset} onReset={resetFilters} />
            <TacticalRadar
              filters={filters}
              onUpdateFilter={updateFilter}
              onResetFilters={resetFilters}
              filteredCount={players.length}
              totalCount={allPlayers.length}
            />
          </div>

          {/* Right Main Command Board (flex-1) */}
          <div className="flex-1 min-w-0 w-full space-y-5">
            {/* Top Marquee Dossier (Slate Alpha Hero) */}
            {slateAlphaPlayer && !filters.selectedGameId && (
              <SlateAlphaHero
              player={slateAlphaPlayer}
              onOpenDossier={openDossier}
              onAddToSlip={handleAddToSlip}
            />
          )}

          {/* 4-Tier Conviction Board or Loading State */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-white/10 bg-[#07080C]/80">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-400/30 border-t-cyan-400 mb-4" />
              <div className="font-mono text-xs font-bold text-cyan-300">CALIBRATING SLATE TELEMETRY...</div>
              <div className="font-mono text-[10px] text-zinc-500 mt-2">Computing TDPI values for all active skill players</div>
            </div>
          ) : (
            <TierBoard
              tierPartition={tierPartition}
              onOpenDossier={openDossier}
              onAddToSlip={handleAddToSlip}
            />
          )}
        </div>
      </div>
      )}

      {/* Deep Matchup Intelligence Dossier Modal */}
      {selectedPlayerDossier && (
        <MatchupDossierModal
          player={selectedPlayerDossier}
          onClose={closeDossier}
          onAddToSlip={handleAddToSlip}
        />
      )}
    </main>
  );
}

export default TdNextPage;
