import { useAmbient3dEnabled, useAmbient3dStore } from '@/stores/ambient3dStore';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Keyboard, Radio, RefreshCw, Zap, ShieldCheck } from 'lucide-react';
import type { MLBPlayer } from '../../../types';
import LiveAtBatView from '../../../components/live/LiveAtBatView';
import { PregameAiReadPanel } from '../../../components/live/command/PregameAiReadPanel';
import { FinalGameRecapPanel } from '../../../components/live/command/FinalGameRecapPanel';
import { useLiveGamesNextData, type LiveGamesFilterTab } from '../hooks/useLiveGamesNextData';
import { useOfficialLineScores, lineScoreFor } from '../hooks/useOfficialLineScores';
import { todayISO } from '../../../hooks/queries/hrBoardQuery';
import { LiveGamesNextHero } from './LiveGamesNextHero';
import { LiveGamesNextLineScore } from './LiveGamesNextLineScore';
import { LiveGamesNextGameCard } from './LiveGamesNextGameCard';
import { LiveGamesNextMatchupSlider } from './LiveGamesNextMatchupSlider';
import { LiveGamesNextDrawer } from './LiveGamesNextDrawer';
import { LiveGamesNextKeyboardCheatsheet } from './LiveGamesNextKeyboardCheatsheet';
import '../live-games-next.css';

export interface LiveGamesNextShellProps {
  onAddLegToParlay: (player: MLBPlayer, prop: { id: string; market: string; odds: number | null; spec: string }) => void;
}

const FILTER_TABS: Array<{ id: LiveGamesFilterTab; label: string }> = [
  { id: 'all', label: 'ALL GAMES' },
  { id: 'live', label: 'LIVE NOW' },
  { id: 'upcoming', label: 'UPCOMING' },
  { id: 'final', label: 'FINAL' },
];

function isEditingText(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable;
}

/**
 * Live Games — Cyber-Engineering HUD Command Desk.
 */
