// Notifications API service
import { api } from "@/lib/api";

export interface NotificationItem {
  id: string;
  type: string;
  payload: any;
  read_at: string | null;
  created_at: string;
}

export const notificationsApi = {
  list: async (params?: { unread_only?: boolean; limit?: number }): Promise<{
    data: NotificationItem[];
    meta: any;
  }> => {
    const r = await api.get("/notifications", { params });
    return r.data;
  },

  unreadCount: async (): Promise<number> => {
    const r = await api.get("/notifications/unread-count");
    return r.data.unread_count;
  },

  markRead: async (notificationId: string): Promise<void> => {
    await api.post(`/notifications/${notificationId}/read`);
  },

  markAllRead: async (): Promise<number> => {
    const r = await api.post("/notifications/read-all");
    return r.data.marked_read;
  },
};
