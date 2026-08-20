import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, ArrowRight, ClipboardList, FileCheck2, Keyboard, RefreshCw, ShieldCheck, Sparkles, Zap, Radio } from 'lucide-react';
import TodayFieldDesk from '../../../components/today/TodayFieldDesk';
import { openParlayAdd } from '../../../lib/parlays/parlayAddContract';
import { toHrParlayPickerPlayer } from '../../hr/utils/hrDecisionBrief';
import type { HrWatchRow } from '../../hr/types/hrWatch';
import { useAppSavedSlips } from '../../../context/AppShellContext';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { useTodayNextHome } from '../hooks/useTodayNextHome';
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
  '1': 'hr_board',
  '2': 'admin_hr_next',
  '3': 'live_games',
  '4': 'research',
  '5': 'live_parlays',
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

  /* Same add-to-slip contract the Today dashboard uses, so a pick made from
     this desk lands in the slip identically. Blocked rows stay unactionable. */
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

  /* Phones get a different composition, not a narrowed one — see
     mobile/TodayMobileShell. Resolved with matchMedia rather than rendering
     both trees behind `md:hidden`, so only one ever mounts and the page never
     paints a desktop layout that then swaps. */
  const isMobile = useMediaQuery('(max-width: 767px)');

  // The 3D toggle is global state now — one canvas in AppShell, one
  // preference shared by every surface and persisted across reloads.
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
      <main className="today-next relative z-10 flex min-h-screen min-w-0 flex-1 items-center justify-center px-4 bg-black">
        <div className="max-w-md space-y-3 border-2 border-rose-500/50 bg-black p-6 text-center font-mono">
          <AlertTriangle className="mx-auto h-6 w-6 text-rose-400" />
          <p className="text-sm font-bold text-white uppercase tracking-wider">Daily brief telemetry unavailable</p>
          <p className="text-[11px] leading-5 text-zinc-400">
            The daily report did not load, so today's command desk cannot be built. Nothing has been estimated in its
            place.
          </p>
          <p className="text-[10px] text-zinc-500">{String((error as Error)?.message ?? error)}</p>
          <button
            type="button"
            onClick={refresh}
            className="mx-auto flex items-center gap-1.5 border border-white bg-white text-black px-4 py-2 text-[10px] font-black uppercase tracking-wider hover:bg-zinc-200 transition-colors cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Retry sensor sync
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="today-next relative z-10 min-h-screen min-w-0 flex-1 overscroll-none bg-black text-white">

      {isMobile ? (
        <TodayMobileShell
          decision={decision}
          reportDateLabel={reportDateLabel}
          firstPitch={firstPitch}
          liveGames={liveGames}
          deskRows={deskRows}
          deskConfirmedRows={deskConfirmedRows}
          deskAllRows={deskAllRows}
          onAddPlayer={addPlayerToSlip}
          onRoute={handleRoute}
        />
      ) : (
        <>
      {/* PINNED CYBERNETIC HUD HEADER */}
      <div className="sticky top-0 z-30 border-b-2 border-white/15 bg-black/95 px-4 py-3.5 backdrop-blur-md sm:px-8 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4 font-mono">
          <div className="flex items-center gap-3">
            <span className="h-2.5 w-2.5 bg-emerald-400 animate-pulse" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-black tracking-widest text-white uppercase">
                  VOUCHEDGE // TODAY'S COMMAND DESK
                </h1>
                <span className="text-zinc-600 hidden sm:inline">|</span>
                <span className="text-cyan-300 text-[10px] font-bold hidden sm:inline">STAGE: 01 / LIVE SLATE</span>
              </div>
              <p className="text-[9px] text-zinc-400 uppercase mt-0.5">
                ENGINE: DETERMINISTIC_LEDGER · {reportDateLabel} · {freshness}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span
              className={`hidden sm:inline-flex items-center gap-1.5 border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${
                isDegraded
                  ? 'border-amber-400/50 bg-amber-950/40 text-amber-300'
                  : 'border-emerald-400/50 bg-emerald-950/40 text-emerald-300'
              }`}
            >
              <ShieldCheck className="h-3 w-3" />
              {isDegraded ? 'DEGRADED SENSORS' : 'SENSORS VERIFIED'}
            </span>

            <button
              type="button"
              onClick={refresh}
              title="Re-sync today's report and board (R)"
              className="flex items-center gap-1.5 border border-white/20 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 hover:border-white hover:text-white transition-colors cursor-pointer"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 text-cyan-300 ${isRefreshing ? 'animate-spin' : ''}`}
              />
              <span className="hidden sm:inline font-bold">SYNC</span>
              <kbd className="hidden sm:inline text-[9px] text-zinc-500">[R]</kbd>
            </button>

            <button
              type="button"
              onClick={() => setCheatsheetOpen(true)}
              title="Keyboard shortcuts (?)"
              className="flex items-center gap-1.5 border border-white/20 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 hover:border-white hover:text-white transition-colors cursor-pointer"
            >
              <Keyboard className="h-3.5 w-3.5 text-emerald-400" />
              <span className="hidden sm:inline font-bold">KEYS</span>
              <kbd className="text-[9px] text-zinc-400 font-bold">[?]</kbd>
            </button>

            <button
              type="button"
              onClick={() => toggle3DLayer()}
              className={`border px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                is3DLayerEnabled
                  ? 'border-emerald-400 bg-emerald-950/50 text-emerald-300'
                  : 'border-white/20 bg-zinc-900 text-zinc-400 hover:text-white'
              }`}
            >
              3D: {is3DLayerEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        <TodayNextVitalsRail vitals={vitals} />
      </div>

      {/* MAIN DESK CANVAS */}
      <div className="mx-auto w-full max-w-[1360px] space-y-6 px-4 py-6 sm:px-8 font-mono">
        
        {/* COMMAND DECISION BRIEF */}
        <TodayNextCommandBrief
          decision={decision}
          firstPitch={firstPitch}
          liveGames={liveGames}
          onRoute={handleRoute}
        />

        {/* 10/10 PHOTO-RICH MLB INTEL WIRE */}
        <TodayNextNewsWire
          slateRows={deskAllRows}
          onOpenPlayer={(row) => handleRoute('research')}
          onAddPlayer={addPlayerToSlip}
        />

        {/* ATTENTION & INTEGRITY ALERTS */}
        <TodayNextAttention decision={decision} onRoute={handleRoute} />

        {/* PRIMARY RESEARCH COMMAND DESK */}
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

        {/* SECONDARY SPLIT: SIGNALS & OPEN SLIPS */}
        <div className="grid gap-6 lg:grid-cols-2 items-start">
          <TodayNextSignalPeek signals={topSignals} totalRows={vitals.hrSignals} onRoute={handleRoute} />

          <div className="space-y-4">
            {/* Resume Task */}
            <section
              className="border-2 border-white/15 bg-black p-5 space-y-3"
              aria-label="Resume where you left off"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">
                  {decision.resumeLabel}
                </span>
                <span className="text-[8px] text-zinc-500 uppercase">ACTIVE SESSION</span>
              </div>
              
              <div>
                <h3 className="text-base font-black text-white font-sans">{decision.resumeTitle}</h3>
                <p className="mt-1 text-xs leading-relaxed text-zinc-400 font-sans">{decision.resumeDetail}</p>
              </div>

              <button
                type="button"
                onClick={() => handleRoute(decision.resumeSection)}
                className="inline-flex items-center gap-2 border border-white bg-white text-black px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                CONTINUE SESSION <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </section>

            {/* Tracked Open Decision Slip */}
            <section className="border-2 border-white/15 bg-black p-5 space-y-3" aria-label="Open slip">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-300">
                  <ClipboardList className="h-3.5 w-3.5 text-cyan-300" />
                  ACTIVE DECISION SLIP
                </h3>
                <button
                  type="button"
                  onClick={() => handleRoute('live_parlays')}
                  className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 hover:text-white transition-colors cursor-pointer"
                >
                  OPEN WORKSPACE →
                </button>
              </div>

              {pendingSlips[0] ? (
                <div className="border border-white/10 bg-zinc-950 p-3.5 space-y-2">
                  <p className="truncate text-sm font-bold text-white">{pendingSlips[0].title || 'Active Tracked Slip'}</p>
                  <p className="text-[10px] text-zinc-400">
                    {pendingSlips[0].legs.length} LEG{pendingSlips[0].legs.length === 1 ? '' : 'S'} ·{' '}
                    {pendingSlips[0].mode === 'REAL' ? 'IMMUTABLE TRACKED' : 'PRACTICE MODE'}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleRoute('live_parlays')}
                    className="flex w-full items-center justify-center gap-1.5 border border-cyan-400 bg-cyan-950/40 py-2 text-[10px] font-bold uppercase tracking-wider text-cyan-300 hover:bg-cyan-900/50 transition-colors cursor-pointer"
                  >
                    INSPECT SLIP <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-white/15 bg-zinc-950/50 p-5 text-center space-y-1">
                  <p className="text-xs font-bold text-zinc-400 uppercase">NO ACTIVE SLIP IN QUEUE</p>
                  <p className="text-[10px] text-zinc-600">
                    Add verified players from the command desk to build a tracked ticket.
                  </p>
                </div>
              )}
            </section>
          </div>
        </div>

        {/* WORKSPACES LAUNCHPAD */}
        <TodayNextLaunchpad vitals={vitals} onRoute={handleRoute} />

        {/* DETERMINISTIC AUDIT RECEIPT FOOTER */}
        <section className="border-2 border-white/15 bg-black p-5 font-mono space-y-3" aria-label="Source receipt">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400">
              <FileCheck2 className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
              SYSTEM VERIFICATION RECEIPT
            </span>
            <span className="text-[8px] text-zinc-500 uppercase">SHA-256 AUDIT LOG</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 text-xs">
            <div>
              <p className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">ACTIVE DATA FEEDS</p>
              <p className="mt-1 text-zinc-300 font-bold">{receipt.sources.join(' · ')}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">INTEGRITY &amp; GAP REPORT</p>
              <p className="mt-1 text-zinc-300">{receipt.missing}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">LAST SENSOR SYNC</p>
              <p className="mt-1 text-emerald-400 font-bold">{receipt.updated}</p>
            </div>
          </div>
        </section>
      </div>
        </>
      )}

      <TodayNextKeyboardCheatsheet isOpen={cheatsheetOpen} onClose={() => setCheatsheetOpen(false)} />
    </main>
  );
}

