import { TTLCache } from "../../../../lib/cache";
import { getScheduleByDate, todayISO } from "../../mlbClient";
import { getHitterStats, getPitcherStats, type HitterStats } from "../../statsClient";
import type { NormalizedGame } from "../../mlbTypes";
import type { ScoredHrCandidate } from "../../hrValidation";
import { buildSeasonMetrics } from "./adapters/buildSeasonMetrics";
import { buildBatterPitchTypeSkill } from "./adapters/buildBatterPitchTypeSkill";
import { buildPitcherProfile } from "./adapters/buildPitcherProfile";
import { runHrProbabilityEngineV2 } from "./index";
import { HR_MODEL_METADATA_V2 } from "./model/weights";
import { persistHrV2PairedPrediction } from "../../../intelligence/centralBrain/hrPairedEvaluationService";
import { structuredLog } from "../../../../lib/structuredLog";
import type {
  BullpenProfileV2,
  EnvironmentVectorV2,
  HrEngineRequestV2,
  HrEngineResultV2,
  PitchTypeSkill,
  PitcherProfileV2,
  SeasonMetrics,
} from "./types";

const shadowCache = new TTLCache<HrV2ShadowReport>(15 * 60_000, "mlb:hr-v2-shadow");
const MAX_SHADOW_CANDIDATES = 50;

const EMPTY_BULLPEN: BullpenProfileV2 = {
  bullpenId: "unavailable",
  last3DaysPitchCount: null,
  last2DaysHighLeverageUsage: null,
  projectedAvailableRelievers: null,
  bullpenHrPerFb: null,
  bullpenXFip: null,
  bullpenBarrelPercentAllowed: null,
  bullpenFatigueIndex: null,
};

export type HrV2ShadowCandidate = {
  playerId: number;
  playerName: string;
  gamePk: number;
  status: HrEngineResultV2["status"];
  dataQuality: HrEngineResultV2["dataQuality"];
  confidence: HrEngineResultV2["confidence"];
  pRaw: number | null;
  pModel: number | null;
  publicationEligible: false;
  warnings: string[];
  ledger: string[];
};

export type HrV2ShadowReport = {
  mode: "shadow";
  publicationEligible: false;
  reason: string;
  date: string;
  generatedAt: string;
  model: HrEngineResultV2["metadata"];
  sources: {
    scheduleLineupAndSeasonStats: "MLB Stats API";
    contactAndPitchTypeData: "MLB Baseball Savant / Statcast";
    marketData: "unavailable";
    calibratedCoefficients: "unavailable";
  };
  summary: {
    requested: number;
    scored: number;
    noAction: number;
    highQuality: number;
    mediumQuality: number;
    lowQuality: number;
    invalid: number;
  };
  candidates: HrV2ShadowCandidate[];
};

type ShadowRequestDependencies = {
  game: NormalizedGame;
  hitterStats: HitterStats;
  seasonMetrics: SeasonMetrics | null;
  pitchTypeSkill: PitchTypeSkill | null;
  pitcher: PitcherProfileV2;
};

function averagePlateAppearances(hitterStats: HitterStats): number | null {
  const season = hitterStats.season;
  if (!season || season.gamesPlayed <= 0 || season.plateAppearances <= 0) return null;
  return season.plateAppearances / season.gamesPlayed;
}

function buildEnvironment(game: NormalizedGame): EnvironmentVectorV2 {
  const weather = game.weather;
  const hasWeather = weather?.tempF != null || weather?.windMph != null;

  return {
    temperature: weather?.tempF ?? null,
    humidity: null,
    windSpeed: weather?.windMph ?? null,
    windDirection: weather?.windDir ?? null,
    // MLB's feed does not resolve compass wind against each stadium's field orientation.
    windVectorOutboundMph: null,
    // Official Savant directional park factors need a separate venue adapter.
    // Neutral is explicit and shadow-only until that adapter exists.
    parkFactorHrOverall: 100,
    parkFactorPullLeft: 100,
    parkFactorPullRight: 100,
    parkFactorCenter: 100,
    weatherConfidence: hasWeather ? "MEDIUM" : "LOW",
    roofStatus: "unknown",
  };
}

