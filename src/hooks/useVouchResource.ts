import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type CacheEntry<T> = {
  data: T;
  ts: number;
};

const resourceCache = new Map<string, CacheEntry<unknown>>();
const inflightCache = new Map<string, Promise<unknown>>();

function getFresh<T>(key: string, staleMs: number | null): CacheEntry<T> | null {
  const cached = resourceCache.get(key) as CacheEntry<T> | undefined;
  if (!cached) return null;
  if (staleMs == null) return cached;
  return Date.now() - cached.ts <= staleMs ? cached : null;
}

export type UseVouchResourceOptions<T> = {
  cacheKey: string;
  enabled?: boolean;
  refreshMs?: number | null;
  staleMs?: number | null;
  fetcher: () => Promise<T>;
};

export type UseVouchResourceResult<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
};

export function useVouchResource<T>({
  cacheKey,
  enabled = true,
  refreshMs = null,
  staleMs = null,
  fetcher,
}: UseVouchResourceOptions<T>): UseVouchResourceResult<T> {
  const mountedRef = useRef(true);
  const fetcherRef = useRef(fetcher);

  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  const initial = getFresh<T>(cacheKey, staleMs);

  const [data, setData] = useState<T | null>(initial?.data ?? null);
  const [loading, setLoading] = useState<boolean>(!initial);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(
    initial ? new Date(initial.ts) : null
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const cached = getFresh<T>(cacheKey, staleMs);

    if (cached) {
      setData(cached.data);
      setLoading(false);
      setError(null);
      setLastUpdated(new Date(cached.ts));
      return;
    }

    setData(null);
    setLoading(true);
    setError(null);
    setLastUpdated(null);
  }, [cacheKey, staleMs]);

  const refresh = useCallback(async () => {
    if (!enabled) return;

    const cached = getFresh<T>(cacheKey, staleMs);
    if (cached) {
      if (mountedRef.current) {
        setData(cached.data);
        setLastUpdated(new Date(cached.ts));
        setLoading(false);
      }
      return;
    }

    if (mountedRef.current) {
      setLoading(true);
      setError(null);
    }

    const existing = inflightCache.get(cacheKey) as Promise<T> | undefined;
    const promise = existing ?? fetcherRef.current();

    if (!existing) inflightCache.set(cacheKey, promise);

    try {
      const next = await promise;
      const entry = { data: next, ts: Date.now() };
      resourceCache.set(cacheKey, entry);

      if (!mountedRef.current) return;
      setData(next);
      setLastUpdated(new Date(entry.ts));
    } catch {
      if (!mountedRef.current) return;
      setError('Data unavailable right now.');
    } finally {
      if (inflightCache.get(cacheKey) === promise) inflightCache.delete(cacheKey);
      if (mountedRef.current) setLoading(false);
    }
  }, [cacheKey, enabled, staleMs]);

  useEffect(() => {
    if (!enabled) return;

    void refresh();

    if (refreshMs == null) return;

    const id = window.setInterval(() => {
      void refresh();
    }, refreshMs);

    return () => window.clearInterval(id);
  }, [enabled, refresh, refreshMs]);

  return useMemo(
    () => ({ data, loading, error, lastUpdated, refresh }),
    [data, loading, error, lastUpdated, refresh]
  );
}
