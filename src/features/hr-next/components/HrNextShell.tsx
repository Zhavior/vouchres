import { Sparkles, Keyboard, Trophy, SlidersHorizontal } from 'lucide-react';
import { useReducer, useCallback, useState, useRef, useMemo, useEffect } from 'react';
import { AuroraMaxCommandHeader } from '../../../components/aurora-max/AuroraMaxPrimitives';
import { useHrNextData, type HrNextItem } from '../hooks/useHrNextData';
import { HrNextBoard } from './HrNextBoard';
import { openParlayAdd } from '../../../lib/parlays/parlayAddContract';
import { toHrParlayPickerPlayer } from '../../hr/utils/hrDecisionBrief';
import { extractCardData } from '../utils/cardUtils';
import { HrNextSortMenu } from './HrNextSortMenu';
import { HrNextResearchView } from './HrNextResearchView';
import { HrNextControlRail } from './HrNextControlRail';
import { HrNextKeyboardCheatsheet } from './HrNextKeyboardCheatsheet';
import { HrNextMatchupSlider, type HrNextMatchupItem } from './HrNextMatchupSlider';
import { HrNextTelemetryBar } from './HrNextTelemetryBar';
import { HrNextSpotlight } from './HrNextSpotlight';
import { HrNextTeamRankView } from './HrNextTeamRankView';
import { HrNextProjectionMatrix } from './HrNextProjectionMatrix';
import { buildSlateTelemetry } from '../utils/slateTelemetry';
import { buildTeamRankings, matchupKeyFor } from '../utils/teamRanking';
import { useHrNextKeybindings } from '../hooks/useHrNextKeybindings';
import { useResearchStore } from '../../../stores/useResearchStore';
import '../hr-next.css';
import { useAmbient3dEnabled, useAmbient3dStore } from '@/stores/ambient3dStore';

/** The four board views, unified into one segmented control. */
type HrNextViewMode = 'tier' | 'matchup' | 'none' | 'matrix';

const VIEW_MODES: ReadonlyArray<{ key: HrNextViewMode; label: string }> = [
  { key: 'tier', label: 'By Tier' },
  { key: 'matchup', label: 'By Game' },
  { key: 'none', label: 'Flat Sort' },
  { key: 'matrix', label: 'Matrix' },
];

type SavedAction = { type: 'toggle'; id: string };
function savedReducer(state: Record<string, true>, action: SavedAction): Record<string, true> {
  if (state[action.id]) {
    const { [action.id]: _, ...rest } = state;
    return rest;
  }
  return { ...state, [action.id]: true };
}

