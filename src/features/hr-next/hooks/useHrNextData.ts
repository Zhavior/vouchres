import { useMemo, useState } from 'react';
import { useHrBoardViewModel } from '../../hr/hooks/useHrBoardViewModel';
import type { HrWatchRow } from '../../hr/types/hrWatch';

export type HrNextItem = 
  | { type: 'header'; tier: string; id: string }
  | { type: 'row'; row: HrWatchRow; id: string };

const TIER_ORDER = ['Elite', 'Strong', 'Watch', 'Sleepers'] as const;

export type DeskSortKey = 'hrpi' | 'ev' | 'odds' | 'time' | 'volume';
export type GroupByMode = 'tier' | 'matchup' | 'none';

export function useHrNextData() {
  const vm = useHrBoardViewModel();
  const [sortKey, setSortKey] = useState<DeskSortKey>('hrpi');
  const [groupBy, setGroupBy] = useState<GroupByMode>('tier');
  const [searchQuery, setSearchQuery] = useState('');

  const flatItems = useMemo(() => {
    // 1. Gather all available rows into a single pool
    let allRows: HrWatchRow[] = [];
    for (const tier of TIER_ORDER) {
      if (vm.buckets[tier]) {
        allRows = allRows.concat(vm.buckets[tier]);
      }
    }

    // 2. Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      allRows = allRows.filter(r => 
        r.playerName.toLowerCase().includes(q) || 
        r.team.toLowerCase().includes(q) ||
        r.opponent.toLowerCase().includes(q)
      );
    }

    // 3. Sort all rows globally
    allRows.sort((left, right) => {
      if (sortKey === 'hrpi') return right.hrScore - left.hrScore;
      if (sortKey === 'ev') {
        const getEv = (r: HrWatchRow) => (r.hrProbability != null && r.impliedProbability != null && r.impliedProbability > 0) ? ((r.hrProbability - r.impliedProbability) / r.impliedProbability) : -999;
        return getEv(right) - getEv(left);
      }
      if (sortKey === 'odds') {
        const leftOdds = left.bookOdds ?? -9999;
        const rightOdds = right.bookOdds ?? -9999;
        return rightOdds - leftOdds;
      }
      if (sortKey === 'volume') return (right.vouchScore ?? right.dataConfidence ?? -1) - (left.vouchScore ?? left.dataConfidence ?? -1);
      
      // Time sort
      const getTime = (gameTime: string | null) => {
        if (!gameTime) return Number.POSITIVE_INFINITY;
        const iso = Date.parse(gameTime);
        if (Number.isFinite(iso)) {
          const dt = new Date(iso);
          return dt.getHours() * 60 + dt.getMinutes();
        }
        const mer = gameTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (!mer) return Number.POSITIVE_INFINITY;
        let hours = Number(mer[1]);
        if (mer[3].toUpperCase() === 'PM' && hours !== 12) hours += 12;
        if (mer[3].toUpperCase() === 'AM' && hours === 12) hours = 0;
        return hours * 60 + Number(mer[2]);
      };
      return getTime(left.gameTime) - getTime(right.gameTime);
    });

    // 4. Grouping
    const items: HrNextItem[] = [];

    if (groupBy === 'none') {
      for (const row of allRows) {
        items.push({ type: 'row', row, id: `row-${row.stableId ?? row.playerId}` });
      }
    } else if (groupBy === 'tier') {
      // Group by Tier (using TIER_ORDER)
      for (const tier of TIER_ORDER) {
        const tierRows = allRows.filter(r => r.riskTier === tier);
        if (tierRows.length > 0) {
          items.push({ type: 'header', tier, id: `header-tier-${tier}` });
          for (const row of tierRows) {
            items.push({ type: 'row', row, id: `row-${row.stableId ?? row.playerId}` });
          }
        }
      }
    } else if (groupBy === 'matchup') {
      // Group by Matchup string (e.g. "NYY @ BOS")
      const matchupMap = new Map<string, HrWatchRow[]>();
      for (const row of allRows) {
        // Build a consistent matchup string
        const team1 = [row.team, row.opponent].sort()[0];
        const team2 = [row.team, row.opponent].sort()[1];
        const matchStr = `${team1} vs ${team2}`;
        if (!matchupMap.has(matchStr)) matchupMap.set(matchStr, []);
        matchupMap.get(matchStr)!.push(row);
      }
      for (const [matchup, matchRows] of matchupMap.entries()) {
        items.push({ type: 'header', tier: matchup, id: `header-matchup-${matchup}` });
        for (const row of matchRows) {
          items.push({ type: 'row', row, id: `row-${row.stableId ?? row.playerId}` });
        }
      }
    }

    return items;
  }, [vm.buckets, sortKey, groupBy, searchQuery]);

  return {
    items: flatItems,
    isLoading: vm.loading,
    error: vm.error,
    refetch: vm.refresh,
    lastFetchedAt: vm.lastUpdated,
    mode: vm.mode,
    setMode: vm.setMode,
    sortKey,
    setSortKey,
    groupBy,
    setGroupBy,
    searchQuery,
    setSearchQuery,
  };
}
