/**
 * useMlbStatHub — Primary hub state hook
 *
 * Manages: active stat type, date, filters, search, sort, view mode, tab
 * Production: swap getMockRows for real API fetch keyed on [statType, date]
 */

import { useState, useMemo, useCallback } from 'react';
import type {
  StatType, StatHubFilters, StatPlayerRow,
  StatViewTab, StatViewMode, StatSortField, StatSortDir, StatTier,
} from '../types/statHubTypes';
import { getMockRows } from '../engine/mockStatData';

const TODAY = new Date().toISOString().slice(0, 10);

const DEFAULT_FILTERS: StatHubFilters = {
  statType:   'hr',
  date:       TODAY,
  team:       null,
  search:     '',
  viewTab:    'today',
  viewMode:   'cards',
  sortField:  'score',
  sortDir:    'desc',
  tierFilter: [],
};

function sortRows(rows: StatPlayerRow[], field: StatSortField, dir: StatSortDir): StatPlayerRow[] {
  return [...rows].sort((a, b) => {
    let av: number, bv: number;
    switch (field) {
      case 'score':  av = a.statScore;      bv = b.statScore;      break;
      case 'season': av = a.seasonValue ?? 0; bv = b.seasonValue ?? 0; break;
      case 'edge':   av = a.edgePct ?? 0;    bv = b.edgePct ?? 0;    break;
      case 'name':   return dir === 'asc'
        ? a.playerName.localeCompare(b.playerName)
        : b.playerName.localeCompare(a.playerName);
      default:       av = 0; bv = 0;
    }
    return dir === 'desc' ? bv - av : av - bv;
  });
}

export function useMlbStatHub() {
  const [filters, setFilters] = useState<StatHubFilters>(DEFAULT_FILTERS);
  const [selectedPlayer, setSelectedPlayer] = useState<StatPlayerRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Data fetch — mock today; production: useSWR/useQuery
  const allRows = useMemo(
    () => getMockRows(filters.statType, filters.date),
    [filters.statType, filters.date],
  );

  // Filtered + sorted rows
  const rows = useMemo(() => {
    let r = allRows;

    if (filters.search) {
      const q = filters.search.toLowerCase();
      r = r.filter(p =>
        p.playerName.toLowerCase().includes(q) ||
        p.team.toLowerCase().includes(q) ||
        (p.opponent ?? '').toLowerCase().includes(q),
      );
    }

    if (filters.team) {
      r = r.filter(p => p.team === filters.team || p.opponent === filters.team);
    }

    if (filters.tierFilter.length > 0) {
      r = r.filter(p => filters.tierFilter.includes(p.tier));
    }

    return sortRows(r, filters.sortField, filters.sortDir);
  }, [allRows, filters.search, filters.team, filters.tierFilter, filters.sortField, filters.sortDir]);

  // Setters
  const setStatType  = useCallback((t: StatType)     => setFilters(f => ({ ...f, statType: t, tierFilter: [] })), []);
  const setDate      = useCallback((d: string)        => setFilters(f => ({ ...f, date: d })), []);
  const setSearch    = useCallback((s: string)        => setFilters(f => ({ ...f, search: s })), []);
  const setTeam      = useCallback((t: string | null) => setFilters(f => ({ ...f, team: t })), []);
  const setViewTab   = useCallback((t: StatViewTab)   => setFilters(f => ({ ...f, viewTab: t })), []);
  const setViewMode  = useCallback((m: StatViewMode)  => setFilters(f => ({ ...f, viewMode: m })), []);
  const setSort      = useCallback((field: StatSortField, dir: StatSortDir) =>
    setFilters(f => ({ ...f, sortField: field, sortDir: dir })), []);
  const toggleTier   = useCallback((tier: StatTier) =>
    setFilters(f => ({
      ...f,
      tierFilter: f.tierFilter.includes(tier)
        ? f.tierFilter.filter(t => t !== tier)
        : [...f.tierFilter, tier],
    })), []);

  const openDrawer  = useCallback((player: StatPlayerRow) => {
    setSelectedPlayer(player);
    setDrawerOpen(true);
  }, []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  // Tier counts for header badges
  const tierCounts = useMemo(() => ({
    elite:   rows.filter(r => r.tier === 'elite').length,
    strong:  rows.filter(r => r.tier === 'strong').length,
    watch:   rows.filter(r => r.tier === 'watch').length,
    sleeper: rows.filter(r => r.tier === 'sleeper').length,
    total:   rows.length,
  }), [rows]);

  return {
    filters,
    rows,
    allRows,
    tierCounts,
    selectedPlayer,
    drawerOpen,
    setStatType,
    setDate,
    setSearch,
    setTeam,
    setViewTab,
    setViewMode,
    setSort,
    toggleTier,
    openDrawer,
    closeDrawer,
  };
}
