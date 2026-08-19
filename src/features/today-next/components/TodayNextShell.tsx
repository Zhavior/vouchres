import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, ArrowRight, ClipboardList, FileCheck2, Keyboard, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react';
import { AuroraMaxCommandHeader } from '../../../components/aurora-max/AuroraMaxPrimitives';
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
import { TodayNextSignalPeek } from './TodayNextSignalPeek';
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
      <main className="today-next relative z-10 flex min-h-screen min-w-0 flex-1 items-center justify-center px-4">
        <div className="max-w-md space-y-3 rounded-2xl border border-rose-500/30 bg-ve-obsidian/95 p-6 text-center font-mono">
          <AlertTriangle className="mx-auto h-6 w-6 text-rose-400" />
          <p className="text-sm font-bold text-white">Daily brief unavailable</p>
          <p className="text-[11px] leading-5 text-white/45">
            The daily report did not load, so today's command desk cannot be built. Nothing has been estimated in its
            place.
          </p>
          <p className="text-[10px] text-white/30">{String((error as Error)?.message ?? error)}</p>
          <button
            type="button"
            onClick={refresh}
            className="mx-auto flex items-center gap-1.5 rounded-lg border border-[var(--aurora-max-emerald)]/40 bg-[var(--aurora-max-emerald)]/15 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-[var(--aurora-max-emerald)] transition hover:bg-[var(--aurora-max-emerald)]/30"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Retry sync
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="today-next relative z-10 min-h-screen min-w-0 flex-1 overscroll-none">

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
      <div className="sticky top-0 z-30 space-y-3 border-b border-white/5 bg-ve-obsidian/95 px-4 py-4 backdrop-blur-md sm:px-8">
        <AuroraMaxCommandHeader
          compact
          eyebrow={
            <span className="flex items-center gap-2">
              <Sparkles className="h-3 w-3" aria-hidden="true" /> Aurora Max
            </span>
          }
          title="TodayNext Terminal"
          description={`v1.0 Command · ${reportDateLabel} · ${freshness}`}
          meta={
            <div className="flex items-center gap-2">
              <span
              className={`hidden items-center gap-1.5 rounded border px-2 py-1 font-mono text-[9px] font-black uppercase tracking-wider sm:inline-flex ${
                isDegraded
                  ? 'border-amber-400/30 bg-amber-400/10 text-amber-300'
                  : 'border-[var(--aurora-max-emerald)]/30 bg-[var(--aurora-max-emerald)]/10 text-[var(--aurora-max-emerald)]'
              }`}
            >
              <ShieldCheck className="h-3 w-3" />
              {isDegraded ? 'Degraded sources' : 'Sources verified'}
            </span>

            <button
              type="button"
              onClick={refresh}
              title="Re-sync today's report and board (R)"
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-xs text-white/50 transition-colors hover:bg-white/10 hover:text-white"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 text-[var(--aurora-max-emerald)] ${isRefreshing ? 'animate-spin' : ''}`}
              />
              <span className="hidden sm:inline">Sync</span>
            </button>

            <button
              type="button"
              onClick={() => setCheatsheetOpen(true)}
              title="Keyboard shortcuts (?)"
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-xs text-white/50 transition-colors hover:bg-white/10 hover:text-white"
            >
              <Keyboard className="h-3.5 w-3.5 text-[var(--aurora-max-emerald)]" />
              <span className="hidden sm:inline">Shortcuts</span>
              <kbd className="rounded border border-white/10 bg-black/40 px-1 py-0.2 text-[9px]">?</kbd>
            </button>

            <button
              type="button"
              onClick={() => toggle3DLayer()}
              className={`rounded px-2.5 py-1 font-mono text-xs transition-colors ${
                is3DLayerEnabled
                  ? 'bg-[var(--aurora-max-emerald)]/20 text-[var(--aurora-max-emerald)] hover:bg-[var(--aurora-max-emerald)]/30'
                  : 'bg-white/10 text-white/50 hover:bg-white/20'
              }`}
            >
              3D: {is3DLayerEnabled ? 'ON' : 'OFF'}
            </button>
            </div>
          }
        />

        <TodayNextVitalsRail vitals={vitals} />
      </div>

      <div className="mx-auto w-full max-w-[1240px] space-y-5 px-4 py-5 sm:px-8 sm:py-6">
        <TodayNextCommandBrief
          decision={decision}
          firstPitch={firstPitch}
          liveGames={liveGames}
          onRoute={handleRoute}
        />

        <TodayNextAttention decision={decision} onRoute={handleRoute} />

        {/* Research Command Desk — the full ranked evidence surface, wrapped in
            the desk's glass treatment (see `.tn-desk` in today-next.css). */}
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

        <div className="grid gap-5 lg:grid-cols-2">
          <TodayNextSignalPeek signals={topSignals} totalRows={vitals.hrSignals} onRoute={handleRoute} />

          <div className="space-y-5">
            {/* Resume — the exact work already in progress. */}
            <section
              className="rounded-2xl border border-white/10 bg-ve-obsidian/90 p-4 sm:p-5"
              aria-label="Resume where you left off"
            >
              <span className="font-mono text-[9px] font-black uppercase tracking-[0.18em] text-vouch-emerald">
                {decision.resumeLabel}
              </span>
              <h2 className="mt-1.5 text-base font-black text-white">{decision.resumeTitle}</h2>
              <p className="mt-1 text-[11px] leading-5 text-white/45">{decision.resumeDetail}</p>
              <button
                type="button"
                onClick={() => handleRoute(decision.resumeSection)}
                className="mt-3 inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 font-mono text-[10px] font-black uppercase tracking-wider text-white/75 transition hover:border-white/25 hover:text-white"
              >
                Continue <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </section>

            {/* Open slip */}
            <section className="rounded-2xl border border-white/10 bg-ve-obsidian/90 p-4 sm:p-5" aria-label="Open slip">
              <div className="flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 font-mono text-[10px] font-black uppercase tracking-[0.16em] text-white">
                  <ClipboardList className="h-3.5 w-3.5 text-[var(--aurora-max-emerald)]" />
                  Open slip
                </h2>
                <button
                  type="button"
                  onClick={() => handleRoute('live_parlays')}
                  className="font-mono text-[10px] font-black uppercase tracking-wider text-vouch-emerald transition hover:underline"
                >
                  Workspace
                </button>
              </div>

              {pendingSlips[0] ? (
                <div className="mt-3 rounded-xl border border-white/10 bg-black/30 p-3">
                  <p className="truncate text-sm font-bold text-white">{pendingSlips[0].title || 'Active slip'}</p>
                  <p className="mt-1 font-mono text-[10px] text-white/40">
                    {pendingSlips[0].legs.length} leg{pendingSlips[0].legs.length === 1 ? '' : 's'} ·{' '}
                    {pendingSlips[0].mode === 'REAL' ? 'Tracked' : 'Practice'}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleRoute('live_parlays')}
                    className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-[var(--aurora-max-emerald)]/40 bg-[var(--aurora-max-emerald)]/15 py-2 font-mono text-[10px] font-black uppercase tracking-wider text-[var(--aurora-max-emerald)] transition hover:bg-[var(--aurora-max-emerald)]/30"
                  >
                    Open slip <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="mt-3 rounded-xl border border-dashed border-white/10 bg-black/20 p-4 text-center">
                  <p className="font-mono text-[11px] font-bold text-white/50">No active slip</p>
                  <p className="mt-1 font-mono text-[10px] leading-4 text-white/30">
                    Research a signal and add it to start a tracked decision.
                  </p>
                </div>
              )}
            </section>
          </div>
        </div>

        <TodayNextLaunchpad vitals={vitals} onRoute={handleRoute} />

        {/* Receipt — what built this page, and what was missing. */}
        <section className="rounded-2xl border border-white/[0.07] bg-black/30 p-4" aria-label="Source receipt">
          <span className="flex items-center gap-2 font-mono text-[9px] font-black uppercase tracking-[0.18em] text-white/35">
            <FileCheck2 className="h-3 w-3 text-[var(--aurora-max-emerald)]" aria-hidden="true" />
            Source receipt
          </span>
          <div className="mt-2.5 grid gap-3 font-mono sm:grid-cols-3">
            <div>
              <p className="text-[9px] uppercase tracking-[0.14em] text-white/30">Sources</p>
              <p className="mt-1 text-[10px] leading-4 text-white/50">{receipt.sources.join(' · ')}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-[0.14em] text-white/30">Missing inputs</p>
              <p className="mt-1 text-[10px] leading-4 text-white/50">{receipt.missing}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-[0.14em] text-white/30">Freshness</p>
              <p className="mt-1 text-[10px] leading-4 text-white/50">{receipt.updated}</p>
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
