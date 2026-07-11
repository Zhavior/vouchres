import {
  fetchParlayLegProgressBatch,
  type ParlayLegProgressRequest,
  type ParlayLegProgressResult,
} from "../mlb/parlayLiveProgressService";
import { fetchNflParlayLegProgressBatch } from "../nfl/nflLiveProgressService";

export type ParlayLiveProgressLeg = ParlayLegProgressRequest & {
  sport?: string | null;
};

function normalizeSport(raw: string | null | undefined): string {
  return String(raw ?? "mlb").trim().toLowerCase();
}

/**
 * Sport-dispatched live progress for parlay legs.
 * MLB is fully wired; NFL/NBA return honest pending until their providers ship.
 */
export async function fetchParlayLiveProgressBySport(
  legs: ParlayLiveProgressLeg[],
): Promise<ParlayLegProgressResult[]> {
  const bySport = new Map<string, ParlayLiveProgressLeg[]>();

  for (const leg of legs) {
    const sport = normalizeSport(leg.sport);
    const bucket = bySport.get(sport) ?? [];
    bucket.push(leg);
    bySport.set(sport, bucket);
  }

  const results: ParlayLegProgressResult[] = [];

  for (const [sport, sportLegs] of bySport.entries()) {
    if (sport === "mlb") {
      results.push(...await fetchParlayLegProgressBatch(sportLegs));
      continue;
    }
    if (sport === "nfl") {
      results.push(...await fetchNflParlayLegProgressBatch(sportLegs));
      continue;
    }
    for (const leg of sportLegs) {
      results.push({
        id: leg.id,
        current: null,
        target: Number(leg.statTarget ?? 1) || 1,
        label: "Progress",
        gameStatus: null,
      });
    }
  }

  return results;
}
