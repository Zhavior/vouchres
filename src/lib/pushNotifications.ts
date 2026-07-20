import { apiClient } from './apiClient';
import { registerServiceWorker } from './registerServiceWorker';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration> {
  await registerServiceWorker();
  const registration = await navigator.serviceWorker.ready;
  if (!registration) {
    throw new Error('Service worker registration is unavailable.');
  }
  return registration;
}

export async function enableBrowserPush(): Promise<void> {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    throw new Error('This browser does not support push notifications.');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission was not granted.');
  }

  const registration = await getServiceWorkerRegistration();
  const { publicKey, configured } = await apiClient.get<{ publicKey?: string | null; configured?: boolean }>(
    '/api/notifications/push/public-key',
  );

  if (!configured || !publicKey) {
    throw new Error('Push delivery is not configured on the server yet.');
  }

  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    }));

  const payload = subscription.toJSON();
  if (!payload.endpoint || !payload.keys?.p256dh || !payload.keys?.auth) {
    throw new Error('Push subscription payload is incomplete.');
  }

  await apiClient.post('/api/notifications/push/subscribe', {
    endpoint: payload.endpoint,
    keys: {
      p256dh: payload.keys.p256dh,
      auth: payload.keys.auth,
    },
  });

  await apiClient.patch('/api/notification-preferences', { browser_push_enabled: true });
}

export async function disableBrowserPush(): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    await apiClient.patch('/api/notification-preferences', { browser_push_enabled: false });
    return;
  }

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (subscription?.endpoint) {
    await apiClient.post('/api/notifications/push/unsubscribe', {
      endpoint: subscription.endpoint,
    }).catch(() => undefined);
    await subscription.unsubscribe().catch(() => undefined);
  }

  await apiClient.patch('/api/notification-preferences', { browser_push_enabled: false });
}
