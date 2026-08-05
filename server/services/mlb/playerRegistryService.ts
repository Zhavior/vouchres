import fs from "node:fs";
import path from "node:path";
import { TTLCache, limitConcurrency } from "../../lib/cache";
import { sportsFetchJson } from "../../lib/sports/sportsHttpClient";
import { redisGetJson, redisSetJson } from "../../lib/upstashRedis";
import { getActiveHittersByTeam } from "./teamRosterClient";
import { headshotUrl } from "./mlbTypes";

const BASE = (process.env.MLB_API_BASE_URL || "https://statsapi.mlb.com/api").replace(/\/$/, "");
const REGISTRY_TTL_MS = 20 * 60_000;
const registryCache = new TTLCache<PlayerRegistryEntry[]>(REGISTRY_TTL_MS);

const SNAPSHOT_DISK_PATH = path.join(process.cwd(), ".cache", "playerRegistrySnapshot.json");
const REDIS_SNAPSHOT_KEY = "mlb_player_registry_snapshot";

let registryWarmupInFlight = false;
let lastKnownRegistryCount = 0;
let lastRegistryUpdatedAt = new Date(0).toISOString();
let lastRegistryAttemptedAt = new Date(0).toISOString();
let lastRegistryWarning: string | null = null;
let isRegistryStale = false;
let registrySource: "live_cache" | "snapshot" = "live_cache";

export interface PlayerRegistryEntry {
  playerId: number;
  id: string;
  playerName: string;
  name: string;
  teamId: number;
  team: string;
  position: string;
  rosterType: "active" | "40Man";
  bats: "L" | "R" | "S" | "U";
  throws: "L" | "R" | "U";
  headshot: string;
  dataSource: "official_mlb";
  provider: "mlb_statsapi";
  updatedAt: string;
}

export interface PlayerRegistrySnapshot {
  players: PlayerRegistryEntry[];
  updatedAt: string;
  count: number;
}

export interface PlayerRegistryStatus {
  ready: boolean;
  stale: boolean;
  warming: boolean;
  source: "live_cache" | "snapshot";
  count: number;
  updatedAt: string;
  attemptedAt: string;
  warning: string | null;
}

interface MlbTeam {
  id: number;
  name: string;
}

function normalizeBat(code?: string): "L" | "R" | "S" | "U" {
  return code === "L" || code === "R" || code === "S" ? code : "U";
}

function normalizeThrow(code?: string): "L" | "R" | "U" {
  return code === "L" || code === "R" ? code : "U";
}

