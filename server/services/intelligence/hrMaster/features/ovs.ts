import type { BatterProfile, GameContextInput } from "../types";
import { HR_MASTER_MODEL } from "../modelConfig";
import { clampToUnitScale, normalizeMinMax } from "../normalize";

export function computeOvs(
  batter: BatterProfile,
  game: GameContextInput,
): { normalized: number; breakdown: Record<string, number> } {
  const teamTotal =
    batter.team === game.home_team
      ? game.implied_team_totals.home
      : game.implied_team_totals.away;

  const spotPa =
    HR_MASTER_MODEL.league_baselines.lineup_spot_pa[
      Math.min(9, Math.max(1, batter.projected_lineup_spot)) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
    ] ?? 3.8;

  const paComponent = normalizeMinMax(batter.projected_plate_appearances || spotPa, 3.0, 5.0);
  const lineupComponent = normalizeMinMax(10 - batter.projected_lineup_spot, 1, 9);
  const starterComponent = batter.starter_probability;
  const teamTotalComponent = normalizeMinMax(teamTotal, 3.5, 6.0);
  const fourPaLikelihood = batter.projected_plate_appearances >= 4 ? 1 : normalizeMinMax(batter.projected_plate_appearances, 2.5, 4);

  const rawOvs =
    0.30 * paComponent +
    0.20 * lineupComponent +
    0.20 * starterComponent +
    0.15 * teamTotalComponent +
    0.15 * fourPaLikelihood;

  return {
    normalized: clampToUnitScale(rawOvs),
    breakdown: {
      projected_plate_appearances: batter.projected_plate_appearances,
      lineup_spot: batter.projected_lineup_spot,
      starter_probability: batter.starter_probability,
      team_implied_total: teamTotal,
      four_pa_likelihood: fourPaLikelihood,
      raw_ovs: rawOvs,
    },
  };
}
