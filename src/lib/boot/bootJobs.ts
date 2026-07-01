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

async function fetchJson(path: string, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(path, {
    credentials: "include",
    signal,
  });

  if (!response.ok) {
    throw new Error(`${path} failed with ${response.status}`);
  }

  return response.json();
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

export const vouchEdgeBootJobs: VouchEdgeBootJob[] = [
  {
    id: "lineupToday",
    label: "Syncing today’s MLB slate",
    feature: "Daily slate",
    required: true,
    weight: 22,
    timeoutMs: 4500,
    run: (signal) => runAndCache("lineupToday", "/api/mlb/lineup/today", signal),
  },
  {
    id: "dailyPlayers",
    label: "Loading Daily Players intelligence",
    feature: "Daily Players",
    required: true,
    weight: 18,
    timeoutMs: 5500,
    run: (signal) => runAndCache("dailyPlayers", "/api/daily-players", signal),
  },
  {
    id: "dailyHrBoard",
    label: "Warming HR board signals",
    feature: "Daily HR Board",
    required: true,
    weight: 18,
    timeoutMs: 5500,
    run: (signal) => runAndCache("dailyHrBoard", "/api/mlb/hr-board", signal),
  },
  {
    id: "savedParlays",
    label: "Checking saved parlays",
    feature: "Parlay Hub",
    required: true,
    weight: 10,
    timeoutMs: 3500,
    run: (signal) => runAndCache("savedParlays", "/api/parlays/saved", signal),
  },
  {
    id: "notifications",
    label: "Scanning VouchEdge notifications",
    feature: "Notifications",
    required: true,
    weight: 10,
    timeoutMs: 3500,
    run: (signal) => runAndCache("notifications", "/api/notifications", signal),
  },
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
    label: "Preparing Live Game Lab",
    feature: "Live Game Lab",
    required: false,
    weight: 10,
    timeoutMs: 6500,
    run: (signal) => runAndCache("liveGamesSummary", "/api/mlb/games/live", signal),
  },
];
