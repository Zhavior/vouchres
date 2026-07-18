/**
 * Active hitters grouped by team.
 * Each player is double-verified: they must appear on the team's active roster
 * AND their currentTeam.id (from /v1/people?hydrate=currentTeam) must match.
 * Any mismatch is logged and dropped — no fallbacks, no synthetic pools.
 */
import { TTLCache, limitConcurrency } from "../../lib/cache";
import { sportsFetchJson } from "../../lib/sports/sportsHttpClient";
import { todayISO } from "./mlbClient";
import { NormalizedPlayer, headshotUrl } from "./mlbTypes";
import { parseMlbPeopleResponse, parseMlbRosterResponse, parseMlbTeamsResponse, type MlbRosterEntry } from "./mlbStatsApiSchemas";

const BASE = (process.env.MLB_API_BASE_URL || "https://statsapi.mlb.com/api").replace(/\/$/, "");

// Bust old cache by incrementing the key version when verification logic changes
const CACHE_KEY = "hitters_v4_team_provenance";
const hittersCache = new TTLCache<Map<number, NormalizedPlayer[]>>(20 * 60_000);

function bats(code?: string): "L" | "R" | "S" | "U" {
  return code === "L" ? "L" : code === "R" ? "R" : code === "S" ? "S" : "U";
}

