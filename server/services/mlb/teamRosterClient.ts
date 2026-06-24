/**
 * Active hitters grouped by team — one cached call to the MLB players endpoint.
 * Used by the HR board so each game can list real hitters (names + headshots).
 */
import { TTLCache } from "../../lib/cache";
import { NormalizedPlayer, headshotUrl } from "./mlbTypes";

const BASE = (process.env.MLB_API_BASE_URL || "https://statsapi.mlb.com/api").replace(/\/$/, "");
const hittersCache = new TTLCache<Map<number, NormalizedPlayer[]>>(30 * 60_000);

function bats(code?: string): "L" | "R" | "S" | "U" {
  return code === "L" ? "L" : code === "R" ? "R" : code === "S" ? "S" : "U";
}

/** Map of teamId -> active position players (pitchers excluded). */
export async function getActiveHittersByTeam(): Promise<Map<number, NormalizedPlayer[]>> {
  return hittersCache.getOrSet("hitters", async () => {
    const map = new Map<number, NormalizedPlayer[]>();
    try {
      const res = await fetch(`${BASE}/v1/sports/1/players`);
      if (!res.ok) throw new Error(`players ${res.status}`);
      const data = await res.json();
      const people: any[] = Array.isArray(data?.people) ? data.people : [];
      for (const p of people) {
        if (!p.active || !p.currentTeam || !p.primaryPosition) continue;
        const pos = p.primaryPosition.abbreviation as string;
        if (pos === "P") continue; // hitters only (TWP / DH kept)
        const teamId = p.currentTeam.id as number;
        const player: NormalizedPlayer = {
          playerId: p.id,
          playerName: p.fullName,
          position: pos,
          bats: bats(p.batSide?.code),
          team: p.currentTeam.name,
          teamId,
          headshot: headshotUrl(p.id),
        };
        const arr = map.get(teamId);
        if (arr) arr.push(player);
        else map.set(teamId, [player]);
      }
    } catch (err) {
      console.error("[teamRosterClient] getActiveHittersByTeam failed:", (err as Error).message);
    }
    return map;
  });
}
