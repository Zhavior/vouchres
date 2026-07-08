import { vouchedgeApi } from '../../api/vouchedgeApi';
import { apiClient } from '../../lib/apiClient';

async function fetchNotifications(): Promise<unknown[]> {
  try {
    const payload = await apiClient.get<{
      notifications?: unknown[];
      items?: unknown[];
    }>('/api/notifications');

    return payload.notifications ?? payload.items ?? [];
  } catch {
    return [];
  }
}

export async function loadEdgeIsland() {
  const [summary, board, notifications] = await Promise.all([
    vouchedgeApi.dailyReport(),
    vouchedgeApi.hrBoardToday(25),
    fetchNotifications(),
  ]);

  return {
    summary,
    favorites: [],
    hrBoard:
      board?.rows ??
      (board as { data?: { rows?: unknown[] } } | undefined)?.data?.rows ??
      [],
    notifications,
    meta: {
      loadedAt: new Date().toISOString(),
    },
  };
}
