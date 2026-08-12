import { useSyncExternalStore } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  getPersistedAuthSession,
  isSupabaseConfigured,
  persistAuthSession,
  supabase,
} from "./supabaseClient";

export type AuthSessionStatus = "loading" | "authenticated" | "anonymous";

export interface AuthSessionSnapshot {
  status: AuthSessionStatus;
  session: Session | null;
}

const persistedSession = typeof window === "undefined" ? null : getPersistedAuthSession();
let snapshot: AuthSessionSnapshot = persistedSession
  ? { status: "authenticated", session: persistedSession }
  : { status: isSupabaseConfigured ? "loading" : "anonymous", session: null };
const listeners = new Set<() => void>();
let initialized = false;

function publish(next: AuthSessionSnapshot) {
  if (snapshot.status === next.status && snapshot.session === next.session) return;
  snapshot = next;
  listeners.forEach((listener) => listener());
}

function applySession(session: Session | null) {
  persistAuthSession(session);
  publish(session
    ? { status: "authenticated", session }
    : { status: "anonymous", session: null });
}

function initialize() {
  if (initialized || typeof window === "undefined" || !isSupabaseConfigured) return;
  initialized = true;
  let authEventReceived = false;

  // Keep this callback synchronous. Supabase warns that awaiting another auth
  // API inside it can deadlock subsequent session calls.
  supabase.auth.onAuthStateChange((_event, session) => {
    authEventReceived = true;
    applySession(session);
  });

  void supabase.auth.getSession().then(({ data, error }) => {
    if (authEventReceived) return;
    if (error) {
      publish(persistedSession
        ? { status: "authenticated", session: persistedSession }
        : { status: "anonymous", session: null });
      return;
    }
    applySession(data.session);
  });
}

export function getAuthSessionSnapshot(): AuthSessionSnapshot {
  initialize();
  return snapshot;
}

export function subscribeAuthSession(listener: () => void) {
  initialize();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const SERVER_SNAPSHOT: AuthSessionSnapshot = { status: "loading", session: null };

export function useAuthSession(): AuthSessionSnapshot {
  return useSyncExternalStore(subscribeAuthSession, getAuthSessionSnapshot, () => SERVER_SNAPSHOT);
}
