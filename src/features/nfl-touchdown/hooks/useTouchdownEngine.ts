import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import type {
  TouchdownPlayer,
  NflTickerGame,
  TacticalRadarFilters,
  PlayerTier,
  LiveThreatEvent,
} from '../../../types/touchdown';
import { liveThreatsQueryOptions, tdBoardV2QueryOptions } from '../queries/touchdownQueries';

const DEFAULT_FILTERS: TacticalRadarFilters = {
  searchQuery: '',
  positionFocus: 'ALL',
  rzTouchShareMin25: false,
  inside10TargetMin30: false,
  oppRzDefBottom10: false,
  impliedTotalMin24_5: false,
  redZoneAlertOnly: false,
  positiveEdgeOnly: false,
  selectedGameId: null,
};

export function useTouchdownEngine() {
  const slateQuery = useQuery(tdBoardV2QueryOptions());
  const threatsQuery = useQuery(liveThreatsQueryOptions());
  const players = slateQuery.data?.success ? slateQuery.data.players : [];
  const games: NflTickerGame[] = slateQuery.data?.success ? slateQuery.data.games : [];
  const [filters, setFilters] = useState<TacticalRadarFilters>(DEFAULT_FILTERS);
  const [selectedPlayerDossier, setSelectedPlayerDossier] = useState<TouchdownPlayer | null>(null);

  const liveThreats: LiveThreatEvent[] = threatsQuery.data?.success
    ? threatsQuery.data.data
    : [];

  // Filter mutation handlers
  const updateFilter = useCallback(<K extends keyof TacticalRadarFilters>(key: K, value: TacticalRadarFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const applyPreset = useCallback((presetName: 'HEAVY_GL' | 'MISMATCH' | 'VALUE') => {
    setFilters((prev) => {
      const reset = { ...DEFAULT_FILTERS, searchQuery: prev.searchQuery, selectedGameId: prev.selectedGameId };
      switch (presetName) {
        case 'HEAVY_GL':
          return { ...reset, positionFocus: 'GLR', inside10TargetMin30: true };
        case 'MISMATCH':
          return { ...reset, oppRzDefBottom10: true, impliedTotalMin24_5: true };
        case 'VALUE':
          return { ...reset, positiveEdgeOnly: true }; // and maybe we should filter by tier below
        default:
          return reset;
      }
    });
  }, []);

  const selectGame = useCallback((gameId: string | null) => {
    setFilters((prev) => ({
      ...prev,
      selectedGameId: prev.selectedGameId === gameId ? null : gameId,
    }));
  }, []);

  // Filtered Players Pool
  const filteredPlayers = useMemo(() => {
    return players.filter((player) => {
      // 1. Search Query
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase();
        const matchesName = player.name.toLowerCase().includes(query);
        const matchesTeam = player.team.toLowerCase().includes(query) || player.opponent.toLowerCase().includes(query);
        if (!matchesName && !matchesTeam) return false;
      }

      // 2. Selected Game Filter
      if (filters.selectedGameId) {
        const selectedGame = games.find((g) => g.id === filters.selectedGameId);
        if (selectedGame) {
          const homeAbbr = selectedGame.homeTeam.abbreviation.toUpperCase();
          const awayAbbr = selectedGame.awayTeam.abbreviation.toUpperCase();
          const playerTeam = player.team.toUpperCase();
          if (playerTeam !== homeAbbr && playerTeam !== awayAbbr) {
            return false;
          }
        }
      }

      // 3. Position Focus Filter
      if (filters.positionFocus === 'GLR') {
        // Goal Line Rushers: RB with high goal line snap share or inside 10 volume
        if (player.position !== 'RB' || (player.goalLineSnapPercent ?? 0) < 70) return false;
      } else if (filters.positionFocus === 'RZ_ALPHA') {
        // RZ Target Alpha: WR or TE with significant RZ target share
        if ((player.position !== 'WR' && player.position !== 'TE') || player.rzTouchShare < 30) return false;
      } else if (filters.positionFocus === 'DUAL_QB') {
        // Dual-Threat QB
        if (player.position !== 'QB' || player.inside10Touches < 6) return false;
      } else if (filters.positionFocus !== 'ALL') {
        if (player.position !== filters.positionFocus) return false;
      }

      // 4. Collision Filters
      if (filters.rzTouchShareMin25 && player.rzTouchShare < 25) return false;
      if (filters.inside10TargetMin30 && player.inside10Touches < 8) return false;
      if (filters.oppRzDefBottom10 && player.oppRzDefRank < 23) return false; // Bottom 10 is rank 23-32
      if (filters.impliedTotalMin24_5 && player.impliedTeamTotal < 24.5) return false;
      if (filters.redZoneAlertOnly && !player.isRedZoneActive) return false;
      if (filters.positiveEdgeOnly && player.modelEdgePercent <= 10) return false;

      return true;
    });
  }, [players, filters, games]);

  // Slate Alpha Marquee Dossier (Top single projected touchdown player)
  const slateAlphaPlayer = useMemo(() => {
    if (players.length === 0) return null;
    return [...players].sort((a, b) => b.tdpiScore - a.tdpiScore)[0];
  }, [players]);

  // 4-Tier Partitioning of filtered players
  const tierPartition = useMemo(() => {
    const tiers: Record<PlayerTier, TouchdownPlayer[]> = {
      ELITE: [],
      STRONG: [],
      VALUE: [],
      SLEEPER: [],
    };

    for (const player of filteredPlayers) {
      tiers[player.tier].push(player);
    }

    // Sort each tier by tdpiScore descending
    tiers.ELITE.sort((a, b) => b.tdpiScore - a.tdpiScore);
    tiers.STRONG.sort((a, b) => b.tdpiScore - a.tdpiScore);
    tiers.VALUE.sort((a, b) => b.tdpiScore - a.tdpiScore);
    tiers.SLEEPER.sort((a, b) => b.tdpiScore - a.tdpiScore);

    return tiers;
  }, [filteredPlayers]);

  return {
    players: filteredPlayers,
    allPlayers: players,
    games,
    filters,
    updateFilter,
    resetFilters,
    applyPreset,
    selectGame,
    slateAlphaPlayer,
    tierPartition,
    boardConnection: slateQuery.isFetching && slateQuery.data
      ? 'refreshing' as const
      : slateQuery.data?.connection ?? (slateQuery.isError ? 'unavailable' as const : 'refreshing' as const),
    boardMeta: slateQuery.data ?? null,
    boardError: slateQuery.error,
    refreshBoard: slateQuery.refetch,
    liveThreats,
    selectedPlayerDossier,
    setSelectedPlayerDossier,
    openDossier: (player: TouchdownPlayer) => setSelectedPlayerDossier(player),
    closeDossier: () => setSelectedPlayerDossier(null),
    isLoading: slateQuery.isLoading && !slateQuery.data,
  };
}
