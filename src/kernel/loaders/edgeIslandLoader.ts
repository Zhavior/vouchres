import { vouchedgeApi } from '../../api/vouchedgeApi';
import { loadNotifications } from './notificationsLoader';


export async function loadEdgeIsland() {
  const [summary, board, notifications] = await Promise.all([
    vouchedgeApi.dailyReport(),
    vouchedgeApi.hrBoardToday(25),
    loadNotifications(),
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
