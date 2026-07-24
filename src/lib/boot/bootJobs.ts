import { apiClient } from "../apiClient";
import { bootDataStore, type VouchEdgeBootKey } from "./bootDataStore";

export type VouchEdgeBootJob = {
  id: VouchEdgeBootKey;
  label: string;
  feature: string;
  required: boolean;
  weight: number;
  timeoutMs: number;
  run: (signal: AbortSignal) => Promise<unknown>;
};

const bootFetchInFlight = new Map<string, Promise<unknown>>();

async function fetchJson(path: string, signal: AbortSignal): Promise<unknown> {
  const existing = bootFetchInFlight.get(path);
  if (existing) return existing;

  const request = apiClient
    .get(path, undefined, signal)
    .finally(() => {
      bootFetchInFlight.delete(path);
    });

  bootFetchInFlight.set(path, request);
  return request;
}

async function runAndCache(
  key: VouchEdgeBootKey,
  path: string,
  signal: AbortSignal
): Promise<unknown> {
  const data = await fetchJson(path, signal);
  bootDataStore.set(key, data);
  return data;
}

const LINEUP_TODAY_PATH = "/api/mlb/lineup/today";
const HR_BOARD_TODAY_PATH = "/api/mlb/hr-board/today?previewLimit=120";

async function lineupTodayShared(signal: AbortSignal): Promise<unknown> {
  if (bootDataStore.has("lineupToday")) {
    return bootDataStore.get("lineupToday");
  }
  return runAndCache("lineupToday", LINEUP_TODAY_PATH, signal);
}

async function hrBoardTodayShared(signal: AbortSignal): Promise<unknown> {
  if (bootDataStore.has("dailyHrBoard")) {
    return bootDataStore.get("dailyHrBoard");
  }
  return runAndCache("dailyHrBoard", HR_BOARD_TODAY_PATH, signal);
}

/** Required boot jobs only — optional warmups run after first paint via idle. */
export const vouchEdgeBootJobs: VouchEdgeBootJob[] = [
  {
    id: "lineupToday",
    label: "Syncing today’s MLB slate",
    feature: "Daily slate",
    required: true,
    weight: 28,
    timeoutMs: 4500,
    run: (signal) => lineupTodayShared(signal),
  },
  {
    id: "dailyPlayers",
    label: "Loading Daily Players intelligence",
    feature: "Daily Players",
    required: true,
    weight: 18,
    timeoutMs: 4500,
    run: async (signal) => {
      const data = await lineupTodayShared(signal);
      bootDataStore.set("dailyPlayers", data);
      return data;
    },
  },
  {
    id: "dailyHrBoard",
    label: "Warming HR board signals",
    feature: "Daily HR Board",
    required: true,
    weight: 24,
    timeoutMs: 5500,
    run: (signal) => hrBoardTodayShared(signal),
  },
  {
    id: "savedParlays",
    label: "Checking saved parlays",
    feature: "ParlayOS",
    required: true,
    weight: 15,
    timeoutMs: 3500,
    run: (signal) => runAndCache("savedParlays", "/api/v3/me/parlays", signal),
  },
  {
    id: "notifications",
    label: "Scanning VouchEdge notifications",
    feature: "Notifications",
    required: true,
    weight: 15,
    timeoutMs: 3500,
    run: async (signal) => {
      try {
        return await runAndCache("notifications", "/api/notifications", signal);
      } catch {
        return [];
      }
    },
  },
];

/** Optional post-boot warmups — never block Island entry. */
export const vouchEdgeIdleBootJobs: VouchEdgeBootJob[] = [
  {
    id: "playerRegistryCount",
    label: "Warming player research registry",
    feature: "Player Research",
    required: false,
    weight: 12,
    timeoutMs: 6500,
    run: (signal) => runAndCache("playerRegistryCount", "/api/mlb/players/count", signal),
  },
  {
    id: "liveGamesSummary",
    label: "Preparing Live Games",
    feature: "Live Games",
    required: false,
    weight: 10,
    timeoutMs: 6500,
    run: async (signal) => {
      const data = await hrBoardTodayShared(signal);
      bootDataStore.set("liveGamesSummary", data);
      return data;
    },
  },
];
