import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { vouchedgeApi } from '../../../api/vouchedgeApi';
import { loadNotifications } from '../../../kernel/loaders/notificationsLoader';
import { queryKeys } from '../../../hooks/queries/queryKeys';
import type { EdgeIslandData } from '../types/edgeIslandData';


export function useEdgeIslandData() {
  const [reportQuery, boardQuery, notificationsQuery] = useQueries({
    queries: [
      {
        queryKey: queryKeys.dailyReport(),
        queryFn: () => vouchedgeApi.dailyReport(),
        staleTime: 60_000,
      },
      {
        queryKey: queryKeys.hrBoardToday(25),
        queryFn: () => vouchedgeApi.hrBoardToday(25),
        staleTime: 60_000,
      },
      {
        queryKey: ['notifications'] as const,
        queryFn: loadNotifications,
        staleTime: 30_000,
      },
    ],
  });

  const data = useMemo<EdgeIslandData | null>(() => {
    if (!reportQuery.data && !boardQuery.data && !notificationsQuery.data) {
      return null;
    }

    const board = boardQuery.data;
    return {
      summary: reportQuery.data ?? null,
      favorites: [],
      hrBoard: board?.rows ?? (board as { data?: { rows?: unknown[] } } | undefined)?.data?.rows ?? [],
      notifications: notificationsQuery.data ?? [],
      meta: {
        loadedAt: new Date().toISOString(),
      },
    };
  }, [reportQuery.data, boardQuery.data, notificationsQuery.data]);

  const loading = reportQuery.isLoading || boardQuery.isLoading || notificationsQuery.isLoading;
  const error =
    reportQuery.error?.message ??
    boardQuery.error?.message ??
    notificationsQuery.error?.message ??
    null;

  return { data, loading, error };
}
