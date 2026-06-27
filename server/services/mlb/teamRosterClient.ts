/**
 * Active hitters grouped by team.
 * Each player is double-verified: they must appear on the team's active roster
 * AND their currentTeam.id (from /v1/people?hydrate=currentTeam) must match.
 * Any mismatch is logged and dropped — no fallbacks, no synthetic pools.
 */
import { TTLCache } from "../../lib/cache";
import { NormalizedPlayer, headshotUrl } from "./mlbTypes";

const BASE = (process.env.MLB_API_BASE_URL || "https://statsapi.mlb.com/api").replace(/\/$/, "");

// Bust old cache by incrementing the key version when verification logic changes
const CACHE_KEY = "hitters_v4_team_provenance";
const hittersCache = new TTLCache<Map<number, NormalizedPlayer[]>>(20 * 60_000);

function bats(code?: string): "L" | "R" | "S" | "U" {
  return code === "L" ? "L" : code === "R" ? "R" : code === "S" ? "S" : "U";
}

async function getMlbTeams(): Promise<Array<{ id: number; name: string; abbreviation: string }>> {
  const res = await fetch(`${BASE}/v1/teams?sportId=1&activeStatus=Y`);
  if (!res.ok) throw new Error(`teams ${res.status}`);
  const data = await res.json();
  const teams: any[] = Array.isArray(data?.teams) ? data.teams : [];
  return teams
    .filter((t) => typeof t.id === "number" && t.name)
    .map((t) => ({ id: t.id, name: t.name, abbreviation: t.abbreviation || t.teamCode || "" }));
}

/** Fetch currentTeam.id for a batch of player IDs via the people API. */
async function verifyCurrentTeams(playerIds: number[]): Promise<Map<number, { id: number; name: string; abbreviation: string }>> {
  const result = new Map<number, { id: number; name: string; abbreviation: string }>();
  if (playerIds.length === 0) return result;

  // MLB API accepts up to ~50 IDs per call
  const BATCH = 50;
  for (let i = 0; i < playerIds.length; i += BATCH) {
    const batch = playerIds.slice(i, i + BATCH);
    try {
      const url = `${BASE}/v1/people?personIds=${batch.join(",")}&hydrate=currentTeam`;
      const res = await fetch(url);
      if (!res.ok) {
        console.warn(`[teamRosterClient] people verification ${res.status} for batch starting at ${i}`);
        continue;
      }
      const data = await res.json();
      for (const p of data?.people ?? []) {
        const ctId: number | undefined = p?.currentTeam?.id;
        if (p?.id && ctId) {
          result.set(p.id, {
            id: ctId,
            name: p?.currentTeam?.name || "",
            abbreviation: p?.currentTeam?.abbreviation || p?.currentTeam?.teamCode || "",
          });
        }
      }
    } catch (err) {
      console.warn(`[teamRosterClient] people verification error:`, (err as Error).message);
    }
  }
  return result;
}

