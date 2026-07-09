import { apiClient } from "./apiClient";

export async function fetchNotificationsSafe() {
  try {
    const data = await apiClient.get<unknown[]>("/api/notifications");
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    if (Number(error?.status) === 401) return [];
    return [];
  }
}
