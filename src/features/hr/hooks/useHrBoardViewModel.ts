import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useDailyHrBoard } from './useDailyHrBoard';
import { useHrResultsForDate } from './useHrResultsForDate';
import { buildBoard, rowsForMode } from '../utils/normalizeHrWatch';
import type { HrWatchMode, HrWatchRow } from '../types/hrWatch';
import { localISODate } from '../utils/localDate';

function todayISO() {
  return localISODate();
}

export type HrResult = 'hit' | 'no-hr' | null;

export interface HrBoardStats {
  total: number;
  elite: number;
  strong: number;
  watch: number;
  sleepers: number;
}

export interface HrBuckets {
  Elite: HrWatchRow[];
  Strong: HrWatchRow[];
  Watch: HrWatchRow[];
  Sleepers: HrWatchRow[];
}

/** Engine risk tiers → board display columns. Blocked rows never render on the board. */
const DISPLAY_TIER: Record<HrWatchRow['riskTier'], keyof HrBuckets | null> = {
  Elite: 'Elite',
  Core: 'Strong',
  Watch: 'Watch',
  Deep: 'Sleepers',
  Blocked: null,
};

export function useHrBoardViewModel() {
  const [mode, setModeState] = useState<HrWatchMode>('confirmed');
  const [viewMode, setViewMode] = useState<'cards' | 'spreadsheet'>(() => {
    if (typeof window === 'undefined') return 'cards';
    return window.matchMedia('(max-width: 767px)').matches ? 'spreadsheet' : 'cards';
  });
  const [search, setSearch] = useState('');
  const [selectedTiers, setSelectedTiers] = useState<string[]>(['Elite', 'Strong', 'Watch', 'Sleepers']);
  const [selectedPlayer, setSelectedPlayer] = useState<HrWatchRow | null>(null);
  const [autoSwitchedToPreview, setAutoSwitchedToPreview] = useState(false);
  const userPickedModeRef = useRef(false);

  const setMode = (next: HrWatchMode) => {
    userPickedModeRef.current = true;
    setAutoSwitchedToPreview(false);
    setModeState(next);
  };

  const onToggleTier = (tier: string) => {
    setSelectedTiers((current) =>
      current.includes(tier) ? current.filter((item) => item !== tier) : [...current, tier]
    );
  };

  const [date, setDateState] = useState<string>(todayISO);
  const isToday = date === todayISO();

  const setDate = useCallback((next: string) => {
    // Never let the calendar select a date beyond today — there's no real
    // slate or results to show for a day that hasn't happened yet.
    setDateState(next > todayISO() ? todayISO() : next);
  }, []);

  const { data: rawBoard, loading, error, refresh } = useDailyHrBoard(date);
  const hrResults = useHrResultsForDate(date);

  const getHrResult = useCallback((playerId: string | number | null): HrResult => {
    if (playerId == null || hrResults.loading) return null;
    const id = typeof playerId === 'string' ? Number(playerId) : playerId;
    if (!Number.isFinite(id)) return null;
    if (hrResults.hitByPlayerId.has(id)) return 'hit';
    // Mid-slate today: a miss so far isn't a confirmed "no HR" yet.
    return hrResults.isToday ? null : 'no-hr';
  }, [hrResults]);

  const board = useMemo(() => rawBoard ? buildBoard(rawBoard as unknown) : null, [rawBoard]);

  // The board should never land on a dead-end empty view when data exists.
  // If confirmed lineups aren't posted yet but preview candidates are ready,
  // auto-switch once (never overriding a mode the user picked themselves) —
  // and say so, since silently substituting preview for confirmed would
  // violate the "no fake confirmed lineups" rule if left unlabeled.
  useEffect(() => {
    if (!board || userPickedModeRef.current) return;
    if (mode === 'confirmed' && board.confirmed.length === 0 && board.curated.length > 0) {
      setModeState('curated');
      setAutoSwitchedToPreview(true);
    }
  }, [board, mode]);

  const rows = useMemo(() => board ? rowsForMode(board, mode) : [], [board, mode]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      const tier = DISPLAY_TIER[row.riskTier];
      if (!tier || !selectedTiers.includes(tier)) return false;
      if (!query) return true;
      const haystack = [
        row.playerName, row.team, row.opponent, row.pitcherName, 
        row.venue, row.reasons?.join(' '), row.oddsLabel
      ].join(' ').toLowerCase();
      return haystack.includes(query);
    });
  }, [rows, search, selectedTiers]);

  const buckets = useMemo<HrBuckets>(() => {
    const b: HrBuckets = { Elite: [], Strong: [], Watch: [], Sleepers: [] };
    
    for (const row of filteredRows) {
      const tier = DISPLAY_TIER[row.riskTier];
      if (tier) b[tier].push(row);
    }
    return b;
  }, [filteredRows]);

  const stats = useMemo<HrBoardStats>(() => ({
    total: filteredRows.length,
    elite: buckets.Elite.length,
    strong: buckets.Strong.length,
    watch: buckets.Watch.length,
    sleepers: buckets.Sleepers.length,
  }), [buckets, filteredRows.length]);

  // Counts across ALL modes regardless of the current filter, so the empty
  // state can explain *why* it's empty (e.g. no confirmed lineups posted yet)
  // instead of a dead-end "no players" message.
  const modeCounts = useMemo(() => ({
    confirmed: board?.confirmed.length ?? 0,
    curated: board?.curated.length ?? 0,
    all: board?.all.length ?? 0,
  }), [board]);

  return {
    buckets, rows: filteredRows, stats, selectedPlayer, loading, error, mode, viewMode, search, selectedTiers, modeCounts,
    autoSwitchedToPreview,
    setMode, setViewMode, setSearch, setSelectedPlayer, onToggleTier, refresh,
    date, setDate, isToday, getHrResult, hrResultsLoading: hrResults.loading,
  };
}
