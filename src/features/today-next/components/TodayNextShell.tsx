import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  ClipboardList,
  FileCheck2,
  Keyboard,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Zap,
  Radio,
  Timer,
} from 'lucide-react';
import TodayFieldDesk from '../../../components/today/TodayFieldDesk';
import { openParlayAdd } from '../../../lib/parlays/parlayAddContract';
import { toHrParlayPickerPlayer } from '../../hr/utils/hrDecisionBrief';
import type { HrWatchRow } from '../../hr/types/hrWatch';
import { useAppSavedSlips } from '../../../context/AppShellContext';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { formatCountdown, useTodayNextHome } from '../hooks/useTodayNextHome';
import { TodayNextCommandBrief } from './TodayNextCommandBrief';
import { TodayNextAttention } from './TodayNextAttention';
import { TodayNextLaunchpad } from './TodayNextLaunchpad';
import { TodayNextSignalPeek, TodayNextNewsWire } from './TodayNextSignalPeek';
import { TodayNextVitalsRail } from './TodayNextVitalsRail';
import { TodayNextKeyboardCheatsheet } from './TodayNextKeyboardCheatsheet';
import { TodayNextSkeleton } from './TodayNextSkeleton';
import { TodayMobileShell } from './mobile/TodayMobileShell';
import '../today-next.css';
import { useAmbient3dEnabled, useAmbient3dStore } from '@/stores/ambient3dStore';

interface TodayNextShellProps {
  navigateSection?: (section: string) => void;
}

/** Number-key shortcuts, mirroring the Launchpad tiles in order. */
const LAUNCH_KEYS: Record<string, string> = {
  '1': 'news',
  '2': 'hr_board',
  '3': 'nfl_touchdown',
  '4': 'live_games',
  '5': 'research',
  '6': 'results',
};

