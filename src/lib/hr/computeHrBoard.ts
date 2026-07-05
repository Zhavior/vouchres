import { calculateHRScore } from "../../engine/hr/hrScoreEngine";

export function computeHrBoard(players: any[]) {
  const scored = players.map((player) => {
    const result = calculateHRScore({
      barrelRate: player.barrelRate ?? 0,
      hardHitRate: player.hardHitRate ?? 0,
      pitcherHR9: player.pitcherHR9 ?? 0,
      parkFactor: player.parkFactor ?? 0,
      weatherBoost: player.weatherBoost ?? 0,
      recentForm: player.recentForm ?? 0,
      matchupEdge: player.matchupEdge ?? 0,
    });

    return {
      ...player,
      hrScore: result.score,
      tier: result.tier,
    };
  });

  return {
    elite: scored.filter((p) => p.tier === "ELITE").sort((a, b) => b.hrScore - a.hrScore),
    strong: scored.filter((p) => p.tier === "STRONG").sort((a, b) => b.hrScore - a.hrScore),
    watchlist: scored.filter((p) => p.tier === "GOOD").sort((a, b) => b.hrScore - a.hrScore),
  };
}
