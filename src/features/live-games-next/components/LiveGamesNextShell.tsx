import { useAmbient3dEnabled, useAmbient3dStore } from '@/stores/ambient3dStore';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Keyboard, Radio, RefreshCw, Zap } from 'lucide-react';
import { AuroraMaxCommandHeader } from '../../../components/aurora-max/AuroraMaxPrimitives';
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
  { id: 'all', label: 'All Games' },
  { id: 'live', label: 'Live Now' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'final', label: 'Final' },
];

function isEditingText(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable;
}

/**
 * Live Games — the canonical live desk. The Live Games page's features (official live
 * feed, filter tabs, featured scoreboard, pitch-by-pitch stream, pregame and
 * final reads, matchup drawer, HR signal slips) in HR Next's terminal
 * language: sticky command bar, telemetry chips, mono micro-labels, the
 * ambient particle ground, and a keyboard flow.
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

  // One slate-wide official line score query feeds the hero and the drawer.
  // Cycling the featured game reads the same cache entry — no extra request,
  // no loading flash between games.
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

  // Team-vs-team cycling — wraps in both directions, same as HR Next.
  const stepMatchup = useCallback((direction: -1 | 1) => {
    if (filteredGames.length === 0) return;
    const from = activeGameIndex >= 0 ? activeGameIndex : 0;
    const next = (from + direction + filteredGames.length) % filteredGames.length;
    setActiveGamePk(filteredGames[next].gamePk);
  }, [filteredGames, activeGameIndex, setActiveGamePk]);

  const handlePrevMatchup = useCallback(() => stepMatchup(-1), [stepMatchup]);
  const handleNextMatchup = useCallback(() => stepMatchup(1), [stepMatchup]);

  // Terminal keyboard flow over the slate
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

      // Matchup slider: ← / → (or H / L) cycle team vs team
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
        <div className="text-vouch-emerald font-mono animate-pulse">Loading Live Desk...</div>
      </div>
    );
  }

  const feedPillTheme = feedState === 'live'
    ? 'border-[var(--aurora-max-emerald)]/40 bg-[var(--aurora-max-emerald)]/10 text-[var(--aurora-max-emerald)]'
    : feedState === 'reconnecting'
      ? 'border-amber-400/40 bg-amber-400/10 text-amber-300'
      : 'border-rose-500/40 bg-rose-500/15 text-rose-300';

  return (
    <main className="live-games-next flex-1 min-w-0 min-h-screen relative z-10 overscroll-none">

      <div className="sticky top-0 z-30 px-6 py-4 sm:px-8 bg-ve-obsidian/95 backdrop-blur-md border-b border-white/5 space-y-3">
        {/* Title row */}
        <AuroraMaxCommandHeader
          compact
          eyebrow={
            <span className="flex items-center gap-2">
              <Zap className="h-3 w-3" aria-hidden="true" /> Aurora Max
            </span>
          }
          title={
            <span className="flex flex-wrap items-center gap-2">
              Live Games Terminal
              <span className={`hidden md:inline-flex items-center gap-1.5 rounded border px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider ${feedPillTheme}`}>
                <Radio className={`h-2.5 w-2.5 ${feedState === 'live' && !isSyncing ? 'animate-pulse' : ''}`} />
                {feedState === 'live' ? 'Streaming' : feedState === 'reconnecting' ? 'Reconnecting' : 'Offline'}
              </span>
              {liveCount > 0 && (
                <span className="hidden md:inline-flex items-center gap-1 rounded border border-rose-500/40 bg-rose-500/15 px-2 py-0.5 font-mono text-[9px] font-black uppercase text-rose-300 animate-pulse">
                  <Radio className="h-2.5 w-2.5" /> {liveCount} Live
                </span>
              )}
            </span>
          }
          description="Live desk v1 · official feed, in-game context"
          meta={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isSyncing}
              aria-label="Fast sync the live feed and HR board"
              title="Fast sync (R)"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 text-xs font-mono transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[var(--aurora-max-emerald)] ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Fast Sync</span>
            </button>
            <button
              type="button"
              onClick={() => setCheatsheetOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 text-xs font-mono transition-colors"
              title="Keyboard Shortcuts (?)"
            >
              <Keyboard className="w-3.5 h-3.5 text-[var(--aurora-max-emerald)]" />
              <span className="hidden sm:inline">Shortcuts</span>
              <kbd className="text-[9px] bg-black/40 px-1 py-0.2 rounded border border-white/10">?</kbd>
            </button>
          </div>
          }
        />

        {/* Feed status strip */}
        <div className="flex flex-wrap items-center gap-2 font-mono" data-testid="live-next-feed-strip">
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
            {sourceNote}
          </span>
          <span className="text-[10px] text-white/30">·</span>
          <span className="text-[10px] text-white/50">Synced {lastSyncLabel}</span>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {[
              { label: 'Live', value: liveCount, live: true },
              { label: 'Upcoming', value: upcomingCount, live: false },
              { label: 'Final', value: finalCount, live: false },
              { label: 'Feed', value: feedState === 'live' ? 'On' : feedState === 'reconnecting' ? 'Sync' : 'Down', live: false },
            ].map((tile) => (
              <span
                key={tile.label}
                className="flex items-center gap-1.5 rounded-lg border border-white/5 bg-black/40 px-2 py-1 text-[9px] font-bold uppercase tracking-wider"
              >
                <span className="text-white/40">{tile.label}</span>
                <span className={`tabular-nums ${tile.live && liveCount > 0 ? 'text-ve-live drop-shadow-[0_0_8px_rgba(240,83,107,0.45)]' : 'text-white'}`}>
                  {tile.value}
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none font-mono" role="toolbar" aria-label="Live filter tabs">
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
                className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-[var(--aurora-max-emerald)]/20 text-[var(--aurora-max-emerald)] border-[var(--aurora-max-emerald)]/50 shadow-[0_0_12px_rgba(0,217,160,0.2)]'
                    : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20'
                }`}
              >
                {tab.id === 'live' && liveCount > 0 && (
                  <span className="relative flex h-2 w-2 items-center justify-center">
                    <span className="absolute h-2 w-2 animate-ping rounded-full bg-rose-500" />
                    <span className="relative h-1.5 w-1.5 rounded-full bg-rose-400" />
                  </span>
                )}
                <span>{tab.label}</span>
                <span className={`rounded-md px-1.5 py-0.2 text-[10px] font-black ${isActive ? 'bg-[var(--aurora-max-emerald)]/30 text-white' : 'bg-white/5 text-white/40'}`}>
                  {count}
                </span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={toggle3DLayer}
            className={`ml-auto shrink-0 rounded px-3 py-1 text-xs font-mono transition-colors ${
              is3DLayerEnabled
                ? 'bg-[var(--aurora-max-emerald)]/20 text-[var(--aurora-max-emerald)] hover:bg-[var(--aurora-max-emerald)]/30'
                : 'bg-white/10 text-white/50 hover:bg-white/20'
            }`}
          >
            3D Layer: {is3DLayerEnabled ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Team vs team slider — ← / → cycle the featured matchup */}
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

      {/* Desk body — pb-36 clears the fixed bottom nav + slip dock */}
      <div className="w-full max-w-[1400px] mx-auto px-6 pt-6 pb-36 sm:px-8 xl:pb-12">
        {error && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 font-mono">
            <p className="text-xs font-bold text-rose-200">{error}</p>
            <button
              type="button"
              onClick={handleManualRefresh}
              className="rounded-lg border border-rose-400/40 bg-rose-500/20 px-3 py-1.5 text-[10px] font-black uppercase text-rose-200 transition hover:bg-rose-500/30"
            >
              Try Again
            </button>
          </div>
        )}

        {activeGame ? (
          <>
            <LiveGamesNextHero game={activeGame} onOpenMatchup={setSelectedGamePk} onAddLeg={addLeg} />

            {/* Official line score — real per-inning runs from the MLB feed */}
            <div className="mt-4">
              <LiveGamesNextLineScore
                game={activeGame}
                lineScore={lineScoreFor(lineScores, activeGame.gamePk)}
                isLoading={lineScoresLoading}
                isError={lineScoresError}
              />
            </div>

            {/* Live game modules — mutually exclusive by game state */}
            {activeGame.isLive && activeGame.gamePk != null && (
              <section className="mt-4 rounded-2xl border border-white/10 bg-ve-obsidian/95 p-4 shadow-xl" data-testid="live-next-atbat">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white font-mono">
                    <Zap className="h-3.5 w-3.5 animate-pulse text-rose-400" />
                    Pitch-by-Pitch Sweat Stream
                  </h2>
                  <span className="rounded border border-rose-500/40 bg-rose-500/15 px-2 py-0.5 font-mono text-[9px] font-black uppercase text-rose-300">
                    6s Real-Time Sensor Stream
                  </span>
                </div>
                <div className="max-w-4xl">
                  <LiveAtBatView gamePk={Number(activeGame.gamePk)} />
                </div>
              </section>
            )}

            {!activeGame.isLive && !activeGame.isFinal && (
              <section className="mt-4" data-testid="live-next-pregame">
                <PregameAiReadPanel game={activeGame} />
              </section>
            )}

            {activeGame.isFinal && (
              <section className="mt-4" data-testid="live-next-final">
                <FinalGameRecapPanel game={activeGame} />
              </section>
            )}
          </>
        ) : (
          <div className="rounded-2xl border border-white/5 bg-ve-obsidian/50 p-6 text-center font-mono text-xs text-white/40 border-dashed">
            <p className="font-bold text-white/60 mb-1">No games on the board</p>
            <p>The MLB schedule returned no records. The live feed remains available for fast sync.</p>
          </div>
        )}

        {/* Slate index */}
        <div className="mt-6 mb-3 flex items-center justify-between gap-2 border-b border-white/10 pb-1.5">
          <h2 className="text-xs font-black uppercase tracking-widest text-[var(--aurora-max-emerald)] flex items-center gap-2 font-mono">
            <span className="h-2 w-2 rounded-full bg-[var(--aurora-max-emerald)] shadow-[0_0_8px_rgba(0,217,160,0.8)]" />
            📡 Today&apos;s Slate ({filteredGames.length})
          </h2>
          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-white/40">
            ← / → or J / K to cycle
          </span>
        </div>

        {filteredGames.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
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
          <div className="rounded-2xl border border-white/5 bg-ve-obsidian/50 p-6 text-center font-mono text-xs text-white/40 border-dashed">
            <p className="font-bold text-white/60 mb-1">
              {filterTab === 'live' ? 'No games are live right now.' : 'No games found for this filter.'}
            </p>
            <button
              type="button"
              onClick={() => setFilterTab('all')}
              className="mt-2 text-[10px] text-vouch-emerald hover:underline"
            >
              Show today&apos;s schedule
            </button>
          </div>
        )}
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
