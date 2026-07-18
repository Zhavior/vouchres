import { useEffect, useState } from 'react';
import { fetchRealGameLog, type RealGameLog } from '../utils/realGameLogs';

export type RealGameLogState = 'idle' | 'loading' | 'ready' | 'unavailable';

/** Session cache — only the selected research player fetches; reopen is instant. */
const gameLogCache = new Map<string, RealGameLog[] | null>();
const inflight = new Map<string, Promise<RealGameLog[] | null>>();

function cacheKey(playerId: string | number): string {
  return String(playerId);
}

async function loadGameLog(playerId: string | number): Promise<RealGameLog[] | null> {
  const key = cacheKey(playerId);
  if (gameLogCache.has(key)) return gameLogCache.get(key) ?? null;

  const existing = inflight.get(key);
  if (existing) return existing;

  const request = fetchRealGameLog(playerId).then((data) => {
    const value = data && data.length > 0 ? data : null;
    gameLogCache.set(key, value);
    inflight.delete(key);
    return value;
  });

  inflight.set(key, request);
  return request;
}

/**
 * Loads real MLB game logs for a single player when enabled (profile open).
 * Does not prefetch the rest of the board — keeps HR research fast.
 */
export function useRealGameLog(
  playerId: string | number | null | undefined,
  enabled: boolean,
): { logs: RealGameLog[] | null; state: RealGameLogState } {
  const [logs, setLogs] = useState<RealGameLog[] | null>(() => {
    if (!enabled || playerId == null) return null;
    return gameLogCache.has(cacheKey(playerId)) ? (gameLogCache.get(cacheKey(playerId)) ?? null) : null;
  });
  const [state, setState] = useState<RealGameLogState>(() => {
    if (!enabled || playerId == null) return 'idle';
    if (!gameLogCache.has(cacheKey(playerId))) return 'loading';
    return gameLogCache.get(cacheKey(playerId)) ? 'ready' : 'unavailable';
  });

  useEffect(() => {
    if (!enabled || playerId == null) {
      setLogs(null);
      setState('idle');
      return;
    }

    const key = cacheKey(playerId);
    if (gameLogCache.has(key)) {
      const cached = gameLogCache.get(key) ?? null;
      setLogs(cached);
      setState(cached ? 'ready' : 'unavailable');
      return;
    }

    let alive = true;
    setState('loading');

    loadGameLog(playerId).then((data) => {
      if (!alive) return;
      setLogs(data);
      setState(data ? 'ready' : 'unavailable');
    });

    return () => {
      alive = false;
    };
  }, [enabled, playerId]);

  return { logs, state };
}