async function getMlbTeams(): Promise<Array<{ id: number; name: string; abbreviation: string }>> {
  const data = await sportsFetchJson<unknown>(`${BASE}/v1/teams?sportId=1&activeStatus=Y`, {
    cacheKey: "mlb:teams:active",
    ttlMs: 20 * 60_000,
    staleIfErrorMs: 5 * 60_000,
    timeoutMs: 8_000,
    retries: 1,
    debugLabel: "teamRosterClient",
  });
  const { teams, warnings } = parseMlbTeamsResponse(data, "teamRoster:teams");
  for (const warning of warnings) console.warn(`[teamRosterClient] ${warning}`);

  return teams
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
      const data = await sportsFetchJson<unknown>(url, {
        cacheKey: `mlb:people:current-team:${batch.join(",")}`,
        ttlMs: 20 * 60_000,
        staleIfErrorMs: 5 * 60_000,
        timeoutMs: 8_000,
        retries: 1,
        debugLabel: "teamRosterClient",
      });
      const { people, warnings } = parseMlbPeopleResponse(data, "teamRoster:people");
      for (const warning of warnings) console.warn(`[teamRosterClient] ${warning}`);

      for (const p of people) {
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
  const data = await sportsFetchJson<unknown>(`${BASE}/v1/teams/${teamId}/roster?rosterType=active`, {
    cacheKey: `mlb:team:${teamId}:active-roster`,
    ttlMs: 20 * 60_000,
    staleIfErrorMs: 5 * 60_000,
    timeoutMs: 8_000,
    retries: 1,
    debugLabel: "teamRosterClient",
  });
  const { roster, warnings } = parseMlbRosterResponse(data, `teamRoster:roster:${teamId}`);
  for (const warning of warnings) console.warn(`[teamRosterClient] ${warning}`);

  // Step 1: filter to non-pitchers with valid IDs
  const candidates: MlbRosterEntry[] = roster.filter((r) => {
    const pos = r?.position?.abbreviation;
    return r?.person?.id && r?.person?.fullName && pos && pos !== "P";
  });

  const candidateIds = candidates.map((r) => r.person?.id as number);

  // Step 2: verify each player's currentTeam.id matches teamId
  const currentTeamMap = await verifyCurrentTeams(candidateIds);

  const verified: NormalizedPlayer[] = [];
  for (const r of candidates) {
    const playerId = r.person?.id as number;
    const verifiedTeam = currentTeamMap.get(playerId);
    const verifiedTeamId = verifiedTeam?.id;

    if (verifiedTeamId === undefined) {
      console.warn(
        `[HR BOARD ROSTER DROP] ${r.person?.fullName} (${playerId}) — currentTeam not returned by people API, dropping from team ${teamId}`
      );
      continue;
    }

    if (verifiedTeamId !== teamId) {
      console.warn(
        `[HR BOARD ROSTER DROP] ${r.person?.fullName} listed=${teamId} verified=${verifiedTeamId} — mismatch, dropping`
      );
      continue;
    }

    if (process.env.DEBUG_HR_PIPELINE === "true") {
      console.log(
        `[HR BOARD ROSTER OK]   ${r.person?.fullName} (${playerId}) team=${team.name} (${teamId}) ✓`
      );
    }

    const pos = r.position.abbreviation as string;
    verified.push({
      playerId,
      playerName: r.person?.fullName ?? "Unknown",
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


/** America/New_York calendar date — must match mlbClient.todayISO(), not UTC. */
function todayIsoDate(): string {
  return todayISO();
}

async function getTodayTeamIds(): Promise<number[]> {
  const date = todayIsoDate();

  try {
    const data = await sportsFetchJson<any>(`${BASE}/v1/schedule?sportId=1&date=${date}`, {
      cacheKey: `mlb:schedule:team-ids:${date}`,
      ttlMs: 10 * 60_000,
      staleIfErrorMs: 10 * 60_000,
      timeoutMs: 8_000,
      retries: 1,
      debugLabel: "teamRosterClient:schedule",
    });

    const ids = new Set<number>();
    const dates = Array.isArray(data?.dates) ? data.dates : [];

    for (const d of dates) {
      const games = Array.isArray(d?.games) ? d.games : [];
      for (const game of games) {
        const awayId = game?.teams?.away?.team?.id;
        const homeId = game?.teams?.home?.team?.id;

        if (typeof awayId === "number") ids.add(awayId);
        if (typeof homeId === "number") ids.add(homeId);
      }
    }

    return [...ids];
  } catch (err) {
    console.warn("[teamRosterClient] failed to resolve today's team IDs:", (err as Error).message);
    // Do not return [] — that used to look like "no games" and trigger an all-30-team fallback.
    throw err;
  }
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
  const dateKey = todayIsoDate();
  const cacheKey = teamIds && teamIds.length > 0
    ? `${CACHE_KEY}:teams:${teamIds.sort((a, b) => a - b).join(",")}`
    : `${CACHE_KEY}:today:${dateKey}`;

  const cached = hittersCache.get(cacheKey);
  if (cached) {
    console.log(`[teamRosterClient] cache hit for key=${cacheKey.slice(0, 40)}`);
    return cached;
  }

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
        // Legacy/no teamIds caller: default to today's slate instead of all 30 teams.
        const todayTeamIds = await getTodayTeamIds();

        if (todayTeamIds.length > 0) {
          const wantedTeamIds = new Set(todayTeamIds);
          const allTeams = await getMlbTeams();
          teams = allTeams.filter((team) => wantedTeamIds.has(team.id));
          console.log(`[teamRosterClient] No teamIds provided; using today's slate (${teams.length} teams)`);
        } else {
          // Honest empty slate — do not expand to all 30 teams when the schedule is empty.
          teams = [];
          console.warn("[teamRosterClient] No schedule team IDs found; returning empty roster map (no all-30 fallback)");
        }
      }

      console.log(`[teamRosterClient] cache miss — fetching rosters for ${teams.length} teams (max 3 concurrent)`);
      const results = await limitConcurrency(teams, 3, async (team) => {
        console.log(`[teamRosterClient] starting roster fetch for team ${team.id} (${team.abbreviation})`);
        try {
          const hitters = await getTeamActiveHitters(team);
          return { ok: true as const, team, hitters };
        } catch (err) {
          console.error(`[teamRosterClient] roster fetch failed for team ${team.id}:`, (err as Error).message);
          return { ok: false as const, team, hitters: [] as NormalizedPlayer[] };
        }
      });

      for (const result of results) {
        map.set(result.team.id, result.hitters);
      }
    } catch (err) {
      console.error("[teamRosterClient] getActiveHittersByTeam failed:", (err as Error).message);
    }

    return map;
  });
}
