import { getPitcherStats, type PitcherSeasonStats, type PitcherRecentGame } from "./statsClient";
import { getPitchMixMap, type StatcastPitchMixRow } from "./statcastClient";

export interface PitcherResearch {
  playerId: number;
  season: PitcherSeasonStats | null;
  recentGames: PitcherRecentGame[];
  pitchMix: StatcastPitchMixRow[];
  warnings: string[];
  dataSource: "official_mlb";
  updatedAt: string;
}

export async function getPitcherResearch(pitcherId: number): Promise<PitcherResearch> {
  const warnings: string[] = [];

  const [stats, mixMap] = await Promise.all([
    getPitcherStats(pitcherId).catch((err) => {
      console.warn(`[pitcherResearch] stats failed ${pitcherId}:`, (err as Error).message);
      warnings.push("Season pitching stats unavailable from MLB Stats API.");
      return { pitcherId, season: null, recentGames: [] as PitcherRecentGame[] };
    }),
    getPitchMixMap().catch((err) => {
      console.warn("[pitcherResearch] Savant pitch mix failed:", (err as Error).message);
      warnings.push("Savant pitcher arsenal unavailable.");
      return {} as Record<number, StatcastPitchMixRow[]>;
    }),
  ]);

  const pitchMix = mixMap[pitcherId] ?? [];
  if (!stats.season) warnings.push("No MLB season pitching line for this pitcher.");
  if (!pitchMix.length) warnings.push("No Savant pitch-type rows for this pitcher.");

  return {
    playerId: pitcherId,
    season: stats.season,
    recentGames: stats.recentGames,
    pitchMix,
    warnings,
    dataSource: "official_mlb",
    updatedAt: new Date().toISOString(),
  };
}
