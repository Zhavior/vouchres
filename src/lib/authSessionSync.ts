/**
 * Reactive auth session signal for app chrome.
 * Bridges localStorage/Supabase token helpers into React via useSyncExternalStore
 * so login/logout re-renders the shell without remount races.
 */
import { useSyncExternalStore } from 'react';
import { hasRealAuthToken } from '../app/sectionNavigation';

export const AUTH_SESSION_EVENT = 'vouchedge:auth-session-changed';

let snapshot = typeof window !== 'undefined' ? hasRealAuthToken() : false;
const listeners = new Set<() => void>();

function emit() {
  snapshot = typeof window !== 'undefined' ? hasRealAuthToken() : false;
  listeners.forEach((listener) => listener());
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AUTH_SESSION_EVENT));
  }
}

/** Call after token persist or clear so chrome/nav re-evaluate isLoggedIn. */
export function notifyAuthSessionChanged(): void {
  emit();
}

function subscribe(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);

  const onWindow = () => {
    snapshot = hasRealAuthToken();
    onStoreChange();
  };

  if (typeof window !== 'undefined') {
    window.addEventListener(AUTH_SESSION_EVENT, onWindow);
    window.addEventListener('storage', onWindow);
  }

  return () => {
    listeners.delete(onStoreChange);
    if (typeof window !== 'undefined') {
      window.removeEventListener(AUTH_SESSION_EVENT, onWindow);
      window.removeEventListener('storage', onWindow);
    }
  };
}

function getSnapshot(): boolean {
  return snapshot;
}

function getServerSnapshot(): boolean {
  return false;
}

/** Refresh cached snapshot (e.g. after storage writes in the same tick). */
export function refreshAuthSessionSnapshot(): boolean {
  snapshot = typeof window !== 'undefined' ? hasRealAuthToken() : false;
  return snapshot;
}

export function useIsLoggedIn(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
