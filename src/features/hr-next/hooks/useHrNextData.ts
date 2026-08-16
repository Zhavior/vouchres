import { useMemo, useState } from 'react';
import { useHrBoardViewModel } from '../../hr/hooks/useHrBoardViewModel';
import type { HrWatchRow } from '../../hr/types/hrWatch';

export type HrNextItem = 
  | { type: 'header'; tier: string; id: string }
  | { type: 'row'; row: HrWatchRow; id: string };

const TIER_ORDER = ['Elite', 'Strong', 'Watch', 'Sleepers'] as const;

export type DeskSortKey = 'hrpi' | 'ev' | 'odds' | 'time' | 'volume';
export type GroupByMode = 'tier' | 'matchup' | 'none';
export type TacticalFilterTag = 'all' | 'hot' | 'high_ev' | 'wind_out' | 'vulnerable_sp' | 'platoon';

export function matchesTacticalFilter(row: HrWatchRow, tag: TacticalFilterTag): boolean {
  if (tag === 'all') return true;
  if (tag === 'hot') {
    return (row.recentHomeRuns != null && row.recentHomeRuns > 0) || (row.recentForm != null && row.recentForm >= 80);
  }
  if (tag === 'high_ev') {
    const hasEv = row.hrProbability != null && row.impliedProbability != null && row.impliedProbability > 0 &&
      ((row.hrProbability - row.impliedProbability) / row.impliedProbability) >= 0.05;
    return hasEv || row.reasons.some(r => r.toLowerCase().includes('ev') || r.toLowerCase().includes('value') || r.toLowerCase().includes('edge'));
  }
  if (tag === 'wind_out') {
    return (row.parkFactor != null && row.parkFactor >= 104) || row.reasons.some(r => r.toLowerCase().includes('wind') || r.toLowerCase().includes('park'));
  }
  if (tag === 'vulnerable_sp') {
    return (row.pitcherVulnerability != null && row.pitcherVulnerability >= 68) || row.reasons.some(r => r.toLowerCase().includes('pitcher') || r.toLowerCase().includes('vulnerable'));
  }
  if (tag === 'platoon') {
    return (row.hitterPower != null && row.hitterPower >= 82) || row.reasons.some(r => r.toLowerCase().includes('power') || r.toLowerCase().includes('platoon') || r.toLowerCase().includes('iso'));
  }
  return true;
}

export function useHrNextData() {
  const vm = useHrBoardViewModel();
  const [sortKey, setSortKey] = useState<DeskSortKey>('hrpi');
  const [groupBy, setGroupBy] = useState<GroupByMode>('tier');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState<TacticalFilterTag>('all');

  const { flatItems, filterCounts, allRawRows } = useMemo(() => {
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

    // Compute tactical filter counts across all search-filtered rows
    const counts: Record<TacticalFilterTag, number> = {
      all: allRows.length,
      hot: allRows.filter(r => matchesTacticalFilter(r, 'hot')).length,
      high_ev: allRows.filter(r => matchesTacticalFilter(r, 'high_ev')).length,
      wind_out: allRows.filter(r => matchesTacticalFilter(r, 'wind_out')).length,
      vulnerable_sp: allRows.filter(r => matchesTacticalFilter(r, 'vulnerable_sp')).length,
      platoon: allRows.filter(r => matchesTacticalFilter(r, 'platoon')).length,
    };

    // 3. Apply active tactical filter tag
    if (filterTag !== 'all') {
      allRows = allRows.filter(r => matchesTacticalFilter(r, filterTag));
    }

    // 4. Sort all rows globally
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

    // 5. Grouping
    const items: HrNextItem[] = [];

    if (groupBy === 'none') {
      for (const row of allRows) {
        items.push({ type: 'row', row, id: `row-${row.stableId ?? row.playerId}` });
      }
    } else if (groupBy === 'tier') {
      const normalizeTier = (tier: string | undefined | null): (typeof TIER_ORDER)[number] => {
        if (!tier) return 'Watch';
        const lower = tier.toLowerCase();
        if (lower.includes('elite')) return 'Elite';
        if (lower.includes('strong') || lower.includes('core')) return 'Strong';
        if (lower.includes('watch') || lower.includes('value')) return 'Watch';
        return 'Sleepers';
      };

      // Group by 4 Tiers (using TIER_ORDER)
      for (const tier of TIER_ORDER) {
        const tierRows = allRows.filter(r => normalizeTier(r.riskTier) === tier);
        if (tierRows.length > 0) {
          const tierEmoji = tier === 'Elite' ? '👑' : tier === 'Strong' ? '⚡' : tier === 'Watch' ? '🎯' : '🌊';
          items.push({ type: 'header', tier: `${tierEmoji} ${tier} Tier (${tierRows.length})`, id: `header-tier-${tier}` });
          for (const row of tierRows) {
            items.push({ type: 'row', row, id: `row-${row.stableId ?? row.playerId}` });
          }
        }
      }
    } else if (groupBy === 'matchup') {
      // Group by Matchup string (e.g. "NYY @ BOS")
      const matchupMap = new Map<string, HrWatchRow[]>();
      for (const row of allRows) {
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

    return { flatItems: items, filterCounts: counts, allRawRows: allRows };
  }, [vm.buckets, sortKey, groupBy, searchQuery, filterTag]);

  return {
    items: flatItems,
    filterCounts,
    rawRows: allRawRows,
    filterTag,
    setFilterTag,
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
