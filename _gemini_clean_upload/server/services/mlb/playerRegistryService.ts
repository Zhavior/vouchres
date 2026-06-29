import { TTLCache } from "../../lib/cache";
import { getActiveHittersByTeam } from "./teamRosterClient";
import { headshotUrl } from "./mlbTypes";

const BASE = (process.env.MLB_API_BASE_URL || "https://statsapi.mlb.com/api").replace(/\/$/, "");
const REGISTRY_TTL_MS = 20 * 60_000;
const registryCache = new TTLCache<PlayerRegistryEntry[]>(REGISTRY_TTL_MS);

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

async function fetchJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`MLB StatsAPI ${res.status} for ${url}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
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
  const teams = await getMlbTeams();
  const rows = await Promise.allSettled(
    teams.flatMap((team) => [
      getTeamRoster(team, "active"),
      getTeamRoster(team, "40Man"),
    ])
  );

  const byPlayer = new Map<number, PlayerRegistryEntry>();
  for (const result of rows) {
    if (result.status !== "fulfilled") {
      console.warn("[playerRegistry] roster fetch failed:", result.reason);
      continue;
    }
    for (const player of result.value) {
      const existing = byPlayer.get(player.playerId);
      if (!existing || existing.rosterType !== "active") {
        byPlayer.set(player.playerId, player);
      }
    }
  }

  return [...byPlayer.values()].sort((a, b) => a.playerName.localeCompare(b.playerName));
}

export async function getPlayerRegistry(forceRefresh = false): Promise<PlayerRegistryEntry[]> {
  if (forceRefresh) registryCache.delete("registry");
  return registryCache.getOrSet("registry", buildRegistry);
}

export async function getPlayerCount(): Promise<{ count: number; updatedAt: string; source: string }> {
  const players = await getPlayerRegistry();
  return {
    count: players.length,
    updatedAt: new Date().toISOString(),
    source: "official_mlb",
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

export async function refreshPlayerRegistry(): Promise<{ count: number; players: PlayerRegistryEntry[] }> {
  const players = await getPlayerRegistry(true);
  return { count: players.length, players };
}