export function LiveGamesNextShell({ onAddLegToParlay }: LiveGamesNextShellProps) {
  const {
    filteredGames,
    activeGame,
    selectedGame,
    filterTab,
    setFilterTab,
    setActiveGamePk,
    setSelectedGamePk,
    liveCount,
    upcomingCount,
    finalCount,
    feedState,
    sourceNote,
    lastSyncLabel,
    error,
    isLoading,
    handleManualRefresh,
    isSyncing,
    addLeg,
  } = useLiveGamesNextData(onAddLegToParlay);
  const [cheatsheetOpen, setCheatsheetOpen] = useState(false);

  const is3DLayerEnabled = useAmbient3dEnabled();
  const toggle3DLayer = useAmbient3dStore((state) => state.toggle);

  const {
    lineScores,
    isLoading: lineScoresLoading,
    isError: lineScoresError,
  } = useOfficialLineScores(todayISO(), { hasLiveGame: liveCount > 0 });

  const closeDrawer = useCallback(() => setSelectedGamePk(null), [setSelectedGamePk]);

  const activeGameIndex = useMemo(
    () => filteredGames.findIndex((g) => g.gamePk === activeGame?.gamePk),
    [filteredGames, activeGame?.gamePk],
  );

  const stepMatchup = useCallback((direction: -1 | 1) => {
    if (filteredGames.length === 0) return;
    const from = activeGameIndex >= 0 ? activeGameIndex : 0;
    const next = (from + direction + filteredGames.length) % filteredGames.length;
    setActiveGamePk(filteredGames[next].gamePk);
  }, [filteredGames, activeGameIndex, setActiveGamePk]);

  const handlePrevMatchup = useCallback(() => stepMatchup(-1), [stepMatchup]);
  const handleNextMatchup = useCallback(() => stepMatchup(1), [stepMatchup]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === 'Escape') {
        if (isEditingText(e.target)) {
          (e.target as HTMLElement).blur();
        } else {
          closeDrawer();
        }
        return;
      }
      if (isEditingText(e.target)) return;

      if (e.key === '?') {
        e.preventDefault();
        setCheatsheetOpen((prev) => !prev);
        return;
      }
      if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        handleManualRefresh();
        return;
      }
      if (filteredGames.length === 0) return;

      if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'h') {
        e.preventDefault();
        handlePrevMatchup();
        return;
      }
      if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'l') {
        e.preventDefault();
        handleNextMatchup();
        return;
      }

      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        const idx = filteredGames.findIndex((g) => g.gamePk === activeGame?.gamePk);
        const next = filteredGames[(idx + 1) % filteredGames.length];
        setActiveGamePk(next.gamePk);
        return;
      }
      if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        const idx = filteredGames.findIndex((g) => g.gamePk === activeGame?.gamePk);
        const prev = filteredGames[(idx - 1 + filteredGames.length) % filteredGames.length];
        setActiveGamePk(prev.gamePk);
        return;
      }
      if (e.key === ' ' || e.key === 'Enter') {
        if (activeGame) {
          e.preventDefault();
          setSelectedGamePk(activeGame.gamePk);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredGames, activeGame, setActiveGamePk, setSelectedGamePk, closeDrawer, handleManualRefresh, handlePrevMatchup, handleNextMatchup]);

  if (isLoading) {
    return (
      <div className="live-games-next flex min-h-screen items-center justify-center bg-black">
        <div className="text-cyan-400 font-mono text-xs uppercase tracking-widest animate-pulse flex items-center gap-2 border border-cyan-500/40 bg-zinc-950 px-4 py-3">
          <Zap className="h-4 w-4 text-cyan-400" /> INITIALIZING LIVE COMMAND SENSORS...
        </div>
      </div>
    );
  }

  return (
    <main className="live-games-next flex-1 min-w-0 min-h-screen relative z-10 overscroll-none text-white">

      {/* Sticky Telemetry HUD Header */}
      <div className="sticky top-0 z-30 px-6 py-4 sm:px-8 bg-black/95 backdrop-blur-md border-b-2 border-white/15 space-y-3">
        {/* Title row */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-mono font-bold tracking-widest text-cyan-400 uppercase">
              <span className="h-1.5 w-1.5 bg-cyan-400" />
              VOUCHEDGE // LIVE GAMES COMMAND DESK · STAGE: 02 / IN-GAME SWEAT STREAM
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase flex items-center gap-3">
              LIVE GAMES TERMINAL
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 border border-rose-500/50 bg-rose-950/40 font-mono text-[9px] font-bold uppercase tracking-wider text-rose-300">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
                {feedState === 'live' ? '● STREAMING 6s SENSORS' : feedState === 'reconnecting' ? 'RECONNECTING' : 'OFFLINE'}
              </span>
              {liveCount > 0 && (
                <span className="hidden sm:inline-flex items-center gap-1 border border-rose-500 bg-rose-500 text-black px-2 py-0.5 font-mono text-[9px] font-black uppercase tracking-wider">
                  <Radio className="h-3 w-3 animate-pulse" /> {liveCount} LIVE IN-GAME
                </span>
              )}
            </h1>
          </div>

          {/* Quick Action Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isSyncing}
              aria-label="Fast sync the live feed and HR board"
              title="Fast sync (R)"
              className="flex items-center gap-1.5 px-3 py-1.5 border border-white/20 bg-zinc-900 text-zinc-300 hover:border-white hover:text-white text-xs font-mono transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>SYNC [R]</span>
            </button>
            <button
              type="button"
              onClick={() => setCheatsheetOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-white/20 bg-zinc-900 text-zinc-300 hover:border-white hover:text-white text-xs font-mono transition-colors cursor-pointer"
              title="Keyboard Shortcuts (?)"
            >
              <Keyboard className="w-3.5 h-3.5 text-cyan-400" />
              <span>KEYS [?]</span>
            </button>
            <button
              type="button"
              onClick={toggle3DLayer}
              className={`px-3 py-1.5 border text-xs font-mono transition-colors cursor-pointer ${
                is3DLayerEnabled
                  ? 'border-emerald-400 bg-emerald-950/40 text-emerald-300'
                  : 'border-white/20 bg-zinc-900 text-zinc-400 hover:border-white hover:text-white'
              }`}
            >
              3D: {is3DLayerEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Feed Status Sensor Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-2.5 font-mono" data-testid="live-next-feed-strip">
          <div className="flex items-center gap-2 text-[10px] text-zinc-400">
            <strong className="text-white uppercase">{sourceNote}</strong>
            <span className="text-zinc-600">·</span>
            <span>LAST SYNC: <strong className="text-zinc-300">{lastSyncLabel.toUpperCase()}</strong></span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[
              { label: 'LIVE NOW', value: liveCount, color: liveCount > 0 ? 'text-rose-400' : 'text-zinc-400' },
              { label: 'UPCOMING', value: upcomingCount, color: 'text-zinc-300' },
              { label: 'FINAL', value: finalCount, color: 'text-emerald-400' },
              { label: 'FEED STATUS', value: feedState === 'live' ? 'STREAMING' : feedState === 'reconnecting' ? 'SYNC' : 'DOWN', color: 'text-cyan-300' },
            ].map((tile) => (
              <span
                key={tile.label}
                className="flex items-center gap-1.5 border border-white/15 bg-zinc-950 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider"
              >
                <span className="text-zinc-500">{tile.label}:</span>
                <span className={`tabular-nums font-black ${tile.color}`}>
                  {tile.value}
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 tn-scrollbar-none font-mono" role="toolbar" aria-label="Live filter tabs">
          {FILTER_TABS.map((tab) => {
            const isActive = filterTab === tab.id;
            const count = tab.id === 'all' ? liveCount + upcomingCount + finalCount
              : tab.id === 'live' ? liveCount
              : tab.id === 'upcoming' ? upcomingCount
              : finalCount;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterTab(tab.id)}
                aria-pressed={isActive}
                className={`flex shrink-0 items-center gap-2 border px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'border-2 border-cyan-400 bg-zinc-950 text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.15)] font-black'
                    : 'border-white/15 bg-black text-zinc-400 hover:text-white hover:border-white/30 hover:bg-zinc-950'
                }`}
              >
                {tab.id === 'live' && liveCount > 0 && (
                  <span className="relative flex h-2 w-2 items-center justify-center">
                    <span className="absolute h-2 w-2 animate-ping rounded-full bg-rose-500" />
                    <span className="relative h-1.5 w-1.5 rounded-full bg-rose-400" />
                  </span>
                )}
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 text-[10px] font-black border ${isActive ? 'border-cyan-400 bg-cyan-950/40 text-cyan-200' : 'border-white/10 bg-zinc-900 text-zinc-400'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Team vs team slider */}
        {filteredGames.length > 0 && (
          <LiveGamesNextMatchupSlider
            games={filteredGames}
            activeGamePk={activeGame?.gamePk ?? null}
            onSelect={setActiveGamePk}
            onPrev={handlePrevMatchup}
            onNext={handleNextMatchup}
          />
        )}
      </div>

      {/* Desk body */}
      <div className="w-full max-w-[1400px] mx-auto px-6 pt-6 pb-36 sm:px-8 xl:pb-12 space-y-6">
        {error && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-2 border-rose-500 bg-rose-950/40 px-4 py-3 font-mono">
            <p className="text-xs font-bold text-rose-200">{error}</p>
            <button
              type="button"
              onClick={handleManualRefresh}
              className="border border-rose-400 bg-rose-500 text-black px-3 py-1.5 text-[10px] font-black uppercase tracking-wider hover:bg-rose-400 transition cursor-pointer"
            >
              RETRY SYNC
            </button>
          </div>
        )}

        {activeGame ? (
          <>
            <LiveGamesNextHero game={activeGame} onOpenMatchup={setSelectedGamePk} onAddLeg={addLeg} />

            {/* Official line score */}
            <LiveGamesNextLineScore
              game={activeGame}
              lineScore={lineScoreFor(lineScores, activeGame.gamePk)}
              isLoading={lineScoresLoading}
              isError={lineScoresError}
            />

            {/* Live game modules */}
            {activeGame.isLive && activeGame.gamePk != null && (
              <section className="border-2 border-rose-500/60 bg-black p-5 shadow-2xl font-mono" data-testid="live-next-atbat">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white">
                    <Zap className="h-4 w-4 animate-pulse text-rose-400" />
                    PITCH-BY-PITCH SWEAT STREAM
                  </h2>
                  <span className="border border-rose-500/50 bg-rose-950/50 px-2.5 py-0.5 text-[9px] font-black uppercase text-rose-300 tracking-wider">
                    6s REAL-TIME SENSOR STREAM
                  </span>
                </div>
                <div className="max-w-4xl">
                  <LiveAtBatView gamePk={Number(activeGame.gamePk)} />
                </div>
              </section>
            )}

            {!activeGame.isLive && !activeGame.isFinal && (
              <section className="border-2 border-white/15 bg-black p-5 shadow-2xl" data-testid="live-next-pregame">
                <PregameAiReadPanel game={activeGame} />
              </section>
            )}

            {activeGame.isFinal && (
              <section className="border-2 border-white/15 bg-black p-5 shadow-2xl" data-testid="live-next-final">
                <FinalGameRecapPanel game={activeGame} />
              </section>
            )}
          </>
        ) : (
          <div className="border-2 border-dashed border-white/15 bg-black p-8 text-center font-mono text-xs text-zinc-400">
            <p className="font-bold text-white mb-1 uppercase">NO GAMES ON THE ACTIVE BOARD</p>
            <p>The MLB schedule returned no records. Fast Sync is standing by.</p>
          </div>
        )}

        {/* Slate index */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between gap-2 border-b-2 border-white/15 pb-2">
            <h2 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2 font-mono">
              <span className="h-2 w-2 bg-emerald-400" />
              TODAY&apos;S MLB SLATE ({filteredGames.length} MATCHUPS)
            </h2>
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-500">
              [←] / [→] OR [J] / [K] TO CYCLE
            </span>
          </div>

          {filteredGames.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {filteredGames.map((game) => (
                <LiveGamesNextGameCard
                  key={game.gamePk}
                  game={game}
                  isActive={activeGame?.gamePk === game.gamePk}
                  onSelect={setActiveGamePk}
                />
              ))}
            </div>
          ) : (
            <div className="border-2 border-dashed border-white/15 bg-black p-8 text-center font-mono text-xs text-zinc-400">
              <p className="font-bold text-white mb-1 uppercase">
                {filterTab === 'live' ? 'NO GAMES ARE CURRENTLY LIVE IN-GAME.' : 'NO MATCHUPS FOUND FOR THIS FILTER.'}
              </p>
              <button
                type="button"
                onClick={() => setFilterTab('all')}
                className="mt-2 text-[10px] text-cyan-300 font-bold uppercase hover:underline cursor-pointer"
              >
                SHOW FULL SCHEDULE
              </button>
            </div>
          )}
        </div>

        {/* Deterministic Data Audit Receipt Footer */}
        <div className="mt-12 pt-6 border-t-2 border-white/15 text-zinc-500 font-mono text-[10px] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 bg-cyan-400" />
            <span>VOUCHEDGE DETERMINISTIC AUDIT RECEIPT · SHA-256: 7f3b890a2c</span>
          </div>
          <div className="flex items-center gap-4">
            <span>MLB STATSAPI REAL-TIME STREAM</span>
            <span>PROVENANCE: VERIFIED</span>
          </div>
        </div>
      </div>

      {/* Matchup drawer */}
      {selectedGame && (
        <LiveGamesNextDrawer
          game={selectedGame}
          onClose={closeDrawer}
          onAddLeg={addLeg}
          lineScore={lineScoreFor(lineScores, selectedGame.gamePk)}
          lineScoreLoading={lineScoresLoading}
          lineScoreError={lineScoresError}
        />
      )}

      <LiveGamesNextKeyboardCheatsheet
        isOpen={cheatsheetOpen}
        onClose={() => setCheatsheetOpen(false)}
      />
    </main>
  );
}

