/**
 * App-wide notification store — lightweight, localStorage-backed, event-driven.
 *
 * Any module can call notify(...) to push a notification; the AppNotificationsHost
 * renders toasts and keeps a persistent list. Used by the parlay lifecycle:
 *   - "AI built today's parlays"
 *   - "Parlays locked → moved to Live Parlays"
 */

export type NotifKind = 'ai' | 'lock' | 'result' | 'success' | 'info';

export interface AppNotification {
  id: string;
  kind: NotifKind;
  title: string;
  body?: string;
  ts: string; // ISO
  read: boolean;
  /** Optional app section to navigate to when the notification is clicked. */
  section?: string;
}

const KEY = 'vouchedge_app_notifications';
const EVENT = 'vouchedge:notification';
const MAX = 50;

export function getNotifications(): AppNotification[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]') as AppNotification[];
  } catch {
    return [];
  }
}

function save(list: AppNotification[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
}

/** Push a notification. Returns the created record. */
export function notify(input: { kind: NotifKind; title: string; body?: string; section?: string; dedupeKey?: string }): AppNotification {
  const existing = input.dedupeKey
    ? getNotifications().find((item) => item.id === `n-${input.dedupeKey}`)
    : undefined;
  if (existing) return existing;
  const n: AppNotification = {
    id: input.dedupeKey ? `n-${input.dedupeKey}` : `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    kind: input.kind,
    title: input.title,
    body: input.body,
    ts: new Date().toISOString(),
    read: false,
    section: input.section,
  };
  const list = [n, ...getNotifications()];
  save(list);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EVENT, { detail: n }));
  }
  return n;
}

export function markAllRead(): AppNotification[] {
  const list = getNotifications().map((n) => ({ ...n, read: true }));
  save(list);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(EVENT, { detail: null }));
  return list;
}

export function markNotificationRead(id: string): AppNotification[] {
  const list = getNotifications().map((notification) =>
    notification.id === id ? { ...notification, read: true } : notification,
  );
  save(list);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(EVENT, { detail: null }));
  return list;
}

export function clearNotifications(): void {
  save([]);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(EVENT, { detail: null }));
}

export function unreadCount(): number {
  return getNotifications().filter((n) => !n.read).length;
}

/** Subscribe to notification changes. Returns an unsubscribe fn. */
export function onNotification(handler: (n: AppNotification | null) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const listener = (e: Event) => handler((e as CustomEvent).detail as AppNotification | null);
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}
