import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type CacheEntry<T> = {
  data: T;
  ts: number;
};

const resourceCache = new Map<string, CacheEntry<unknown>>();

type UseVouchResourceOptions<T> = {
  cacheKey: string;
  enabled?: boolean;
  refreshMs?: number | null;
  staleMs?: number;
  fetcher: () => Promise<T>;
};

export function useVouchResource<T>({
  cacheKey,
  enabled = true,
  refreshMs = null,
  staleMs = 120_000,
  fetcher,
}: UseVouchResourceOptions<T>) {
  const cached = resourceCache.get(cacheKey) as CacheEntry<T> | undefined;

  const [data, setData] = useState<T | null>(() => cached?.data ?? null);
  const [loading, setLoading] = useState(() => enabled && !cached);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(() =>
    cached ? new Date(cached.ts) : null
  );

  const inFlightRef = useRef<Promise<T> | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return null;

    const current = resourceCache.get(cacheKey) as CacheEntry<T> | undefined;
    if (current && Date.now() - current.ts < staleMs) {
      setData(current.data);
      setLastUpdated(new Date(current.ts));
      setLoading(false);
      return current.data;
    }

    if (inFlightRef.current) return inFlightRef.current;

    setLoading(true);
    setError(null);

    const request = fetcher()
      .then((result) => {
        const ts = Date.now();
        resourceCache.set(cacheKey, { data: result, ts });
        setData(result);
        setLastUpdated(new Date(ts));
        return result;
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to load resource");
        throw err;
      })
      .finally(() => {
        setLoading(false);
        inFlightRef.current = null;
      });

    inFlightRef.current = request;
    return request;
  }, [cacheKey, enabled, fetcher, staleMs]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!enabled || refreshMs == null || refreshMs <= 0) return;

    const id = window.setInterval(() => {
      void refresh();
    }, refreshMs);

    return () => window.clearInterval(id);
  }, [enabled, refresh, refreshMs]);

  return useMemo(
    () => ({
      data,
      loading,
      error,
      lastUpdated,
      refresh,
    }),
    [data, loading, error, lastUpdated, refresh]
  );
}