export function buildHrV2ShadowRequest(
  candidate: ScoredHrCandidate,
  dependencies: ShadowRequestDependencies,
): HrEngineRequestV2 | null {
  if (
    candidate.lineupStatus !== "confirmed" ||
    candidate.battingOrder == null ||
    candidate.batSide == null ||
    candidate.opponentPitcherHand == null ||
    !candidate.opponentPitcherId
  ) {
    return null;
  }

  const { game, hitterStats, seasonMetrics, pitchTypeSkill, pitcher } = dependencies;

  return {
    game: {
      gameId: String(candidate.gamePk),
      date: game.gameDate.slice(0, 10),
      awayTeam: game.awayTeam.abbreviation,
      homeTeam: game.homeTeam.abbreviation,
      ballpark: game.venue,
      roofStatus: "unknown",
      gameTimeLocal: game.gameDate,
      // Sportsbook-derived context is intentionally absent from an MLB-only request.
      impliedTeamTotals: { away: null, home: null },
      confirmedLineupsStatus: true,
    },
    batter: {
      batterId: candidate.playerId,
      batterName: candidate.playerName,
      team: candidate.team,
      handedness: candidate.batSide,
      projectedLineupSpot: candidate.battingOrder,
      projectedPlateAppearances: averagePlateAppearances(hitterStats),
      starterProbability: 1,
      seasonMetrics,
      rolling30dMetrics: null,
      rolling14dBbeLog: [],
      pitchTypeSkill,
      splitProfile: null,
      lineupStatus: "confirmed",
    },
    pitcher,
    bullpen: {
      ...EMPTY_BULLPEN,
      bullpenId: `${candidate.opponent}-bullpen`,
    },
    environment: buildEnvironment(game),
    market: null,
  };
}

async function scoreShadowCandidate(
  candidate: ScoredHrCandidate,
  gamesById: Map<number, NormalizedGame>,
  year: number,
): Promise<HrV2ShadowCandidate> {
  const warnings = [
    "Shadow result only. Model weights and probabilities are not calibrated for publication.",
  ];
  const game = gamesById.get(candidate.gamePk);

  if (!game) {
    return {
      playerId: candidate.playerId,
      playerName: candidate.playerName,
      gamePk: candidate.gamePk,
      status: "NO ACTION",
      dataQuality: "INVALID",
      confidence: null,
      pRaw: null,
      pModel: null,
      publicationEligible: false,
      warnings: [...warnings, "Game context missing from the official schedule."],
      ledger: ["GAME_CONTEXT_MISSING"],
    };
  }

  if (
    candidate.lineupStatus !== "confirmed" ||
    candidate.battingOrder == null ||
    candidate.batSide == null ||
    candidate.opponentPitcherHand == null ||
    !candidate.opponentPitcherId
  ) {
    return {
      playerId: candidate.playerId,
      playerName: candidate.playerName,
      gamePk: candidate.gamePk,
      status: "NO ACTION",
      dataQuality: "INVALID",
      confidence: null,
      pRaw: null,
      pModel: null,
      publicationEligible: false,
      warnings: [...warnings, "Confirmed lineup, batting order, or handedness context is incomplete."],
      ledger: ["CONFIRMED_CONTEXT_INCOMPLETE"],
    };
  }

  try {
    const [hitterStats, pitcherStats, season, batterPitchSkill] = await Promise.all([
      getHitterStats(candidate.playerId),
      getPitcherStats(candidate.opponentPitcherId),
      buildSeasonMetrics(candidate.playerId, year),
      buildBatterPitchTypeSkill(candidate.playerId, year),
    ]);

    const pitcher = await buildPitcherProfile({
      pitcherId: candidate.opponentPitcherId,
      pitcherName: candidate.opponentPitcherName,
      handedness: candidate.opponentPitcherHand,
      seasonStats: pitcherStats.season,
      year,
    });

    warnings.push(...season.warnings, ...batterPitchSkill.warnings, ...pitcher.warnings);

    const request = buildHrV2ShadowRequest(candidate, {
      game,
      hitterStats,
      seasonMetrics: season.seasonMetrics,
      pitchTypeSkill: batterPitchSkill.pitchTypeSkill,
      pitcher: pitcher.pitcher,
    });

    if (!request) {
      return {
        playerId: candidate.playerId,
        playerName: candidate.playerName,
        gamePk: candidate.gamePk,
        status: "NO ACTION",
        dataQuality: "INVALID",
        confidence: null,
        pRaw: null,
        pModel: null,
        publicationEligible: false,
        warnings: [...warnings, "Confirmed lineup, batting order, or handedness context is incomplete."],
        ledger: ["CONFIRMED_CONTEXT_INCOMPLETE"],
      };
    }

    const result = runHrProbabilityEngineV2(request);
    return {
      playerId: candidate.playerId,
      playerName: candidate.playerName,
      gamePk: candidate.gamePk,
      status: result.status,
      dataQuality: result.dataQuality,
      confidence: result.confidence,
      pRaw: result.pRaw,
      pModel: result.pModel,
      publicationEligible: false,
      warnings: Array.from(new Set(warnings)),
      ledger: result.ledger,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      playerId: candidate.playerId,
      playerName: candidate.playerName,
      gamePk: candidate.gamePk,
      status: "NO ACTION",
      dataQuality: "INVALID",
      confidence: null,
      pRaw: null,
      pModel: null,
      publicationEligible: false,
      warnings: [...warnings, `Shadow scoring failed safely: ${message}`],
      ledger: ["SHADOW_SCORING_FAILED"],
    };
  }
}

