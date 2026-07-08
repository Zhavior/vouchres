export type VouchEdgeBootKey =
  | "lineupToday"
  | "dailyPlayers"
  | "dailyHrBoard"
  | "savedParlays"
  | "notifications"
  | "playerRegistryCount"
  | "liveGamesSummary";

type BootCacheRecord = {
  value: unknown;
  updatedAt: number;
};

const bootCache = new Map<VouchEdgeBootKey, BootCacheRecord>();

export const bootDataStore = {
  set<T>(key: VouchEdgeBootKey, value: T) {
    bootCache.set(key, {
      value,
      updatedAt: Date.now(),
    });
  },

  get<T>(key: VouchEdgeBootKey): T | undefined {
    return bootCache.get(key)?.value as T | undefined;
  },

  has(key: VouchEdgeBootKey): boolean {
    return bootCache.has(key);
  },

  getUpdatedAt(key: VouchEdgeBootKey): number | undefined {
    return bootCache.get(key)?.updatedAt;
  },

  clear() {
    bootCache.clear();
  },
};