export function TodayNextShell({ navigateSection }: TodayNextShellProps) {
  const savedSlips = useAppSavedSlips();
  const {
    decision,
    vitals,
    topSignals,
    firstPitch,
    liveGames,
    pendingSlips,
    receipt,
    reportDateLabel,
    freshness,
    isLoading,
    isRefreshing,
    error,
    isDegraded,
    refresh,
    deskRows,
    deskConfirmedRows,
    deskAllRows,
    deskState,
    gameCount,
  } = useTodayNextHome(savedSlips);

  const addPlayerToSlip = useCallback((player: HrWatchRow) => {
    if (player.truthStatus === 'blocked') return;
    openParlayAdd({
      player: toHrParlayPickerPlayer(player),
      propHint: {
        id: `hr-watch-${player.stableId}`,
        market: 'Home Runs',
        odds: player.bookOdds ?? null,
        spec: `${player.playerName} 1+ Home Run`,
        gamePk: player.gamePk ?? undefined,
        playerId: player.playerId ?? undefined,
      },
      initialFamily: 'home_runs',
      isPitcher: false,
      source: 'today',
      dataStatus:
        player.truthStatus === 'official' ? 'official' : player.truthStatus === 'projected' ? 'projected' : 'unknown',
      reasoningSnapshot: player.reasons[0] ?? null,
      riskSnapshot: player.warnings[0] ?? null,
    });
  }, []);

  const [cheatsheetOpen, setCheatsheetOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 767px)');

  const is3DLayerEnabled = useAmbient3dEnabled();
  const toggle3DLayer = useAmbient3dStore((state) => state.toggle);

  const handleRoute = useCallback(
    (section: string) => {
      navigateSection?.(section);
    },
    [navigateSection],
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || target?.isContentEditable) return;

      if (e.key === 'Escape') {
        setCheatsheetOpen(false);
        return;
      }
      if (e.key === '?') {
        e.preventDefault();
        setCheatsheetOpen((prev) => !prev);
        return;
      }
      if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        refresh();
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        handleRoute(decision.ctaSection);
        return;
      }
      const section = LAUNCH_KEYS[e.key];
      if (section) {
        e.preventDefault();
        handleRoute(section);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [decision.ctaSection, handleRoute, refresh]);

  if (isLoading) return <TodayNextSkeleton />;

  if (error) {
    return (
      <div className="today-next relative z-10 flex min-h-screen min-w-0 flex-1 items-center justify-center px-4">
        <div className="max-w-md space-y-3 border-2 border-rose-500/50 bg-[#131B1E] p-6 text-center font-mono shadow-2xl">
          <AlertTriangle className="mx-auto h-6 w-6 text-rose-400" />
          <p className="text-sm font-bold text-white uppercase tracking-wider">DAILY BRIEF TELEMETRY UNAVAILABLE</p>
          <p className="text-xs leading-5 text-zinc-400">
            The daily report did not load, so today's command desk cannot be built. Nothing has been estimated in its
            place.
          </p>
          <p className="text-[10px] text-zinc-500">{String((error as Error)?.message ?? error)}</p>
          <button
            type="button"
            onClick={refresh}
            className="mx-auto flex min-h-[44px] items-center gap-1.5 border border-[#00FF87] bg-[#00FF87] text-[#0A0D0E] px-4 py-2 text-xs font-black uppercase tracking-wider hover:bg-emerald-300 transition-colors cursor-pointer shadow-[2px_2px_0px_0px_#00FF87]"
          >
            <RefreshCw className="h-3.5 w-3.5" /> RETRY SENSOR SYNC
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="today-next relative z-10 min-h-screen min-w-0 flex-1 overscroll-none text-white font-mono">
      {isMobile ? (
        <TodayMobileShell
          decision={decision}
          reportDateLabel={reportDateLabel}
          firstPitch={firstPitch}
          liveGames={liveGames}
          deskRows={deskRows}
          deskConfirmedRows={deskConfirmedRows}
          deskAllRows={deskAllRows}
          gameCount={gameCount}
          onAddPlayer={addPlayerToSlip}
          onRoute={handleRoute}
          onRefresh={refresh}
          isRefreshing={isRefreshing}
          onOpenShortcuts={() => setCheatsheetOpen(true)}
        />
      ) : (
        <>
          {/* PINNED HUD TELEMETRY TOP BAR (DESKTOP) */}
          <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-[#050505]/95 px-4 py-3 backdrop-blur-xl sm:px-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-sm sm:text-base font-bold tracking-wider text-[#F4F4F5] uppercase font-sans">
                      VOUCHEDGE // TODAY'S COMMAND DESK
                    </h1>
                    <span className="text-zinc-600 hidden sm:inline">|</span>
                    <span className="text-emerald-400 text-[10px] font-medium hidden sm:inline font-mono">
                      STAGE: 01 / LIVE SLATE
                    </span>
                  </div>
                  <p className="text-[9px] text-zinc-500 uppercase mt-0.5 font-mono">
                    ENGINE: DETERMINISTIC_LEDGER · {reportDateLabel} · {freshness}
                  </p>
                </div>
              </div>

              {/* Status pills & action triggers */}
              <div className="flex items-center gap-2">
                {/* Countdown to Lock Pill */}
                {firstPitch?.countdownMs != null && liveGames.length === 0 && (
                  <span className="inline-flex items-center gap-1.5 border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-mono font-medium text-emerald-400 rounded-md">
                    <Timer className="h-3 w-3" />
                    LOCK: <strong className="font-mono tabular-nums">{formatCountdown(firstPitch.countdownMs)}</strong>
                  </span>
                )}

                {/* Sensors Verified Pill */}
                <span
                  className={`inline-flex items-center gap-1.5 border px-2.5 py-1 text-[9px] font-mono font-medium uppercase tracking-wider rounded-md ${
                    isDegraded
                      ? 'border-amber-500/25 bg-amber-500/10 text-amber-300'
                      : 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400'
                  }`}
                >
                  <ShieldCheck className="h-3 w-3" />
                  {isDegraded ? 'DEGRADED SENSORS' : 'SENSORS VERIFIED'}
                </span>

                {/* Quick Sync [R] */}
                <button
                  type="button"
                  onClick={refresh}
                  title="Re-sync today's report and board (R)"
                  className="flex items-center gap-1.5 border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-xs text-zinc-300 hover:border-white/[0.16] hover:bg-white/[0.08] hover:text-white rounded-md transition-colors cursor-pointer"
                >
                  <RefreshCw className={`h-3 w-3 text-emerald-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span className="font-medium">SYNC</span>
                  <kbd className="text-[9px] text-zinc-500 font-mono">[R]</kbd>
                </button>

                {/* Keyboard Shortcuts [?] */}
                <button
                  type="button"
                  onClick={() => setCheatsheetOpen(true)}
                  title="Keyboard shortcuts (?)"
                  className="flex items-center gap-1.5 border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-xs text-zinc-300 hover:border-white/[0.16] hover:bg-white/[0.08] hover:text-white rounded-md transition-colors cursor-pointer"
                >
                  <Keyboard className="h-3 w-3 text-sky-400" />
                  <span className="font-medium">KEYS</span>
                  <kbd className="text-[9px] text-zinc-500 font-mono">[?]</kbd>
                </button>

                {/* 3D Toggle */}
                <button
                  type="button"
                  onClick={() => toggle3DLayer()}
                  className={`border px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    is3DLayerEnabled
                      ? 'border-white/20 bg-white/10 text-white'
                      : 'border-white/[0.08] bg-white/[0.04] text-zinc-400 hover:text-white'
                  }`}
                >
                  3D: {is3DLayerEnabled ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
          </header>

          {/* MAIN 12-COLUMN TACTICAL DESK CANVAS */}
          <div className="mx-auto w-full max-w-[1380px] space-y-6 px-4 py-6 sm:px-8">
            {/* 0. SUMMARY VITALS RAIL (APPLE PRO OBSIDIAN CARDS) */}
            <TodayNextVitalsRail vitals={vitals} />

            {/* 1. HERO INTEL CALLOUT */}
            <TodayNextCommandBrief
              decision={decision}
              firstPitch={firstPitch}
              liveGames={liveGames}
              onRoute={handleRoute}
            />

            {/* 2. CURATED MLB TACTICAL INTEL WIRE */}
            <TodayNextNewsWire
              slateRows={deskAllRows}
              onOpenPlayer={(row) => handleRoute('research')}
              onAddPlayer={addPlayerToSlip}
            />

            {/* 3. ATTENTION & INTEGRITY ALERTS */}
            <TodayNextAttention decision={decision} onRoute={handleRoute} />

            {/* 4. PRIMARY RESEARCH COMMAND DESK (SPOTLIGHT DOSSIER & DAILY SLATE QUEUE) */}
            <div className="tn-desk">
              <TodayFieldDesk
                rows={deskRows}
                confirmedRows={deskConfirmedRows}
                freshnessLabel={freshness}
                state={deskState}
                gameCount={gameCount}
                liveGames={liveGames.length}
                onAddPlayer={addPlayerToSlip}
                onResearch={() => handleRoute('hr_board')}
              />
            </div>

            {/* 5. SIGNAL QUICK TABLE & OPEN DECISION SLIP */}
            <div className="grid gap-6 lg:grid-cols-12 items-start">
              {/* Quick Table (7 cols) */}
              <div className="lg:col-span-7">
                <TodayNextSignalPeek
                  signals={topSignals}
                  totalRows={vitals.hrSignals}
                  onRoute={handleRoute}
                  onAddPlayer={addPlayerToSlip}
                  rawRows={deskRows}
                />
              </div>

              {/* Active Slip & Resume Workspace (5 cols) */}
              <div className="space-y-4 lg:col-span-5">
                {/* Resume Task */}
                <section
                  className="border border-white/[0.08] bg-[#111113] p-4 sm:p-5 space-y-3 rounded-xl shadow-lg"
                  aria-label="Resume where you left off"
                >
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                    <span className="text-[9px] font-mono font-medium uppercase tracking-wider text-emerald-400">
                      {decision.resumeLabel}
                    </span>
                    <span className="text-[8px] text-zinc-500 uppercase font-mono">ACTIVE SESSION</span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-[#F4F4F5] font-sans">{decision.resumeTitle}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-zinc-400 font-sans">{decision.resumeDetail}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRoute(decision.resumeSection)}
                    className="inline-flex items-center gap-2 bg-white text-black px-4 py-2 text-xs font-semibold uppercase tracking-wider hover:bg-zinc-200 rounded-lg transition-colors cursor-pointer shadow-sm"
                  >
                    CONTINUE SESSION <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </section>

                {/* Tracked Open Decision Slip */}
                <section className="border border-white/[0.08] bg-[#111113] p-4 sm:p-5 space-y-3 rounded-xl shadow-lg" aria-label="Open slip">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                    <h3 className="flex items-center gap-2 text-xs font-mono font-medium uppercase tracking-wider text-zinc-300">
                      <ClipboardList className="h-3.5 w-3.5 text-sky-400" />
                      ACTIVE DECISION SLIP
                    </h3>
                    <button
                      type="button"
                      onClick={() => handleRoute('live_parlays')}
                      className="text-[10px] font-mono font-medium uppercase tracking-wider text-sky-400 hover:text-sky-300 transition-colors cursor-pointer"
                    >
                      OPEN WORKSPACE →
                    </button>
                  </div>

                  {pendingSlips[0] ? (
                    <div className="border border-white/[0.06] bg-white/[0.02] p-3.5 space-y-2 rounded-lg">
                      <p className="truncate text-sm font-medium text-[#F4F4F5]">
                        {pendingSlips[0].title || 'Active Tracked Slip'}
                      </p>
                      <p className="text-[10px] text-zinc-400 font-mono">
                        {pendingSlips[0].legs.length} LEG{pendingSlips[0].legs.length === 1 ? '' : 'S'} ·{' '}
                        {pendingSlips[0].mode === 'REAL' ? 'IMMUTABLE TRACKED' : 'PRACTICE MODE'}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleRoute('live_parlays')}
                        className="flex w-full items-center justify-center gap-1.5 bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.12] py-2 text-[10px] font-mono font-medium uppercase tracking-wider text-zinc-200 rounded-lg transition-colors cursor-pointer"
                      >
                        INSPECT SLIP <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="border border-dashed border-white/[0.08] bg-white/[0.02] p-5 text-center space-y-1 rounded-lg">
                      <p className="text-xs font-mono font-medium text-zinc-300 uppercase">NO ACTIVE SLIP IN QUEUE</p>
                      <p className="text-[10px] text-zinc-500 font-sans">
                        Add verified bats from the command desk to build a tracked ticket.
                      </p>
                    </div>
                  )}
                </section>
              </div>
            </div>

            {/* 6. WORKSPACES LAUNCHPAD */}
            <TodayNextLaunchpad vitals={vitals} onRoute={handleRoute} />

            {/* 7. DETERMINISTIC AUDIT RECEIPT FOOTER */}
            <section className="border border-white/[0.08] bg-[#111113] p-4 sm:p-5 space-y-3 rounded-xl shadow-lg" aria-label="Source receipt">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                <span className="flex items-center gap-2 text-[10px] font-mono font-medium uppercase tracking-wider text-zinc-400">
                  <FileCheck2 className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                  SYSTEM VERIFICATION RECEIPT
                </span>
                <span className="text-[8px] text-zinc-500 uppercase font-mono">SHA-256 AUDIT LOG</span>
              </div>

              <div className="grid gap-4 sm:grid-cols-3 text-xs font-mono">
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-zinc-500 font-medium font-mono">ACTIVE DATA FEEDS</p>
                  <p className="mt-1 text-zinc-300 font-medium">{receipt.sources.join(' · ')}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-zinc-500 font-medium font-mono">INTEGRITY &amp; GAP REPORT</p>
                  <p className="mt-1 text-zinc-400">{receipt.missing}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-zinc-500 font-medium font-mono">LAST SENSOR SYNC</p>
                  <p className="mt-1 text-emerald-400 font-medium">{receipt.updated}</p>
                </div>
              </div>
            </section>
          </div>
        </>
      )}

      <TodayNextKeyboardCheatsheet isOpen={cheatsheetOpen} onClose={() => setCheatsheetOpen(false)} />
    </div>
  );
}

export default TodayNextShell;
