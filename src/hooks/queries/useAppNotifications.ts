import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { getNotifications, onNotification, type AppNotification } from '../../lib/appNotifications';
import { queryKeys } from './queryKeys';

function readNotifications(): AppNotification[] {
  return getNotifications();
}

/** Local notification list — deduped via TanStack Query, refreshed on push events. */
export function useAppNotifications() {
  const queryClient = useQueryClient();

  useEffect(() => {
    return onNotification(() => {
      queryClient.setQueryData(queryKeys.appNotifications(), readNotifications());
    });
  }, [queryClient]);

  return useQuery({
    queryKey: queryKeys.appNotifications(),
    queryFn: readNotifications,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}
