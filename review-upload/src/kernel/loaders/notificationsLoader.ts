import { apiClient } from '../../lib/apiClient';

export async function loadNotifications(): Promise<unknown[]> {
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