export function HrNextShell() {
  const {
    items, rawRows, isLoading, error,
    sortKey, setSortKey,
    groupBy, setGroupBy,
    searchQuery, setSearchQuery,
    filterTag, setFilterTag, filterCounts,
    mode, setMode,
    date, setDate, isToday, syncing, refetch
  } = useHrNextData();
  const [savedMap, dispatchSaved] = useReducer(savedReducer, {});
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  // The 3D toggle is global state now — one canvas in AppShell, one
  // preference shared by every surface and persisted across reloads.
  const is3DLayerEnabled = useAmbient3dEnabled();
  const toggle3DLayer = useAmbient3dStore((state) => state.toggle);
  const [isProMode, setIsProMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hr_next_pro_mode');
      return saved !== null ? saved === 'true' : true; // Default Pro Mode ON
    }
    return true;
  });
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [cheatsheetOpen, setCheatsheetOpen] = useState(false);
  const [selectedMatchupIndex, setSelectedMatchupIndex] = useState<number>(-1);
  const [isTeamRankOpen, setIsTeamRankOpen] = useState(false);
  // The Matrix is a segment of the view control, so it opens only when the
  // reader picks it — landing on Flat Sort now means Flat Sort.
  const [isMatrixOpen, setIsMatrixOpen] = useState(false);
  // Below lg there is no room for a 16rem column, so the same control rail
  // renders as a disclosure sheet above the board.
  const [mobileControlsOpen, setMobileControlsOpen] = useState(false);
  // Statcast resolution is a query-level choice, so the rail owns it and the
  // matrix renders it. Lifting it also keeps the setting when the reader
  // switches views and comes back.
  const [statcastResolved, setStatcastResolved] = useState(false);
  const toggleStatcast = useCallback(() => setStatcastResolved((prev) => !prev), []);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const topResearchRef = useRef<HTMLDivElement>(null);
  // The toolbar above is itself sticky, and it grows and shrinks — the matchup
  // slider appears under "By Game", the Rank Teams control under one grouping.
  // The dock has to park below whatever height it currently is, so it is
  // measured rather than guessed; a hard-coded offset buries the dock's own
  // header — headshot, name and close button — behind the toolbar the moment a
  // row is added to it.
  const [toolbarHeight, setToolbarHeight] = useState(112);
  const toolbarNodeRef = useRef<HTMLDivElement | null>(null);

  const measureToolbar = useCallback(() => {
    const node = toolbarNodeRef.current;
    if (!node) return;
    const next = node.getBoundingClientRect().height;
    setToolbarHeight((prev) => (Math.abs(prev - next) < 0.5 ? prev : next));
  }, []);

  // A callback ref rather than useRef + effect: this component returns a loading
  // and an error state before the toolbar exists, so an effect keyed on mount
  // attaches to nothing and never runs again.
  const toolbarRef = useCallback(
    (node: HTMLDivElement | null) => {
      toolbarNodeRef.current = node;
      if (node) measureToolbar();
    },
    [measureToolbar],
  );

  // Re-measured from the state that changes the toolbar's own contents rather
  // than from a ResizeObserver alone — the observer does not deliver entries
  // inside this app's route frame, the same caveat the Projection Matrix
  // carries about its own plot. The toolbar settles in stages (the matchup
  // slider mounts, then its team logos load and push the row taller), so one
  // frame is not enough: measure on the next frame, again once layout has
  // settled, and on every viewport resize. An observer is attached too, so the
  // measurement stays live wherever the platform does deliver it.
  useEffect(() => {
    const frame = requestAnimationFrame(measureToolbar);
    const settle = window.setTimeout(measureToolbar, 350);
    window.addEventListener('resize', measureToolbar);

    const node = toolbarNodeRef.current;
    const observer =
      node && typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measureToolbar) : null;
    observer?.observe(node!);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(settle);
      window.removeEventListener('resize', measureToolbar);
      observer?.disconnect();
    };
  }, [
    measureToolbar,
    groupBy,
    filterTag,
    isTeamRankOpen,
    isMatrixOpen,
    exportStatus,
    isProMode,
    // The matchup slider only appears once the slate has rows to build it from.
    rawRows.length,
    isLoading,
  ]);

  /** Sticky offset and height budget for the research dock. */
  const dockFrame = useMemo(
    () => ({
      top: `${Math.round(toolbarHeight) + 16}px`,
      maxHeight: `calc(100vh - ${Math.round(toolbarHeight) + 32}px)`,
    }),
    [toolbarHeight],
  );

  const toggleProMode = useCallback(() => {
    setIsProMode((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('hr_next_pro_mode', String(next));
      }
      return next;
    });
  }, []);

  const selectedPlayer = useResearchStore((s) => s.selectedPlayer);
  const isDrawerOpen = useResearchStore((s) => s.isDrawerOpen);
  const openDrawer = useResearchStore((s) => s.openDrawer);
  const closeDrawer = useResearchStore((s) => s.closeDrawer);

  // Auto-scroll up to the research square on phone / mobile (<2xl) screens when opened
  useEffect(() => {
    if (isDrawerOpen && selectedPlayer) {
      if (typeof window !== 'undefined' && window.innerWidth < 1536) {
        const timer = setTimeout(() => {
          if (topResearchRef.current) {
            topResearchRef.current.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
            });
          } else {
            window.scrollTo({ top: 100, behavior: 'smooth' });
          }
        }, 50);
        return () => clearTimeout(timer);
      }
    }
  }, [isDrawerOpen, selectedPlayer?.id]);

  const toggleSaved = useCallback((id: string) => {
    dispatchSaved({ type: 'toggle', id });
  }, []);

  const handleAddToSlip = useCallback((row: any) => {
    openParlayAdd({
      player: toHrParlayPickerPlayer(row),
      source: 'hr_intelligence',
      dataStatus: row.truthStatus === 'official' ? 'official' : row.truthStatus === 'projected' ? 'projected' : 'unknown',
      reasoningSnapshot: row.reasons[0]?.trim() || 'No model rationale was supplied for this signal.',
      riskSnapshot: row.warnings[0]?.trim() || 'No specific risk note was supplied. Verify the lineup and market before adding.',
    });
  }, []);

  const handleToggleResearch = useCallback((player: { id: string | number; name: string }) => {
    if (isDrawerOpen && String(selectedPlayer?.id) === String(player.id)) {
      closeDrawer();
    } else {
      openDrawer(player);
    }
  }, [isDrawerOpen, selectedPlayer?.id, closeDrawer, openDrawer]);

  // Slate-level telemetry for the header bar and the Slate Alpha spotlight.
  const telemetry = useMemo(() => buildSlateTelemetry(rawRows), [rawRows]);

  // Extract live slate matchups for the Matchup Slider
  const availableMatchups = useMemo<HrNextMatchupItem[]>(() => {
    const map = new Map<string, HrNextMatchupItem>();
    const rowItems = items.filter((item): item is Extract<HrNextItem, { type: 'row' }> => item.type === 'row');
    
    for (const item of rowItems) {
      const row = item.row;
      const team1 = [row.team, row.opponent].sort()[0];
      const team2 = [row.team, row.opponent].sort()[1];
      const key = `${team1}_vs_${team2}`;
      
      if (!map.has(key)) {
        const isAway = row.venue && !row.venue.toLowerCase().includes(row.team.toLowerCase());
        const awayTeam = isAway ? row.team : row.opponent;
        const homeTeam = isAway ? row.opponent : row.team;

        map.set(key, {
          id: key,
          awayTeam: awayTeam || row.team,
          homeTeam: homeTeam || row.opponent,
          gameTime: row.gameTime,
          count: 0,
        });
      }
      map.get(key)!.count += 1;
    }
    return Array.from(map.values());
  }, [items]);

  // Analytic-panel scope: one game when the By Game slider has a selection, the
  // whole filtered pool otherwise. Shared by Rank Teams and the Projection
  // Matrix, and skipped entirely while both panels are closed.
  const isTeamRankActive = groupBy === 'matchup' && isTeamRankOpen;
  // The matrix belongs to Flat Sort alone. Under By Tier and By Game the board
  // is already partitioned, and a scatter of the whole pool contradicts the
  // grouping on screen — so the control is not offered there and the panel
  // cannot stay open through a grouping change.
  const isMatrixAvailable = groupBy === 'none';
  const isMatrixActive = isMatrixAvailable && isMatrixOpen;

  // One segmented control owns the four board views. Matrix is a view rather
  // than a toggle bolted onto Flat Sort: picking it flattens the board and
  // plots it, and closing the panel drops back to Flat Sort.
  const viewMode: HrNextViewMode = isMatrixActive ? 'matrix' : groupBy;
  const selectView = useCallback(
    (next: HrNextViewMode) => {
      if (next === 'matchup') {
        setGroupBy('matchup');
        setIsMatrixOpen(false);
        return;
      }
      setGroupBy(next === 'matrix' ? 'none' : next);
      setSelectedMatchupIndex(-1);
      setIsTeamRankOpen(false);
      setIsMatrixOpen(next === 'matrix');
    },
    [setGroupBy],
  );

  const analyticsScope = useMemo(() => {
    if (!isTeamRankActive && !isMatrixActive) return { rows: [] as typeof rawRows, label: '' };
    const selected = groupBy === 'matchup'
      && selectedMatchupIndex >= 0
      && selectedMatchupIndex < availableMatchups.length
      ? availableMatchups[selectedMatchupIndex]
      : null;
    if (!selected) {
      return {
        rows: rawRows,
        label: `Full slate · ${availableMatchups.length} game${availableMatchups.length === 1 ? '' : 's'}`,
      };
    }
    return {
      rows: rawRows.filter((row) => matchupKeyFor(row) === selected.id),
      label: `${selected.awayTeam} @ ${selected.homeTeam}`,
    };
  }, [isTeamRankActive, isMatrixActive, groupBy, rawRows, availableMatchups, selectedMatchupIndex]);

  const teamRankings = useMemo(
    () => buildTeamRankings(isTeamRankActive ? analyticsScope.rows : []),
    [isTeamRankActive, analyticsScope.rows],
  );

  const handlePrevMatchup = useCallback(() => {
    if (availableMatchups.length === 0) return;
    setSelectedMatchupIndex((prev) => {
      if (prev <= -1) return availableMatchups.length - 1;
      if (prev === 0) return -1;
      return prev - 1;
    });
  }, [availableMatchups.length]);

  const handleNextMatchup = useCallback(() => {
    if (availableMatchups.length === 0) return;
    setSelectedMatchupIndex((prev) => {
      if (prev >= availableMatchups.length - 1) return -1;
      return prev + 1;
    });
  }, [availableMatchups.length]);

  // Wire up Bloomberg / Vim-style keyboard shortcuts
  useHrNextKeybindings({
    items,
    focusedId,
    setFocusedId,
    onToggleResearch: handleToggleResearch,
    onAddToSlip: handleAddToSlip,
    onToggleSaved: toggleSaved,
    isDrawerOpen,
    onCloseDrawer: closeDrawer,
    searchInputRef,
    onToggleCheatsheet: () => setCheatsheetOpen(prev => !prev),
    onPrevMatchup: handlePrevMatchup,
    onNextMatchup: handleNextMatchup,
    onToggleProMode: toggleProMode,
    isMatchupMode: groupBy === 'matchup',
  });

  const handleExport = useCallback((format: 'json' | 'csv' = 'json') => {
    const savedKeys = Object.keys(savedMap);
    const targetItems = savedKeys.length > 0 
      ? items.filter(item => item.type === 'row' && savedMap[item.row.stableId])
      : items.filter(item => item.type === 'row');

    const payload = targetItems.map((item: any) => {
      const row = item.row;
      const data = extractCardData(row);
      return {
        player: row.playerName,
        team: row.team,
        matchup: data.matchupLabel,
        hrpi: data.score,
        lineup: data.lineupLabel,
        odds: data.bookOddsLabel,
        evEdge: data.evEdge,
        signal: data.catalyst,
        read: row.reasons[0]?.trim(),
        evidence: data.pips.map((p) => ({ label: p.label, tone: p.tone })),
        receipt: data.receipt,
      };
    });

    // CSV flattens the same payload; the evidence pips and the receipt object
    // are dropped rather than stringified into a cell that no spreadsheet can
    // read back.
    const toCsv = (rows: Record<string, unknown>[]) => {
      const columns = ['player', 'team', 'matchup', 'hrpi', 'lineup', 'odds', 'evEdge', 'signal', 'read'];
      const escape = (value: unknown) => {
        const text = value == null ? '' : String(value);
        return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
      };
      return [
        columns.join(','),
        ...rows.map((row) => columns.map((column) => escape(row[column])).join(',')),
      ].join('\n');
    };

    const isCsv = format === 'csv';
    const blob = isCsv
      ? new Blob([toCsv(payload as unknown as Record<string, unknown>[])], { type: 'text/csv' })
      : new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hr-next-receipts.${isCsv ? 'csv' : 'json'}`;
    link.click();
    URL.revokeObjectURL(url);

    setExportStatus(`${targetItems.length} receipt${targetItems.length === 1 ? '' : 's'} prepared`);
    window.setTimeout(() => setExportStatus(null), 2200);
  }, [savedMap, items]);

  if (isLoading) {
    return (
      <div className="hr-next flex min-h-screen items-center justify-center bg-black">
        <div className="text-vouch-emerald font-mono animate-pulse">Loading HR Intelligence...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="hr-next flex min-h-screen items-center justify-center bg-black">
        <div className="text-red-500 font-mono text-center">
          <p>Failed to load HR board</p>
          <p className="text-sm opacity-70">{String(error)}</p>
        </div>
      </div>
    );
  }

  const controlRailProps = {
    searchQuery,
    onSearchChange: setSearchQuery,
    searchInputRef,
    date,
    onDateChange: setDate,
    isToday,
    syncing,
    onRefresh: refetch,
    viewModes: VIEW_MODES,
    viewMode,
    onViewModeChange: selectView,
    lineupMode: mode,
    onLineupModeChange: setMode,
    filterTag,
    onFilterTagChange: setFilterTag,
    filterCounts,
    statcastResolved,
    onToggleStatcast: toggleStatcast,
    onExport: handleExport,
    exportStatus,
    savedCount: Object.keys(savedMap).length,
  } as const;

  return (
    <div className="hr-next relative z-10 flex min-h-0 w-full min-w-0 flex-1">

      {/* Query controls own the left column now that the app routes moved to the
          global top bar. Below lg the same component renders as a sheet above
          the board. */}
      <HrNextControlRail {...controlRailProps} />

      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">

      {/* Translucent rather than solid, so the ambient field reads through the
          chrome. No `backdrop-blur` on this one: it is sticky over a long
          scrolling list, and a backdrop-filter here re-composites the whole
          board every scroll frame. Alpha alone gets the particles through at no
          scroll cost. */}
      <div
        ref={toolbarRef}
        className="sticky top-0 z-30 space-y-3 border-b border-white/5 bg-[#060a0a]/85 px-4 py-3 sm:px-6"
      >
        <AuroraMaxCommandHeader
          compact
          eyebrow={
            <span className="flex items-center gap-2">
              <Sparkles className="h-3 w-3" aria-hidden="true" /> Aurora Max
            </span>
          }
          title="HRNext Terminal"
          description="v2.4 Telemetry · Home Run Intelligence board"
          meta={
            <div className="flex items-center gap-2">
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
        
        {/* Board-shape controls only. Search, slate date, view mode, lineup
            certainty, radar filters and the export utilities all live in the
            control rail — this strip used to carry four extra rows before the
            first card. */}
        <div className="flex flex-wrap items-center gap-2 border-t border-white/5 pt-2 sm:gap-3">
          <HrNextSortMenu sortKey={sortKey} onSortChange={setSortKey} />

          <button
            type="button"
            onClick={() => setMobileControlsOpen((prev) => !prev)}
            aria-expanded={mobileControlsOpen}
            aria-controls="hr-next-control-sheet"
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1 font-mono text-[10px] font-black uppercase tracking-wider transition-colors lg:hidden ${
              mobileControlsOpen
                ? 'border-[#10B981] bg-[#10B981]/15 text-[#10B981]'
                : 'border-white/10 bg-white/5 text-white/50'
            }`}
          >
            <SlidersHorizontal className="h-3 w-3" />
            Controls
          </button>

          {/* Rank Teams — appears only under By Game, and transforms the board
              into the team power rankings in place. */}
          {groupBy === 'matchup' && (
            <button
              type="button"
              onClick={() => setIsTeamRankOpen((prev) => !prev)}
              aria-pressed={isTeamRankOpen}
              title="Rank teams by home run power for the selected games"
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1 font-mono text-[10px] font-black uppercase tracking-wider transition-colors animate-in fade-in slide-in-from-left-2 duration-200 ${
                isTeamRankOpen
                  ? 'border-[#10B981] bg-[#10B981] text-black shadow-[0_0_14px_rgba(16,185,129,0.45)]'
                  : 'border-white/10 bg-white/5 text-white/50 hover:border-white/20 hover:text-white'
              }`}
            >
              <Trophy className={`h-3 w-3 ${isTeamRankOpen ? 'text-black' : 'text-[#10B981]'}`} />
              <span>{isTeamRankOpen ? 'Ranking Teams' : 'Rank Teams'}</span>
            </button>
          )}

          {/* Pro Mode toggle — morphs the tier grid in place, no route reload */}
          {groupBy !== 'matchup' && (
            <button
              type="button"
              onClick={toggleProMode}
              aria-pressed={isProMode}
              title="Toggle Pro Mode telemetry cards (Shortcut: P)"
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1 font-mono text-[10px] font-black uppercase tracking-wider transition-colors ${
                isProMode
                  ? 'border-[#10B981] bg-[#10B981] text-black shadow-[0_0_14px_rgba(16,185,129,0.45)]'
                  : 'border-white/10 bg-white/5 text-white/50 hover:border-white/20 hover:text-white'
              }`}
            >
              <Sparkles className={`h-3 w-3 ${isProMode ? 'fill-black text-black' : 'text-[#10B981]'}`} />
              <span>Pro Mode: {isProMode ? 'ACTIVE' : 'OFF'}</span>
              <kbd className={`rounded border px-1 py-0.2 text-[8.5px] ${isProMode ? 'border-black/30 bg-black/20 text-black' : 'border-white/10 bg-black/40 text-white/40'}`}>
                P
              </kbd>
            </button>
          )}

          <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.12em] text-white/35">
            {exportStatus ?? `${Object.keys(savedMap).length} saved`}
          </span>
        </div>

        {/* Same rail component, stacked, for screens with no room for a column. */}
        {mobileControlsOpen && (
          <div id="hr-next-control-sheet" className="lg:hidden">
            <HrNextControlRail {...controlRailProps} variant="sheet" />
          </div>
        )}

        {/* Live Matchup Slider (Magically appears under options/search when By Game is selected) */}
        {groupBy === 'matchup' && availableMatchups.length > 0 && (
          <div className="pt-2">
            <HrNextMatchupSlider
              matchups={availableMatchups}
              activeIndex={selectedMatchupIndex}
              onSelectIndex={setSelectedMatchupIndex}
              onPrev={handlePrevMatchup}
              onNext={handleNextMatchup}
            />
          </div>
        )}
      </div>
      
      {/* Responsive Content: Dual-mode layout (Side Dock on >=2xl, Top Bar on <2xl) */}
      {/* `items-start` keeps the dock column from stretching to the full height
          of the board — a stretched sticky child has no travel and never moves.
          The extra bottom padding while the dock is open extends this row past
          the scroll pane's own trailing space: a sticky element cannot travel
          below its containing block, so without it the panel gets shoved up
          under the toolbar over the last stretch of the scroll. */}
      {/* `pb-36` is the mobile floor: the nav dock (md:hidden) and the ParlayOS
          slip pill (lg:hidden) are both fixed to the bottom of the viewport, so
          without it the last card in the column can never be scrolled clear of
          them. The reserve steps down as each of those disappears. */}
      <div
        className={`flex w-full flex-col items-start gap-8 p-4 pb-36 sm:p-6 md:pb-24 lg:pb-6 2xl:flex-row ${
          isDrawerOpen && selectedPlayer ? '2xl:pb-32' : ''
        }`}
      >
        {/* Main board column. Pro Mode needs the full width for its 4-tier grid,
            and so do the analytic panels — a scatter plot and the game ladder are
            width-hungry. Only the standard stacked list reads better capped. */}
        <div
          className={`w-full min-w-0 flex-1 space-y-4 ${
            isProMode || isMatrixActive || isTeamRankActive ? '' : 'max-w-5xl'
          }`}
        >
          {/* Top Bar on compact/narrow screens when player is selected */}
          {isDrawerOpen && selectedPlayer && (
            <div 
              ref={topResearchRef}
              id="hr-next-mobile-research" 
              className="w-full 2xl:hidden animate-in fade-in slide-in-from-top-4 duration-200 scroll-mt-24"
            >
              <HrNextResearchView 
                playerId={selectedPlayer.id}
                playerName={selectedPlayer.name}
                mode="topbar"
                onClose={closeDrawer}
              />
            </div>
          )}

          {/* Top telemetry bar — four quick-scan slate metrics */}
          <HrNextTelemetryBar telemetry={telemetry} />

          {/* Slate Alpha spotlight — largest model-vs-book divergence */}
          {telemetry.alpha && (
            <HrNextSpotlight
              alpha={telemetry.alpha}
              onOpenResearch={handleToggleResearch}
              onAddToSlip={handleAddToSlip}
            />
          )}

          {isMatrixActive ? (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
              <HrNextProjectionMatrix
                rows={analyticsScope.rows}
                scopeLabel={analyticsScope.label}
                savedMap={savedMap}
                onToggleSaved={toggleSaved}
                onAddToSlip={handleAddToSlip}
                onOpenResearch={handleToggleResearch}
                onClose={() => setIsMatrixOpen(false)}
                resolveStatcast={statcastResolved}
                onToggleStatcast={toggleStatcast}
              />
            </div>
          ) : isTeamRankActive ? (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
              <HrNextTeamRankView
                rankings={teamRankings}
                scopeLabel={analyticsScope.label}
                savedMap={savedMap}
                onToggleSaved={toggleSaved}
                onAddToSlip={handleAddToSlip}
                onOpenResearch={handleToggleResearch}
                onClose={() => setIsTeamRankOpen(false)}
              />
            </div>
          ) : (
            <HrNextBoard
              items={items}
              savedMap={savedMap}
              onToggleSaved={toggleSaved}
              onAddToSlip={handleAddToSlip}
              isProMode={isProMode}
              groupBy={groupBy}
              activeId={focusedId}
              onSelectActiveId={setFocusedId}
              selectedMatchupIndex={selectedMatchupIndex}
            />
          )}
        </div>

        {/* Side dock on wide screens (>= 1536px / 2xl).
            Only mounted while a player is selected — an always-on placeholder
            would permanently cost the 4-tier grid 420px of column width. */}
        {isDrawerOpen && selectedPlayer && (
          // Locked to the viewport while the board, matrix and game ladder scroll
          // past. `items-start` on the row keeps this column from stretching to
          // the full 3600px of board — a stretched sticky child has nothing left
          // to travel through and would never move. Sticky only from 2xl, the
          // width at which the dock is rendered at all; below that the panel is
          // the in-flow top bar in the main column and needs no lock.
          <aside
            style={dockFrame}
            className="hidden w-[420px] shrink-0 flex-col 2xl:sticky 2xl:flex"
          >
            <div className="flex min-h-0 flex-1 animate-in fade-in slide-in-from-right-4 duration-200">
              <HrNextResearchView
                playerId={selectedPlayer.id}
                playerName={selectedPlayer.name}
                mode="dock"
                onClose={closeDrawer}
              />
            </div>
          </aside>
        )}
      </div>

      {/* Feature 4: Keyboard Shortcuts Cheatsheet Modal */}
      <HrNextKeyboardCheatsheet
        isOpen={cheatsheetOpen}
        onClose={() => setCheatsheetOpen(false)}
      />
      </main>
    </div>
  );
}