async function getTeamActiveHitters(team: { id: number; name: string; abbreviation: string }): Promise<NormalizedPlayer[]> {
  const teamId = team.id;
  const res = await fetch(`${BASE}/v1/teams/${teamId}/roster?rosterType=active`);
  if (!res.ok) throw new Error(`team ${teamId} roster ${res.status}`);

  const data = await res.json();
  const roster: any[] = Array.isArray(data?.roster) ? data.roster : [];

  // Step 1: filter to non-pitchers with valid IDs
  const candidates = roster.filter((r) => {
    const pos = r?.position?.abbreviation;
    return r?.person?.id && r?.person?.fullName && pos && pos !== "P";
  });

  const candidateIds = candidates.map((r) => r.person.id as number);

  // Step 2: verify each player's currentTeam.id matches teamId
  const currentTeamMap = await verifyCurrentTeams(candidateIds);

  const verified: NormalizedPlayer[] = [];
  for (const r of candidates) {
    const playerId = r.person.id as number;
    const verifiedTeam = currentTeamMap.get(playerId);
    const verifiedTeamId = verifiedTeam?.id;

    if (verifiedTeamId === undefined) {
      console.warn(
        `[HR BOARD ROSTER DROP] ${r.person.fullName} (${playerId}) — currentTeam not returned by people API, dropping from team ${teamId}`
      );
      continue;
    }

    if (verifiedTeamId !== teamId) {
      console.warn(
        `[HR BOARD ROSTER DROP] ${r.person.fullName} listed=${teamId} verified=${verifiedTeamId} — mismatch, dropping`
      );
      continue;
    }

    if (process.env.DEBUG_HR_PIPELINE === "true") {
      console.log(
        `[HR BOARD ROSTER OK]   ${r.person.fullName} (${playerId}) team=${team.name} (${teamId}) ✓`
      );
    }

    const pos = r.position.abbreviation as string;
    verified.push({
      playerId,
      playerName: r.person.fullName,
      position: pos,
      bats: bats(r.person?.batSide?.code),
      team: team.name,
      teamId,
      teamAbbrev: team.abbreviation,
      sourceTeamId: teamId,
      sourceTeamAbbrev: team.abbreviation,
      playerCurrentTeamId: verifiedTeamId,
      playerCurrentTeamName: verifiedTeam?.name || null,
      playerCurrentTeamAbbrev: verifiedTeam?.abbreviation || null,
      activeRosterTeamId: teamId,
      rosterType: "active",
      headshot: headshotUrl(playerId),
    } satisfies NormalizedPlayer);
  }

  return verified;
}

/**
 * Map of teamId -> active position players, pitchers excluded, currentTeam verified.
 *
 * OPTIMIZATION: If `teamIds` is provided, only fetch rosters for those teams
 * (today's games only). This cuts 30 roster calls → ~20 and 388 stat calls → ~80.
 * If `teamIds` is omitted, falls back to all 30 teams (legacy behavior, slow).
 */
export async function getActiveHittersByTeam(
  teamIds?: number[]
): Promise<Map<number, NormalizedPlayer[]>> {
  // Use a separate cache key when filtered by team IDs
  const cacheKey = teamIds && teamIds.length > 0
    ? `${CACHE_KEY}:teams:${teamIds.sort((a, b) => a - b).join(",")}`
    : CACHE_KEY;

  return hittersCache.getOrSet(cacheKey, async () => {
    const map = new Map<number, NormalizedPlayer[]>();

    try {
      let teams: Array<{ id: number; name: string; abbreviation: string }>;

      if (teamIds && teamIds.length > 0) {
        // Fetch official MLB team metadata, then filter to today's slate.
        // Do not create placeholder names like "Team 136".
        const wantedTeamIds = new Set(teamIds);
        const allTeams = await getMlbTeams();

        teams = allTeams.filter((team) => wantedTeamIds.has(team.id));

        const missingTeamIds = teamIds.filter(
          (id) => !teams.some((team) => team.id === id)
        );

        if (missingTeamIds.length > 0) {
          console.warn(
            `[teamRosterClient] Missing official metadata for team IDs: ${missingTeamIds.join(", ")}`
          );
        }

        console.log(`[teamRosterClient] Fetching rosters for ${teams.length} official teams (today's slate only)`);
      } else {
        // Legacy: fetch all 30 teams
        teams = await getMlbTeams();
        console.log(`[teamRosterClient] Fetching rosters for all ${teams.length} teams`);
      }

      const results = await Promise.allSettled(
        teams.map(async (team) => {
          const hitters = await getTeamActiveHitters(team);
          return { team, hitters };
        })
      );

      for (const result of results) {
        if (result.status !== "fulfilled") {
          console.error("[teamRosterClient] roster fetch failed:", result.reason);
          continue;
        }
        map.set(result.value.team.id, result.value.hitters);
      }
    } catch (err) {
      console.error("[teamRosterClient] getActiveHittersByTeam failed:", (err as Error).message);
    }

    return map;
  });
}
