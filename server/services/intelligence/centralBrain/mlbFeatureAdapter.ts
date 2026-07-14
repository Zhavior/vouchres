import { getCachedValidatedHrBoard } from "../../hubs/hrBoardHub";
import { getScheduleByDate, todayISO } from "../../mlb/mlbClient";
import type { ScoredHrCandidate } from "../../mlb/hrValidation";
import { BrainFeatureSnapshotSchema, type BrainFeatureAdapter, type BrainFeatureSnapshot } from "./featureSchemas";

export const MLB_HR_FEATURE_ADAPTER_VERSION = "mlb-hr-features@1";

function quality(candidate: ScoredHrCandidate): BrainFeatureSnapshot["quality"] {
  if (candidate.dataQuality === "full") return "full";
  if (candidate.dataQuality === "partial") return "partial";
  return "limited";
}

function candidateSnapshot(
  candidate: ScoredHrCandidate,
  observedAt: string,
  scheduledAt: string,
  homeAway: "home" | "away",
): BrainFeatureSnapshot {
  const breakdown = candidate.scoreBreakdown;
  const missingFeatures = [
    ...(candidate.opponentPitcherId > 0 ? [] : ["opponentPitcher"]),
    ...(typeof candidate.parkFactor === "number" ? [] : ["parkFactor"]),
    "weather",
  ];

  return BrainFeatureSnapshotSchema.parse({
    schemaVersion: "1.0",
    sport: "mlb",
    market: "home_run",
    eventId: String(candidate.gamePk),
    subjectId: String(candidate.playerId),
    subjectLabel: candidate.playerName,
    team: candidate.team,
    opponent: candidate.opponent,
    observedAt,
    scheduledAt,
    adapterVersion: MLB_HR_FEATURE_ADAPTER_VERSION,
    quality: quality(candidate),
    eligibility: candidate.status === "blocked" ? "blocked" : candidate.lineupStatus === "confirmed" ? "eligible" : "preview",
    features: {
      rawHrScore: candidate.hrScore,
      estimatedHrProbability: candidate.estimatedHrProbability ?? null,
      dataConfidence: candidate.dataConfidence,
      hitterPower: breakdown?.hitterPower ?? null,
      pitcherVulnerability: breakdown?.pitcherVulnerability ?? null,
      recentForm: breakdown?.recentForm ?? null,
      parkContext: breakdown?.parkContext ?? null,
      parkFactor: candidate.parkFactor ?? null,
      lineupVolume: breakdown?.lineupVolume ?? null,
      handednessEdge: breakdown?.handednessEdge ?? null,
      penalties: breakdown?.penalties ?? null,
      battingOrder: candidate.battingOrder ?? null,
      lineupConfirmed: candidate.lineupStatus === "confirmed",
      homeAway,
      opponentPitcherId: candidate.opponentPitcherId || null,
      opponentPitcherName: candidate.opponentPitcherName || null,
      riskTier: candidate.riskTier,
    },
    missingFeatures,
    reasons: candidate.reasons.slice(0, 12),
    risks: candidate.warnings.slice(0, 12),
    evidence: [
      { feature: "schedule", source: "MLB Stats API schedule", status: "verified", observedAt },
      { feature: "activeRoster", source: "MLB Stats API active rosters", status: "verified", observedAt },
      { feature: "lineup", source: "MLB Stats API boxscore", status: candidate.lineupStatus === "confirmed" ? "verified" : "projected", observedAt },
      { feature: "opponentPitcher", source: "MLB Stats API probable pitchers", status: candidate.opponentPitcherId > 0 ? "verified" : "missing", observedAt },
      { feature: "parkFactor", source: "VouchEdge sourced park-factor table", status: typeof candidate.parkFactor === "number" ? "verified" : "missing", observedAt },
      { feature: "weather", source: "No provider connected", status: "missing", observedAt },
    ],
  });
}

export const mlbHrFeatureAdapter: BrainFeatureAdapter<{ date?: string }> = {
  sport: "mlb",
  market: "home_run",
  adapterVersion: MLB_HR_FEATURE_ADAPTER_VERSION,
  async build(input) {
    const date = input.date ?? todayISO();
    const [board, games] = await Promise.all([getCachedValidatedHrBoard(date), getScheduleByDate(date)]);
    const gameContexts = new Map(games.map((game) => [game.gamePk, {
      scheduledAt: game.gameDate,
      homeTeamId: game.homeTeam.teamId,
    }]));
    const candidates = board.candidates;
    const observedAt = board.debug.lastRefresh;

    return candidates.flatMap((candidate) => {
      const game = gameContexts.get(candidate.gamePk);
      if (!game) return [];
      return [candidateSnapshot(candidate, observedAt, game.scheduledAt, candidate.teamId === game.homeTeamId ? "home" : "away")];
    });
  },
};
