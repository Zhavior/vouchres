/**
 * Browser Web Push client — pairs with
 * POST /api/notifications/push/subscribe|unsubscribe and optional VAPID public key.
 */
import { apiClient } from './apiClient';
import { apiUrl } from './apiBase';

const PUSH_PREF_KEY = 'vouchedge_push_alerts';

export type PushSubscribeResult = {
  ok: boolean;
  warning?: string;
  configured?: boolean;
};

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export function getLocalPushPref(): boolean {
  try {
    return localStorage.getItem(PUSH_PREF_KEY) !== 'false';
  } catch {
    return true;
  }
}

export function setLocalPushPref(enabled: boolean) {
  try {
    localStorage.setItem(PUSH_PREF_KEY, enabled ? 'true' : 'false');
  } catch {
    // ignore quota / private mode
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

export async function fetchVapidPublicKey(): Promise<{ publicKey: string; configured: boolean }> {
  const fromEnv = String(import.meta.env.VITE_VAPID_PUBLIC_KEY ?? '').trim();
  if (fromEnv) return { publicKey: fromEnv, configured: true };

  const response = await fetch(apiUrl('/api/notifications/push/vapid-public-key'), {
    credentials: 'same-origin',
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    return { publicKey: '', configured: false };
  }
  const body = (await response.json()) as {
    publicKey?: string;
    configured?: boolean;
    data?: { publicKey?: string; configured?: boolean };
  };
  const publicKey = String(body.publicKey ?? body.data?.publicKey ?? '').trim();
  const configured = Boolean(body.configured ?? body.data?.configured ?? publicKey);
  return { publicKey, configured };
}

export async function subscribeToPush(): Promise<PushSubscribeResult> {
  if (!isPushSupported()) {
    return { ok: false, warning: 'Push notifications are not supported in this browser.' };
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    setLocalPushPref(false);
    return { ok: false, warning: 'Notification permission was denied.' };
  }

  const { publicKey, configured } = await fetchVapidPublicKey();
  if (!publicKey) {
    setLocalPushPref(false);
    return {
      ok: false,
      configured: false,
      warning: 'Push is not configured on the server yet (missing VAPID public key).',
    };
  }

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
  });

  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    return { ok: false, warning: 'Browser returned an incomplete push subscription.' };
  }

  await apiClient.post('/api/notifications/push/subscribe', {
    endpoint: json.endpoint,
    keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
  });

  await apiClient.patch('/api/notification-preferences', { browser_push_enabled: true }).catch(() => undefined);

  setLocalPushPref(true);
  return { ok: true, configured, warning: configured ? undefined : 'Subscription saved; server VAPID may still be incomplete.' };
}

export async function unsubscribeFromPush(): Promise<PushSubscribeResult> {
  if (!isPushSupported()) {
    setLocalPushPref(false);
    return { ok: true, warning: 'Push not supported; preference cleared locally.' };
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe().catch(() => undefined);
      if (endpoint) {
        await apiClient.post('/api/notifications/push/unsubscribe', { endpoint }).catch(() => undefined);
      }
    }
  } catch {
    // still clear preference
  }

  await apiClient.patch('/api/notification-preferences', { browser_push_enabled: false }).catch(() => undefined);
  setLocalPushPref(false);
  return { ok: true };
}
