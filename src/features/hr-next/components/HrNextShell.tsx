import { Sparkles, Keyboard, Trophy, SlidersHorizontal, Share2, Loader2, RotateCw, ShieldCheck, Activity } from 'lucide-react';
import { useCallback, useState, useRef, useMemo, useEffect } from 'react';
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
import { buildVerifiedNowSlate } from '../utils/verifiedNow';
import { HrNextVerifiedNow } from './HrNextVerifiedNow';
import { buildTeamRankings, matchupKeyFor } from '../utils/teamRanking';
import { useHrNextKeybindings } from '../hooks/useHrNextKeybindings';
import { useHrListStore, selectActiveHrList } from '../../hr-list/hrListStore';
import { hrWatchRowToListEntry } from '../../hr-list/adapters/hrWatchRowToListEntry';
import HrListShareSheet from '../../hr-list/components/HrListShareSheet';
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
  // "My List" is the persistent HR list, not per-session state: it survives
  // reload, syncs to the account, and is what the share card renders. savedMap
  // is derived from it so the star, the export, and the share all read one
  // source. Board rows are keyed by stableId, list entries by playerId, so the
  // active list is projected back onto stableIds here.
  const activeHrList = useHrListStore(selectActiveHrList);
  const addHrListPlayer = useHrListStore((state) => state.addPlayer);
  const removeHrListPlayer = useHrListStore((state) => state.removePlayer);
  const createHrList = useHrListStore((state) => state.createList);
  const shareHrList = useHrListStore((state) => state.shareList);
  const hrListShare = useHrListStore((state) => state.share);
  const closeHrListShare = useHrListStore((state) => state.closeShare);
  const hrListSharing = useHrListStore((state) => state.sharing);

  const savedPlayerIds = useMemo(
    () => new Set((activeHrList?.entries ?? []).map((entry) => String(entry.playerId))),
    [activeHrList],
  );

  const savedMap = useMemo(() => {
    const map: Record<string, true> = {};
    for (const item of rawRows) {
      if (item.playerId != null && savedPlayerIds.has(String(item.playerId))) {
        map[item.stableId] = true;
      }
    }
    return map;
  }, [rawRows, savedPlayerIds]);

  // Counted off the list itself, not off savedMap: a saved player whose game
  // has rolled off today's board is still on the list and still shares.
  const savedCount = activeHrList?.entries.length ?? 0;

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
  // Distance from the top of the window down to the top of the scroll pane the
  // board lives in — the app's global top bar. The dock's height budget is the
  // visible slice of that pane, not the whole window, so a plain `100vh` figure
  // overshoots by exactly this much and pushes the panel's last rows off the
  // bottom of the screen where nothing can scroll them back.
  const [scrollportTop, setScrollportTop] = useState(0);
  const toolbarNodeRef = useRef<HTMLDivElement | null>(null);
  const boardRowRef = useRef<HTMLDivElement | null>(null);
  // A sticky element is held inside its containing block's content box, and the
  // app shell parks 120px of dead reserve below every route's scroll content.
  // That reserve sits *outside* this row, so over the last stretch of a long
  // board the dock runs out of floor and slides up under the toolbar. Measuring
  // it lets the same distance move inside the row instead — the trailing
  // whitespace looks identical, but now the dock can travel through it.
  const [dockReserve, setDockReserve] = useState(0);

  const measureToolbar = useCallback(() => {
    const node = toolbarNodeRef.current;
    if (!node) return;
    const next = node.getBoundingClientRect().height;
    setToolbarHeight((prev) => (Math.abs(prev - next) < 0.5 ? prev : next));

    let scroller: HTMLElement | null = node.parentElement;
    while (scroller) {
      const { overflowY } = getComputedStyle(scroller);
      if (overflowY === 'auto' || overflowY === 'scroll') break;
      scroller = scroller.parentElement;
    }
    // The pane element itself does not move as it scrolls, so this stays put.
    const paneTop = scroller ? Math.max(0, scroller.getBoundingClientRect().top) : 0;
    setScrollportTop((prev) => (Math.abs(prev - paneTop) < 0.5 ? prev : paneTop));

    const row = boardRowRef.current;
    if (scroller && row) {
      // Everything between this row's content box and the bottom of the pane's
      // scrollport: the pane's own reserve, this row's padding, and whatever the
      // pane stops short of the window by. `- 16` leaves the dock the same gap
      // under it that `dockFrame` leaves above it.
      const trailing =
        parseFloat(getComputedStyle(scroller).paddingBottom || '0') +
        parseFloat(getComputedStyle(row).paddingBottom || '0') +
        Math.max(0, window.innerHeight - scroller.getBoundingClientRect().bottom);
      const next = Math.max(0, Math.round(trailing) - 16);
      setDockReserve((prev) => (prev === next ? prev : next));
    }
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

  /** Sticky offset and height budget for the research dock. `top` is measured
   *  from the scroll pane's own top edge, which is where sticky resolves from;
   *  the height has to net out the pane's offset in the window as well. */
  const dockFrame = useMemo(
    () => ({
      top: `${Math.round(toolbarHeight) + 16}px`,
      maxHeight: `calc(100vh - ${Math.round(scrollportTop + toolbarHeight) + 32}px)`,
    }),
    [toolbarHeight, scrollportTop],
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

  // xl is where the panel stops being an in-flow top bar and becomes the dock.
  // Read once here so the scroll behaviour and the dock's travel reserve cannot
  // disagree with the breakpoint the CSS actually rendered.
  const [isDockLayout, setIsDockLayout] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const query = window.matchMedia('(min-width: 1280px)');
    const apply = () => setIsDockLayout(query.matches);
    apply();
    query.addEventListener('change', apply);
    return () => query.removeEventListener('change', apply);
  }, []);

  const selectedPlayer = useResearchStore((s) => s.selectedPlayer);
  const isDrawerOpen = useResearchStore((s) => s.isDrawerOpen);
  const openDrawer = useResearchStore((s) => s.openDrawer);
  const closeDrawer = useResearchStore((s) => s.closeDrawer);

  // Below xl the panel is still the in-flow top bar, so it has to be scrolled
  // to. From xl up it is the sticky dock, which arrives already parked in the
  // viewport — scrolling there would yank the reader off the card they just
  // opened, which is the whole point of the dock.
  useEffect(() => {
    if (isDrawerOpen && selectedPlayer) {
      if (!isDockLayout) {
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
  }, [isDrawerOpen, selectedPlayer?.id, isDockLayout]);

  const isDockDocked = isDockLayout && isDrawerOpen && Boolean(selectedPlayer);

  const toggleSaved = useCallback((id: string) => {
    const row = rawRows.find((candidate) => candidate.stableId === id);
    if (!row) return;

    const entry = hrWatchRowToListEntry(row);
    // A row with no player id has no stable identity to store against.
    if (!entry) return;

    if (savedPlayerIds.has(String(entry.playerId))) {
      if (activeHrList) void removeHrListPlayer(activeHrList.id, entry.playerId);
      return;
    }

    // First save of the session creates the list rather than blocking on setup.
    if (activeHrList) {
      void addHrListPlayer(activeHrList.id, entry);
      return;
    }
    void createHrList('My HR List').then((created) => {
      if (created) void addHrListPlayer(created.id, entry);
    });
  }, [rawRows, savedPlayerIds, activeHrList, addHrListPlayer, removeHrListPlayer, createHrList]);

  const handleShareHrList = useCallback(() => {
    if (activeHrList) void shareHrList(activeHrList.id);
  }, [activeHrList, shareHrList]);

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
  const verifiedNow = useMemo(() => buildVerifiedNowSlate(rawRows), [rawRows]);

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
  const effectiveProMode = viewMode === 'tier' && isProMode;
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
    onToggleProMode: viewMode === 'tier' ? toggleProMode : undefined,
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
    savedCount,
  } as const;

  return (
    <div className="hr-next relative z-10 flex min-h-0 w-full min-w-0 flex-1">

      {/* Query controls own the left column now that the app routes moved to the
          global top bar. Below lg the same component renders as a sheet above
          the board. */}
      <HrNextControlRail {...controlRailProps} />

      {/* No `overflow-y-auto` here. The app shell's `.ve-scroll-pane` is what
          actually scrolls; this column never overflows its own box, so an
          `overflow` value on it only creates a dead scrollport — and a dead
          scrollport is what `position: sticky` descendants anchor to, which
          silently killed both the toolbar's pin and the research dock's. */}
      <main className="flex min-w-0 flex-1 flex-col">

      {/* Translucent rather than solid, so the ambient field reads through the
          chrome. No `backdrop-blur` on this one: it is sticky over a long
          scrolling list, and a backdrop-filter here re-composites the whole
          board every scroll frame. Alpha alone gets the particles through at no
          scroll cost. */}
      {/* Sticky Telemetry HUD Header */}
      <div
        ref={toolbarRef}
        className="sticky top-0 z-30 space-y-3 border-b-2 border-white/15 bg-black/95 px-4 py-3 sm:px-6 font-mono"
      >
        {/* Top Telemetry Beacon & Identity Bar */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-2 w-2 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">
                  VOUCHEDGE // HOME RUN COMMAND DESK
                </span>
                <span className="hidden md:inline px-1.5 py-0.2 border border-white/20 bg-zinc-900 text-[8px] font-black text-zinc-400">
                  STAGE: 03 / STATCAST & PROJECTIONS
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 truncate mt-0.5">
                Deterministic HRPI Model Feed · Real-Time Statcast Radar · Sharp HUD Telemetry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => refetch()}
              disabled={syncing}
              title="Synchronize Live Board (R)"
              className="flex items-center gap-1.5 px-2.5 py-1 border border-white/20 bg-zinc-950 text-zinc-300 hover:text-white hover:border-white text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
            >
              <RotateCw className={`w-3 h-3 text-cyan-400 ${syncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync</span>
              <kbd className="text-[8.5px] bg-black px-1 border border-white/15 text-zinc-500">R</kbd>
            </button>

            <button
              type="button"
              onClick={() => setCheatsheetOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 border border-white/20 bg-zinc-950 text-zinc-300 hover:text-white hover:border-white text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
              title="Keyboard Shortcuts (?)"
            >
              <Keyboard className="w-3 h-3 text-cyan-400" />
              <span className="hidden sm:inline">Keys</span>
              <kbd className="text-[8.5px] bg-black px-1 border border-white/15 text-zinc-500">?</kbd>
            </button>
          </div>
        </div>
        
        {/* Board Actions & Controls Strip */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 font-mono">
          <HrNextSortMenu sortKey={sortKey} onSortChange={setSortKey} />

          <button
            type="button"
            onClick={() => setMobileControlsOpen((prev) => !prev)}
            aria-expanded={mobileControlsOpen}
            aria-controls="hr-next-control-sheet"
            className={`flex items-center gap-1.5 border px-3 py-1 font-mono text-[10px] font-black uppercase tracking-wider transition-colors lg:hidden cursor-pointer ${
              mobileControlsOpen
                ? 'border-cyan-400 bg-cyan-950/50 text-cyan-300'
                : 'border-white/15 bg-black text-zinc-400 hover:border-white/30 hover:text-white'
            }`}
          >
            <SlidersHorizontal className="h-3 w-3" />
            Controls
          </button>

          {/* Rank Teams */}
          {groupBy === 'matchup' && (
            <button
              type="button"
              onClick={() => setIsTeamRankOpen((prev) => !prev)}
              aria-pressed={isTeamRankOpen}
              title="Rank teams by home run power for the selected games"
              className={`flex items-center gap-1.5 border px-3 py-1 font-mono text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer ${
                isTeamRankOpen
                  ? 'border-cyan-400 bg-cyan-400 text-black font-black shadow-[0_0_14px_rgba(0,240,255,0.45)]'
                  : 'border-white/15 bg-black text-zinc-400 hover:border-white/30 hover:text-white'
              }`}
            >
              <Trophy className={`h-3 w-3 ${isTeamRankOpen ? 'text-black' : 'text-cyan-400'}`} />
              <span>{isTeamRankOpen ? 'Ranking Teams' : 'Rank Teams'}</span>
            </button>
          )}

          {/* Pro Mode toggle — appears strictly when By Tier is the option */}
          {viewMode === 'tier' && (
            <button
              type="button"
              onClick={toggleProMode}
              aria-pressed={isProMode}
              title="Toggle Pro Mode telemetry cards (Shortcut: P)"
              className={`flex items-center gap-1.5 border px-3 py-1 font-mono text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer ${
                isProMode
                  ? 'border-cyan-400 bg-cyan-400 text-black font-black shadow-[0_0_14px_rgba(0,240,255,0.45)]'
                  : 'border-white/15 bg-black text-zinc-400 hover:border-white/30 hover:text-white'
              }`}
            >
              <Sparkles className={`h-3 w-3 ${isProMode ? 'fill-black text-black' : 'text-cyan-400'}`} />
              <span>Pro Mode: {isProMode ? 'ACTIVE' : 'OFF'}</span>
              <kbd className={`px-1 py-0.2 text-[8.5px] border ${isProMode ? 'border-black/40 bg-black/20 text-black' : 'border-white/15 bg-zinc-900 text-zinc-500'}`}>
                P
              </kbd>
            </button>
          )}

          {/* Share My HR List */}
          <button
            type="button"
            onClick={handleShareHrList}
            disabled={hrListSharing || savedCount === 0}
            aria-label={
              savedCount === 0
                ? 'Save players to your HR list before sharing'
                : `Share my HR list — ${savedCount} ${savedCount === 1 ? 'player' : 'players'}`
            }
            title={savedCount === 0 ? 'Star players to build your HR list first' : 'Share my HR list'}
            className={`ml-auto flex items-center gap-1.5 border px-3 py-1 font-mono text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer ${
              savedCount > 0
                ? 'border-emerald-400/60 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50'
                : 'border-white/10 bg-black text-zinc-600 cursor-not-allowed'
            }`}
          >
            {hrListSharing
              ? <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
              : <Share2 className="h-3 w-3" aria-hidden="true" />}
            <span>Share My HR List</span>
          </button>

          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-500">
            {exportStatus ?? `${savedCount} saved`}
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
      
      {/* Board & Research Dock Row */}
      <div
        ref={boardRowRef}
        style={isDockDocked ? { marginBottom: `-${dockReserve}px` } : undefined}
        className="flex w-full flex-col items-start gap-4 pb-36 sm:p-0 md:pb-24 lg:pb-6 xl:flex-row"
      >
        {/* `@container` so the Pro Mode tier grid sizes off this column's real
            width rather than the viewport's — with the dock beside it the two
            numbers differ by up to 460px, and a viewport-keyed grid keeps four
            columns in a space that only fits two. */}
        <div
          className={`@container w-full min-w-0 flex-1 space-y-4 ${
            effectiveProMode || isMatrixActive || isTeamRankActive ? '' : 'max-w-5xl'
          }`}
          // The row gives this distance back as negative margin, so the page is
          // no longer than before — the trailing space has just moved inside
          // the box that bounds the dock's travel.
          style={isDockDocked ? { paddingBottom: `${dockReserve}px` } : undefined}
        >
          {/* Top Bar on compact/narrow screens when player is selected */}
          {isDrawerOpen && selectedPlayer && (
            <div 
              ref={topResearchRef}
              id="hr-next-mobile-research" 
              className="w-full xl:hidden animate-in fade-in slide-in-from-top-4 duration-200 scroll-mt-24"
            >
              <HrNextResearchView 
                playerId={selectedPlayer.id}
                playerName={selectedPlayer.name}
                mode="topbar"
                onClose={closeDrawer}
              />
            </div>
          )}

          <HrNextVerifiedNow
            slate={verifiedNow}
            onOpenResearch={handleToggleResearch}
            onAddToSlip={handleAddToSlip}
          />

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
              isProMode={effectiveProMode}
              groupBy={groupBy}
              activeId={focusedId}
              onSelectActiveId={setFocusedId}
              selectedMatchupIndex={selectedMatchupIndex}
            />
          )}
        </div>

        {/* Side dock on every desktop width (>= 1280px / xl) */}
        {isDrawerOpen && selectedPlayer && (
          <aside
            style={dockFrame}
            className="hidden shrink-0 flex-col xl:sticky xl:flex xl:w-[360px] 2xl:w-[420px]"
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

      {/* Opens once the list is published and the permalink is known. */}
      {hrListShare && activeHrList && (
        <HrListShareSheet
          bundle={hrListShare.bundle}
          listTitle={activeHrList.title}
          onClose={closeHrListShare}
        />
      )}

      {/* Deterministic Protocol SHA-256 Audit Verification Footer */}
      <footer className="mt-8 border-t-2 border-white/10 bg-zinc-950 p-4 font-mono text-[10px] text-zinc-500">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="text-white font-bold uppercase tracking-wider">
              VOUCH DETERMINISTIC PROTOCOL // SOURCE GAPS PRESERVED
            </span>
            <span className="text-zinc-600 hidden md:inline">
              VERIFIED NOW: {verifiedNow.completeRows}/{verifiedNow.totalRows}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[9px] uppercase tracking-widest text-zinc-400">
            <span className="flex items-center gap-1">
              <Activity className="h-3 w-3 text-cyan-400 shrink-0" />
              MLB PIPELINE ENGINE: RUNNING
            </span>
            <span>·</span>
            <span>MISSING INPUTS STAY LOCKED</span>
            <span>·</span>
            <span>NO OUTCOME GUARANTEE</span>
          </div>
        </div>
      </footer>
      </main>
    </div>
  );
}
