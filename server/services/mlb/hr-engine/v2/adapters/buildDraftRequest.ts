import type { HrEligibleHitter } from "../../hrEngineTypes";
import type {
  BatterProfileV2,
  BullpenProfileV2,
  EnvironmentVectorV2,
  GameContextV2,
  HrEngineRequestV2,
  MarketDataV2,
  PitcherProfileV2,
  Rolling30dMetrics,
  SeasonMetrics,
} from "../types";

export type DraftRequestDependencies = {
  game: Omit<GameContextV2, "gameId" | "ballpark" | "confirmedLineupsStatus">;
  batter: {
    handedness: BatterProfileV2["handedness"];
    projectedLineupSpot: number | null;
    projectedPlateAppearances: number | null;
    starterProbability: number | null;
    seasonMetrics: SeasonMetrics | null;
    rolling30dMetrics?: Rolling30dMetrics | null;
    rolling14dBbeLog?: BatterProfileV2["rolling14dBbeLog"];
    pitchTypeSkill?: BatterProfileV2["pitchTypeSkill"];
    splitProfile?: BatterProfileV2["splitProfile"];
  };
  pitcher: Omit<PitcherProfileV2, "pitcherId" | "pitcherName">;
  bullpen: BullpenProfileV2;
  environment: EnvironmentVectorV2;
  market?: MarketDataV2 | null;
};

export function buildDraftRequest(
  hitter: HrEligibleHitter,
  dependencies: DraftRequestDependencies,
): HrEngineRequestV2 {
  return {
    game: {
      ...dependencies.game,
      gameId: hitter.gameId,
      ballpark: hitter.venue,
      confirmedLineupsStatus: hitter.lineupStatus === "confirmed",
    },
    batter: {
      batterId: hitter.playerId,
      batterName: hitter.playerName,
      team: hitter.team,
      handedness: dependencies.batter.handedness,
      projectedLineupSpot: dependencies.batter.projectedLineupSpot,
      projectedPlateAppearances: dependencies.batter.projectedPlateAppearances,
      starterProbability: dependencies.batter.starterProbability,
      seasonMetrics: dependencies.batter.seasonMetrics,
      rolling30dMetrics: dependencies.batter.rolling30dMetrics ?? null,
      rolling14dBbeLog: dependencies.batter.rolling14dBbeLog ?? [],
      pitchTypeSkill: dependencies.batter.pitchTypeSkill ?? null,
      splitProfile: dependencies.batter.splitProfile ?? null,
      lineupStatus: hitter.lineupStatus,
    },
    pitcher: {
      ...dependencies.pitcher,
      pitcherId: hitter.opponentPitcherId ?? 0,
      pitcherName: hitter.opponentPitcherName ?? "",
    },
    bullpen: dependencies.bullpen,
    environment: dependencies.environment,
    market: dependencies.market ?? null,
  };
}
