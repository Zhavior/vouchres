import { apiUrl } from "./apiBase";

export async function fetchNotificationsSafe() {
  try {
    const res = await fetch(apiUrl("/api/notifications"), {
      credentials: "include",
      headers: { Accept: "application/json" },
    });

    if (res.status === 401) return [];
    if (!res.ok) throw new Error(`Notifications failed: ${res.status}`);

    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
