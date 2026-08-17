import { useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  clearNotifications,
  getNotifications,
  markAllRead as markAllLocalRead,
  onNotification,
  type AppNotification as LocalAppNotification,
} from '../../lib/appNotifications';
import { apiClient } from '../../lib/apiClient';
import { ensureRealtimeAuth, supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../lib/useAuth';
import { queryKeys } from './queryKeys';
import { visibilityAwareInterval } from '../../lib/queryVisibility';

type ServerNotificationType =
  | 'HOME_RUN'
  | 'PARLAY_GRADED'
  | 'PARLAY_LEG_SETTLED'
  | 'NEW_FOLLOWER'
  | 'FOLLOWED_POST'
  | 'PARLAY_TAILED'
  | string;

type ServerNotificationRecord = {
  id: string;
  type: ServerNotificationType;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
};

export type ActivityNotificationKind = 'ai' | 'lock' | 'result' | 'success' | 'info';
export type ActivityNotificationSource = 'local' | 'server';

export interface ActivityNotification {
  id: string;
  kind: ActivityNotificationKind;
  title: string;
  body?: string;
  ts: string;
  read: boolean;
  section?: string;
  source: ActivityNotificationSource;
  typeLabel: string;
  rawType: string;
}

function mapServerNotificationKind(type: ServerNotificationType): ActivityNotificationKind {
  if (type === 'PARLAY_GRADED' || type === 'PARLAY_LEG_SETTLED') return 'result';
  if (type === 'PARLAY_TAILED' || type === 'NEW_FOLLOWER' || type === 'FOLLOWED_POST') return 'success';
  return 'info';
}

function mapServerNotificationSection(type: ServerNotificationType, metadata?: Record<string, unknown>): string | undefined {
  if (type === 'PARLAY_GRADED' || type === 'PARLAY_LEG_SETTLED' || type === 'PARLAY_TAILED') return 'parlayos';
  if (type === 'NEW_FOLLOWER' || type === 'FOLLOWED_POST') return 'following';
  if (type === 'HOME_RUN' && metadata?.playerId) return 'hr';
  return 'notifications';
}

function mapServerNotificationLabel(type: ServerNotificationType): string {
  if (type === 'PARLAY_GRADED') return 'Parlay graded';
  if (type === 'PARLAY_LEG_SETTLED') return 'Pick graded';
  if (type === 'PARLAY_TAILED') return 'Parlay tailed';
  if (type === 'NEW_FOLLOWER') return 'New follower';
  if (type === 'FOLLOWED_POST') return 'Following activity';
  if (type === 'HOME_RUN') return 'Home run alert';
  return 'Activity';
}

function normalizeLocalNotification(notification: LocalAppNotification): ActivityNotification {
  return {
    id: notification.id,
    kind: notification.kind,
    title: notification.title,
    body: notification.body,
    ts: notification.ts,
    read: notification.read,
    section: notification.section,
    source: 'local',
    typeLabel: 'Local alert',
    rawType: notification.kind,
  };
}

function normalizeServerNotification(notification: ServerNotificationRecord): ActivityNotification {
  return {
    id: notification.id,
    kind: mapServerNotificationKind(notification.type),
    title: notification.title,
    body: notification.message,
    ts: notification.created_at,
    read: Boolean(notification.read_at),
    section: mapServerNotificationSection(notification.type, notification.metadata),
    source: 'server',
    typeLabel: mapServerNotificationLabel(notification.type),
    rawType: notification.type,
  };
}

type NotificationsSnapshot = {
  items: ActivityNotification[];
  /**
   * Server-side unread total. The list request is capped at 50, so counting
   * unread rows in `items` undercounts once a user is past that — the server
   * already returns the true total alongside the page, so use it.
   * Null means the server count is unavailable (offline/401) and the caller
   * should fall back to counting what it has.
   */
  serverUnreadCount: number | null;
};

async function readNotifications(): Promise<NotificationsSnapshot> {
  const local = getNotifications().map(normalizeLocalNotification);
  try {
    const payload = await apiClient.get<{
      notifications?: ServerNotificationRecord[];
      unreadCount?: number;
    }>('/api/notifications');
    const server = (payload.notifications ?? []).map(normalizeServerNotification);
    return {
      items: [...server, ...local].sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime()),
      serverUnreadCount: typeof payload.unreadCount === 'number' ? payload.unreadCount : null,
    };
  } catch {
    return { items: local, serverUnreadCount: null };
  }
}

export function useAppNotifications() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    return onNotification(() => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.appNotifications() });
    });
  }, [queryClient]);

  useEffect(() => {
    if (!user?.id) return;

    let disposed = false;
    const channel = supabase.channel(`notifications:${user.id}`);

    void ensureRealtimeAuth().catch(() => undefined);

    channel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => {
          if (disposed) return;
          void queryClient.invalidateQueries({ queryKey: queryKeys.appNotifications() });
        },
      )
      .subscribe();

    return () => {
      disposed = true;
      void supabase.removeChannel(channel);
    };
  }, [queryClient, user?.id]);

  const markAllRead = useCallback(async () => {
    markAllLocalRead();
    if (user?.id) {
      await apiClient.post('/api/notifications/read-all', {}).catch(() => undefined);
    }
    await queryClient.invalidateQueries({ queryKey: queryKeys.appNotifications() });
  }, [queryClient, user?.id]);

  const clearLocal = useCallback(async () => {
    clearNotifications();
    await queryClient.invalidateQueries({ queryKey: queryKeys.appNotifications() });
  }, [queryClient]);

  const query = useQuery({
    queryKey: queryKeys.appNotifications(),
    queryFn: readNotifications,
    staleTime: 45_000,
    gcTime: 5 * 60_000,
    // Realtime invalidation is primary; polling is a slow visible-tab fallback.
    refetchInterval: visibilityAwareInterval(user?.id ? 90_000 : false),
  });

  const items = query.data?.items ?? [];
  const localUnread = items.filter((n) => n.source === 'local' && !n.read).length;
  const serverUnread = query.data?.serverUnreadCount;

  return {
    ...query,
    data: items,
    unreadCount:
      typeof serverUnread === 'number'
        ? serverUnread + localUnread
        : items.filter((notification) => !notification.read).length,
    markAllRead,
    clearLocal,
  };
}
