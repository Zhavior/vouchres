/**
 * Active hitters grouped by team.
 * Safer version: pulls each MLB team's active roster directly instead of relying
 * on /sports/1/players currentTeam, which can mis-map players.
 */
import { TTLCache } from "../../lib/cache";
import { NormalizedPlayer, headshotUrl } from "./mlbTypes";

const BASE = (process.env.MLB_API_BASE_URL || "https://statsapi.mlb.com/api").replace(/\/$/, "");
const hittersCache = new TTLCache<Map<number, NormalizedPlayer[]>>(30 * 60_000);

function bats(code?: string): "L" | "R" | "S" | "U" {
  return code === "L" ? "L" : code === "R" ? "R" : code === "S" ? "S" : "U";
}

async function getMlbTeams(): Promise<Array<{ id: number; name: string }>> {
  const res = await fetch(`${BASE}/v1/teams?sportId=1&activeStatus=Y`);
  if (!res.ok) throw new Error(`teams ${res.status}`);

  const data = await res.json();
  const teams: any[] = Array.isArray(data?.teams) ? data.teams : [];

  return teams
    .filter((t) => typeof t.id === "number" && t.name)
    .map((t) => ({ id: t.id, name: t.name }));
}

async function getTeamActiveHitters(teamId: number, teamName: string): Promise<NormalizedPlayer[]> {
  const res = await fetch(`${BASE}/v1/teams/${teamId}/roster?rosterType=active`);
  if (!res.ok) throw new Error(`team ${teamId} roster ${res.status}`);

  const data = await res.json();
  const roster: any[] = Array.isArray(data?.roster) ? data.roster : [];

  return roster
    .filter((r) => {
      const pos = r?.position?.abbreviation;
      return r?.person?.id && r?.person?.fullName && pos && pos !== "P";
    })
    .map((r) => {
      const playerId = r.person.id as number;
      const pos = r.position.abbreviation as string;

      return {
        playerId,
        playerName: r.person.fullName,
        position: pos,
        bats: bats(r.person?.batSide?.code),
        team: teamName,
        teamId,
        headshot: headshotUrl(playerId),
      } satisfies NormalizedPlayer;
    });
}

/** Map of teamId -> active position players, pitchers excluded. */
export async function getActiveHittersByTeam(): Promise<Map<number, NormalizedPlayer[]>> {
  return hittersCache.getOrSet("hitters", async () => {
    const map = new Map<number, NormalizedPlayer[]>();

    try {
      const teams = await getMlbTeams();

      const results = await Promise.allSettled(
        teams.map(async (team) => {
          const hitters = await getTeamActiveHitters(team.id, team.name);
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
