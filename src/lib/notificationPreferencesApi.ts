import { apiClient } from './apiClient';

export type NotificationPreferences = {
  in_app_enabled: boolean;
  hr_alerts_enabled: boolean;
  parlay_alerts_enabled: boolean;
  browser_push_enabled: boolean;
};

export async function fetchNotificationPreferences(): Promise<NotificationPreferences> {
  const raw = await apiClient.get<NotificationPreferences & { warnings?: string[] }>(
    '/api/notifications/preferences',
  );
  return {
    in_app_enabled: raw.in_app_enabled ?? true,
    hr_alerts_enabled: raw.hr_alerts_enabled ?? true,
    parlay_alerts_enabled: raw.parlay_alerts_enabled ?? true,
    browser_push_enabled: raw.browser_push_enabled ?? false,
  };
}

export async function updateNotificationPreferences(
  partial: Partial<NotificationPreferences>,
): Promise<NotificationPreferences> {
  const raw = await apiClient.patch<NotificationPreferences>(
    '/api/notifications/preferences',
    partial,
  );
  return {
    in_app_enabled: raw.in_app_enabled ?? true,
    hr_alerts_enabled: raw.hr_alerts_enabled ?? true,
    parlay_alerts_enabled: raw.parlay_alerts_enabled ?? true,
    browser_push_enabled: raw.browser_push_enabled ?? false,
  };
}