async function saveRegistrySnapshot(players: PlayerRegistryEntry[], updatedAt: string): Promise<void> {
  const snapshot: PlayerRegistrySnapshot = {
    players,
    updatedAt,
    count: players.length,
  };

  try {
    const dir = path.dirname(SNAPSHOT_DISK_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    await fs.promises.writeFile(SNAPSHOT_DISK_PATH, JSON.stringify(snapshot), "utf8");
  } catch (err) {
    console.warn("[playerRegistry] failed writing snapshot to disk:", (err as Error).message);
  }

  try {
    await redisSetJson(REDIS_SNAPSHOT_KEY, snapshot, 86400);
  } catch (err) {
    // Redis is optional fallback, suppress error if unconfigured
  }
}

function loadRegistrySnapshotSync(): PlayerRegistrySnapshot | null {
  try {
    if (fs.existsSync(SNAPSHOT_DISK_PATH)) {
      const raw = fs.readFileSync(SNAPSHOT_DISK_PATH, "utf8");
      const parsed = JSON.parse(raw) as PlayerRegistrySnapshot;
      if (Array.isArray(parsed?.players) && parsed.players.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("[playerRegistry] failed reading snapshot from disk:", (err as Error).message);
  }
  return null;
}

async function loadRegistrySnapshotAsync(): Promise<PlayerRegistrySnapshot | null> {
  const syncSnap = loadRegistrySnapshotSync();
  if (syncSnap) return syncSnap;

  try {
    const redisSnap = await redisGetJson<PlayerRegistrySnapshot>(REDIS_SNAPSHOT_KEY);
    if (redisSnap && Array.isArray(redisSnap.players) && redisSnap.players.length > 0) {
      return redisSnap;
    }
  } catch (err) {
    // Ignore Redis read errors
  }
  return null;
}

// Immediate synchronous load of initial snapshot on module boot
(() => {
  const initialSnap = loadRegistrySnapshotSync();
  if (initialSnap) {
    lastKnownRegistryCount = initialSnap.count;
    lastRegistryUpdatedAt = initialSnap.updatedAt;
    lastRegistryAttemptedAt = initialSnap.updatedAt;
    isRegistryStale = true;
    registrySource = "snapshot";
    registryCache.set("registry", initialSnap.players, REGISTRY_TTL_MS);
  }
})();

async function fetchJson<T>(url: string): Promise<T> {
  return sportsFetchJson<T>(url, {
    cacheKey: `playerRegistry:${url}`,
    ttlMs: 5 * 60_000,
    timeoutMs: 10_000,
    retries: 1,
    debugLabel: "playerRegistry",
  });
}

async function getMlbTeams(): Promise<MlbTeam[]> {
  const data = await fetchJson<any>(`${BASE}/v1/teams?sportId=1&activeStatus=Y`);
  const teams = Array.isArray(data?.teams) ? data.teams : [];
  return teams
    .filter((team: any) => typeof team?.id === "number" && team?.name)
    .map((team: any) => ({ id: team.id, name: team.name }));
}

async function getTeamRoster(team: MlbTeam, rosterType: "active" | "40Man"): Promise<PlayerRegistryEntry[]> {
  const data = await fetchJson<any>(`${BASE}/v1/teams/${team.id}/roster?rosterType=${rosterType}`);
  const roster = Array.isArray(data?.roster) ? data.roster : [];
  const updatedAt = new Date().toISOString();

  return roster
    .filter((row: any) => row?.person?.id && row?.person?.fullName)
    .map((row: any) => {
      const playerId = Number(row.person.id);
      return {
        playerId,
        id: String(playerId),
        playerName: row.person.fullName,
        name: row.person.fullName,
        teamId: team.id,
        team: team.name,
        position: row?.position?.abbreviation || row?.position?.name || "MLB",
        rosterType,
        bats: normalizeBat(row?.person?.batSide?.code),
        throws: normalizeThrow(row?.person?.pitchHand?.code),
        headshot: headshotUrl(playerId),
        dataSource: "official_mlb",
        provider: "mlb_statsapi",
        updatedAt,
      } satisfies PlayerRegistryEntry;
    });
}

async function buildRegistry(): Promise<PlayerRegistryEntry[]> {
  lastRegistryAttemptedAt = new Date().toISOString();

  try {
    const teams = await getMlbTeams();
    console.log(`[playerRegistry] building registry for ${teams.length} teams (max 3 concurrent, active+40Man)`);

    const byPlayer = new Map<number, PlayerRegistryEntry>();

    await limitConcurrency(teams, 3, async (team) => {
      for (const rosterType of ["active", "40Man"] as const) {
        try {
          const players = await getTeamRoster(team, rosterType);
          for (const player of players) {
            const existing = byPlayer.get(player.playerId);
            if (!existing || existing.rosterType !== "active") {
              byPlayer.set(player.playerId, player);
            }
          }
        } catch (err) {
          console.warn(`[playerRegistry] roster fetch failed for team ${team.id} (${rosterType}):`, (err as Error).message);
        }
      }
    });

    const players = [...byPlayer.values()].sort((a, b) => a.playerName.localeCompare(b.playerName));
    if (players.length === 0) {
      throw new Error("MLB Stats API returned 0 active roster players.");
    }

    lastKnownRegistryCount = players.length;
    lastRegistryUpdatedAt = new Date().toISOString();
    lastRegistryWarning = null;
    isRegistryStale = false;
    registrySource = "live_cache";

    void saveRegistrySnapshot(players, lastRegistryUpdatedAt);
    return players;
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.warn(`[playerRegistry] live registry build failed (${errMsg}). Checking durable snapshot fallback...`);
    lastRegistryWarning = errMsg;

    const snap = await loadRegistrySnapshotAsync();
    if (snap && snap.players.length > 0) {
      console.log(`[playerRegistry] serving durable snapshot with ${snap.players.length} players (updatedAt: ${snap.updatedAt})`);
      lastKnownRegistryCount = snap.count;
      lastRegistryUpdatedAt = snap.updatedAt;
      isRegistryStale = true;
      registrySource = "snapshot";
      return snap.players;
    }

    throw err;
  }
}

export async function getPlayerRegistry(forceRefresh = false): Promise<PlayerRegistryEntry[]> {
  if (forceRefresh) registryCache.delete("registry");
  const players = await registryCache.getOrSet("registry", buildRegistry);
  lastKnownRegistryCount = players.length;
  return players;
}

export function getPlayerRegistryStatus(): PlayerRegistryStatus {
  return {
    ready: lastKnownRegistryCount > 0,
    stale: isRegistryStale,
    warming: registryWarmupInFlight,
    source: registrySource,
    count: lastKnownRegistryCount,
    updatedAt: lastRegistryUpdatedAt,
    attemptedAt: lastRegistryAttemptedAt,
    warning: lastRegistryWarning,
  };
}

export function warmPlayerRegistryInBackground(): void {
  if (registryWarmupInFlight) return;

  registryWarmupInFlight = true;
  setImmediate(() => {
    getPlayerRegistry()
      .catch((error) => {
        console.warn(
          "[playerRegistry] background warmup failed:",
          error instanceof Error ? error.message : error
        );
      })
      .finally(() => {
        registryWarmupInFlight = false;
      });
  });
}

export async function getPlayerCount(): Promise<PlayerRegistryStatus> {
  warmPlayerRegistryInBackground();

  if (lastKnownRegistryCount === 0) {
    const snap = loadRegistrySnapshotSync();
    if (snap) {
      lastKnownRegistryCount = snap.count;
      lastRegistryUpdatedAt = snap.updatedAt;
      isRegistryStale = true;
      registrySource = "snapshot";
    }
  }

  return getPlayerRegistryStatus();
}

export async function getPlayerRegistryPayload(forceRefresh = false): Promise<PlayerRegistryStatus & { players: PlayerRegistryEntry[] }> {
  const players = await getPlayerRegistry(forceRefresh);
  const status = getPlayerRegistryStatus();
  return {
    ...status,
    players,
  };
}

export async function getActivePlayers(): Promise<PlayerRegistryEntry[]> {
  const hittersByTeam = await getActiveHittersByTeam();
  return [...hittersByTeam.values()]
    .flat()
    .map((player) => ({
      playerId: player.playerId,
      id: String(player.playerId),
      playerName: player.playerName,
      name: player.playerName,
      teamId: player.teamId,
      team: player.team,
      position: player.position,
      rosterType: "active",
      bats: player.bats,
      throws: "U",
      headshot: player.headshot,
      dataSource: "official_mlb",
      provider: "mlb_statsapi",
      updatedAt: new Date().toISOString(),
    }));
}

export async function searchPlayers(query: string): Promise<PlayerRegistryEntry[]> {
  const q = query.trim().toLowerCase();
  const players = await getPlayerRegistry();
  if (!q) return players.slice(0, 50);
  return players
    .filter((player) =>
      player.playerName.toLowerCase().includes(q) ||
      player.team.toLowerCase().includes(q) ||
      player.position.toLowerCase().includes(q) ||
      String(player.playerId).includes(q)
    )
    .slice(0, 50);
}

export async function getPlayerById(playerId: string): Promise<PlayerRegistryEntry | null> {
  const numericId = Number(playerId);
  if (!Number.isFinite(numericId)) return null;
  const players = await getPlayerRegistry();
  return players.find((player) => player.playerId === numericId) ?? null;
}

export async function refreshPlayerRegistry(): Promise<PlayerRegistryStatus & { players: PlayerRegistryEntry[] }> {
  return getPlayerRegistryPayload(true);
}