export async function buildHrV2ShadowReport(
  candidates: ScoredHrCandidate[],
  date = todayISO(),
): Promise<HrV2ShadowReport> {
  const cacheKey = `${date}:${candidates.map((candidate) => candidate.playerId).join(",")}`;

  return shadowCache.getOrSet(cacheKey, async () => {
    const games = await getScheduleByDate(date);
    const gamesById = new Map(games.map((game) => [game.gamePk, game]));
    const year = Number(date.slice(0, 4)) || new Date().getUTCFullYear();
    const selected = candidates.slice(0, MAX_SHADOW_CANDIDATES);
    const scored: HrV2ShadowCandidate[] = [];

    // Sequential execution prevents duplicate cold fetches of large Savant CSV maps.
    for (const candidate of selected) {
      const shadowCandidate = await scoreShadowCandidate(candidate, gamesById, year);
      scored.push(shadowCandidate);
      const game = gamesById.get(candidate.gamePk);
      if (game && shadowCandidate.status === "SCORED" && shadowCandidate.pModel != null && candidate.estimatedHrProbability != null) {
        try {
          await persistHrV2PairedPrediction({
            date,
            gamePk: candidate.gamePk,
            playerId: candidate.playerId,
            scheduledFirstPitch: game.gameDate,
            predictionGeneratedAt: new Date().toISOString(),
            incumbentProbability: candidate.estimatedHrProbability,
            challengerProbability: shadowCandidate.pModel,
            challengerEngineVersion: HR_MODEL_METADATA_V2.modelVersion,
          });
        } catch (error) {
          structuredLog({ level: "error", event: "brain.hr.v2_shadow_persistence_failed", gamePk: candidate.gamePk, playerId: candidate.playerId, message: error instanceof Error ? error.message : String(error) });
        }
      }
    }

    return {
      mode: "shadow",
      publicationEligible: false,
      reason: "V2 is connected to real inputs for staff evaluation, but coefficients and probabilities are uncalibrated.",
      date,
      generatedAt: new Date().toISOString(),
      model: HR_MODEL_METADATA_V2,
      sources: {
        scheduleLineupAndSeasonStats: "MLB Stats API",
        contactAndPitchTypeData: "MLB Baseball Savant / Statcast",
        marketData: "unavailable",
        calibratedCoefficients: "unavailable",
      },
      summary: {
        requested: selected.length,
        scored: scored.filter((candidate) => candidate.status === "SCORED").length,
        noAction: scored.filter((candidate) => candidate.status === "NO ACTION").length,
        highQuality: scored.filter((candidate) => candidate.dataQuality === "HIGH").length,
        mediumQuality: scored.filter((candidate) => candidate.dataQuality === "MEDIUM").length,
        lowQuality: scored.filter((candidate) => candidate.dataQuality === "LOW").length,
        invalid: scored.filter((candidate) => candidate.dataQuality === "INVALID").length,
      },
      candidates: scored,
    };
  });
}
