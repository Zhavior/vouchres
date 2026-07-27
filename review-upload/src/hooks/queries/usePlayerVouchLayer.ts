import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import { queryKeys } from './queryKeys';

export interface PlayerVouchSummary {
  playerId: string;
  playerName: string;
  team: string | null;
  opponent: string | null;
  gamePk: string | null;
  totalVouches: number;
  viewerHasVouched: boolean;
}

async function fetchPlayerVouchSummary(date: string, playerIds: string[]): Promise<PlayerVouchSummary[]> {
  if (playerIds.length === 0) return [];
  const result = await apiClient.get<{ summaries: PlayerVouchSummary[] }>('/api/player-vouches/summary', {
    date,
    playerIds: playerIds.join(','),
  });
  return result.summaries ?? [];
}

async function fetchPlayerVouchLeaderboard(date: string, limit: number): Promise<PlayerVouchSummary[]> {
  const result = await apiClient.get<{ players: PlayerVouchSummary[] }>('/api/player-vouches/leaderboard', {
    date,
    limit,
  });
  return result.players ?? [];
}

export function usePlayerVouchSummary(date: string, playerIds: Array<string | number | null | undefined>) {
  const normalizedIds = useMemo(
    () => Array.from(new Set(playerIds.map((value) => String(value ?? '').trim()).filter(Boolean))),
    [playerIds],
  );

  return useQuery({
    queryKey: queryKeys.playerVouchSummary(date, normalizedIds.join('|')),
    queryFn: () => fetchPlayerVouchSummary(date, normalizedIds),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    enabled: normalizedIds.length > 0,
  });
}

export function usePlayerVouchLeaderboard(date: string, limit = 6) {
  return useQuery({
    queryKey: queryKeys.playerVouchLeaderboard(date, limit),
    queryFn: () => fetchPlayerVouchLeaderboard(date, limit),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}

export function useTogglePlayerVouch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      playerId: string | number;
      playerName: string;
      team?: string | null;
      opponent?: string | null;
      gamePk?: string | number | null;
      contextDate: string;
      sourcePage?: string | null;
    }) => apiClient.post<{
      vouched: boolean;
      totalVouches: number;
    }>('/api/player-vouches/toggle', {
      player_id: input.playerId,
      player_name: input.playerName,
      team: input.team ?? null,
      opponent: input.opponent ?? null,
      game_pk: input.gamePk ?? null,
      context_date: input.contextDate,
      source_page: input.sourcePage ?? null,
    }),
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.playerVouchSummaryPrefix(variables.contextDate) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.playerVouchLeaderboardPrefix(variables.contextDate) });
    },
  });
}
