import { useAmbient3dEnabled, useAmbient3dStore } from '@/stores/ambient3dStore';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Keyboard, RefreshCw, ShieldCheck, Zap } from 'lucide-react';
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

/** Feed-state → status pill copy + tone, matching Today's sensor pill. */
function feedPillTone(feedState: string): string {
  if (feedState === 'live') return 'border-ve-emerald/25 bg-ve-emerald/10 text-ve-emerald';
  if (feedState === 'reconnecting') return 'border-ve-cyan/25 bg-ve-cyan/10 text-ve-cyan';
  return 'border-ve-amber/25 bg-ve-amber/10 text-ve-amber';
}

function isEditingText(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable;
}

/**
 * Live Games — Cupertino Pro command desk, sharing the obsidian ramp, hairline
 * borders and desaturated accents used by Today Next and the V4 landing.
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
      <div className="live-games-next flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-2 border border-white/[0.08] bg-white/[0.02] px-4 py-3 font-mono text-[10px] uppercase tracking-[0.24em] text-white/55">
          <Zap className="h-3.5 w-3.5 text-ve-cyan" /> Initializing live sensors
        </div>
      </div>
    );
  }

  return (
    <main className="live-games-next flex-1 min-w-0 min-h-screen relative z-10 overscroll-none text-white font-mono">

      {/* PINNED HUD TELEMETRY TOP BAR */}
      <header className="sticky top-0 z-30 space-y-3 border-b border-white/[0.08] bg-[#050505]/95 px-4 py-3 backdrop-blur-md sm:px-8">
        {/* Title row */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className={liveCount > 0 ? 'lg-live-dot' : 'lg-live-dot lg-live-dot--emerald'} />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.24em] text-white">
                  VOUCHEDGE // LIVE GAMES DESK
                </h1>
                <span className="text-white/30 hidden sm:inline">|</span>
                <span className="hidden sm:inline text-[10px] font-medium text-ve-emerald">
                  STAGE: 02 / IN-GAME STREAM
                </span>
              </div>
              <p className="mt-0.5 text-[9px] uppercase text-white/40">
                ENGINE: MLB_STATSAPI · {liveCount} LIVE · LAST SYNC {lastSyncLabel.toUpperCase()}
              </p>
            </div>
          </div>

          {/* Status pills & action triggers */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 border px-2.5 py-1 text-[9px] font-medium uppercase tracking-wider ${feedPillTone(feedState)}`}
            >
              <ShieldCheck className="h-3 w-3" />
              {feedState === 'live'
                ? 'SENSORS STREAMING · 6s'
                : feedState === 'reconnecting'
                  ? 'RECONNECTING'
                  : 'FEED OFFLINE'}
            </span>

            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isSyncing}
              aria-label="Fast sync the live feed and HR board"
              title="Fast sync (R)"
              className="lg-control flex items-center gap-1.5 px-2.5 py-1 text-xs disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`h-3 w-3 text-ve-emerald ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="font-medium">SYNC</span>
              <kbd className="text-[9px] text-white/40">[R]</kbd>
            </button>

            <button
              type="button"
              onClick={() => setCheatsheetOpen(true)}
              className="lg-control flex items-center gap-1.5 px-2.5 py-1 text-xs cursor-pointer"
              title="Keyboard shortcuts (?)"
            >
              <Keyboard className="h-3 w-3 text-ve-cyan" />
              <span className="font-medium">KEYS</span>
              <kbd className="text-[9px] text-white/40">[?]</kbd>
            </button>

            <button
              type="button"
              onClick={toggle3DLayer}
              className={`border px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                is3DLayerEnabled
                  ? 'border-white/20 bg-white/10 text-white'
                  : 'border-white/[0.08] bg-white/[0.04] text-white/55 hover:text-white'
              }`}
            >
              3D: {is3DLayerEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Feed Status Sensor Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-2.5" data-testid="live-next-feed-strip">
          <div className="flex items-center gap-2 text-[10px] text-white/40">
            <strong className="font-medium uppercase text-white/70">{sourceNote}</strong>
            <span className="text-white/20">·</span>
            <span>LAST SYNC: <strong className="font-medium text-white/70">{lastSyncLabel.toUpperCase()}</strong></span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[
              { label: 'LIVE NOW', value: liveCount, color: liveCount > 0 ? 'text-ve-red' : 'text-white/55' },
              { label: 'UPCOMING', value: upcomingCount, color: 'text-white/70' },
              { label: 'FINAL', value: finalCount, color: 'text-ve-emerald' },
              { label: 'FEED', value: feedState === 'live' ? 'STREAMING' : feedState === 'reconnecting' ? 'SYNC' : 'DOWN', color: 'text-ve-cyan' },
            ].map((tile) => (
              <span
                key={tile.label}
                className="flex items-center gap-1.5 border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[9px] font-medium uppercase tracking-wider"
              >
                <span className="text-white/40">{tile.label}</span>
                <span className={`tabular-nums font-semibold ${tile.color}`}>
                  {tile.value}
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 tn-scrollbar-none" role="toolbar" aria-label="Live filter tabs">
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
                className={`flex shrink-0 items-center gap-2 border px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'border-white/30 bg-white/[0.08] text-white font-semibold'
                    : 'border-white/[0.08] bg-white/[0.02] text-white/55 hover:text-white hover:border-white/[0.16] hover:bg-white/[0.06]'
                }`}
              >
                {tab.id === 'live' && liveCount > 0 && <span className="lg-live-dot" />}
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.5 text-[10px] font-medium tabular-nums border ${isActive ? 'border-white/20 bg-white/10 text-white' : 'border-white/[0.08] bg-white/[0.04] text-white/40'}`}>
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
      </header>

      {/* MAIN TACTICAL DESK CANVAS */}
      <div className="mx-auto w-full max-w-[1380px] space-y-6 px-4 pt-6 pb-36 sm:px-8 xl:pb-12">
        {error && (
          <section
            className="flex flex-wrap items-center justify-between gap-3 border border-ve-amber/25 bg-ve-amber/10 px-4 py-3"
            aria-live="polite"
          >
            <p className="text-xs font-medium text-white/70">{error}</p>
            <button
              type="button"
              onClick={handleManualRefresh}
              className="min-h-9 shrink-0 border border-ve-amber/30 px-3 text-[10px] font-medium uppercase tracking-wider text-ve-amber hover:bg-ve-amber/10 transition-colors cursor-pointer"
            >
              Retry sync
            </button>
          </section>
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
              <section className="border border-ve-red/25 bg-ve-red/[0.04] p-5" data-testid="live-next-atbat">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
                  <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-white">
                    <Zap className="h-3.5 w-3.5 text-ve-red" />
                    Pitch-by-pitch stream
                  </h2>
                  <span className="border border-ve-red/25 bg-ve-red/10 px-2.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-ve-red">
                    6s real-time sensors
                  </span>
                </div>
                <div className="max-w-4xl">
                  <LiveAtBatView gamePk={Number(activeGame.gamePk)} />
                </div>
              </section>
            )}

            {!activeGame.isLive && !activeGame.isFinal && (
              <section data-testid="live-next-pregame">
                <PregameAiReadPanel game={activeGame} />
              </section>
            )}

            {activeGame.isFinal && (
              <section data-testid="live-next-final">
                <FinalGameRecapPanel game={activeGame} />
              </section>
            )}
          </>
        ) : (
          <div className="border border-dashed border-white/[0.12] bg-white/[0.015] p-8 text-center text-xs text-white/55">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white">No games on the board</p>
            <p>The MLB schedule returned no records. Fast sync is standing by.</p>
          </div>
        )}

        {/* Slate index */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.08] pb-2">
            <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-white">
              <span className="h-1.5 w-1.5 bg-ve-emerald" />
              Today&apos;s MLB slate ({filteredGames.length})
            </h2>
            <span className="text-[9px] font-medium uppercase tracking-wider text-white/30">
              [←] / [→] or [J] / [K] to cycle
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
            <div className="border border-dashed border-white/[0.12] bg-white/[0.015] p-8 text-center text-xs text-white/55">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white">
                {filterTab === 'live' ? 'No games are live right now' : 'No matchups for this filter'}
              </p>
              <button
                type="button"
                onClick={() => setFilterTab('all')}
                className="mt-2 text-[10px] font-medium uppercase tracking-wider text-ve-cyan hover:underline cursor-pointer"
              >
                Show full schedule
              </button>
            </div>
          )}
        </div>

        {/* Deterministic Data Audit Receipt Footer */}
        <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.08] pt-6 text-[10px] uppercase tracking-wider text-white/30">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 bg-ve-cyan" />
            <span>VouchEdge deterministic audit receipt</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <span>MLB StatsAPI real-time stream</span>
            <span className="flex items-center gap-1.5 text-ve-emerald">
              <ShieldCheck className="h-3 w-3" /> Provenance verified
            </span>
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

