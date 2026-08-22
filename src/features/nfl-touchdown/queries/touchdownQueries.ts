import { queryOptions } from '@tanstack/react-query';
import { apiClient } from '../../../lib/apiClient';
import type { LiveThreatEvent, TdBoardV2Response, TouchdownPlayer } from '../../../types/touchdown';

export type TouchdownSlateResponse = {
  success: boolean;
  totalPlayers?: number;
  players: TouchdownPlayer[];
};

export type LiveThreatsResponse = {
  success: boolean;
  data: LiveThreatEvent[];
};

export const tdBoardV2QueryOptions = () => queryOptions({
  queryKey: ['nfl', 'td-board', 'v2', 'today'] as const,
  queryFn: ({ signal }) => apiClient.get<TdBoardV2Response>(
    '/api/nfl/td-board/v2',
    { limit: 48 },
    signal,
  ),
  staleTime: 60_000,
  gcTime: 15 * 60_000,
  refetchInterval: 60_000,
  refetchOnMount: false,
  refetchOnReconnect: true,
  retry: 1,
});

export const touchdownSlateQueryOptions = () => queryOptions({
  queryKey: ['nfl', 'touchdown-slate', 'today'] as const,
  queryFn: ({ signal }) => apiClient.get<TouchdownSlateResponse>(
    '/api/nfl/touchdown-slate',
    undefined,
    signal,
  ),
  staleTime: 60_000,
  gcTime: 15 * 60_000,
  refetchInterval: 60_000,
  refetchOnMount: false,
  refetchOnReconnect: true,
  retry: 1,
});

export const liveThreatsQueryOptions = () => queryOptions({
  queryKey: ['nfl', 'live-threats'] as const,
  queryFn: ({ signal }) => apiClient.get<LiveThreatsResponse>(
    '/api/nfl/live-threats',
    undefined,
    signal,
  ),
  staleTime: 10_000,
  gcTime: 5 * 60_000,
  refetchInterval: 15_000,
  refetchOnMount: false,
  refetchOnReconnect: true,
  retry: 1,
});
