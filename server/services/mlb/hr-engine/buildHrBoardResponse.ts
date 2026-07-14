import type { HrBoardResponse, HrEngineInput } from "./hrEngineTypes";
import { getTodaySlate, todayISO } from "./getTodaySlate";
import { buildEligiblePlayerPool } from "./buildEligiblePlayerPool";
import { calculateHrScore } from "./calculateHrScore";
import { applyTrustGate } from "./applyTrustGate";
import { rankHrCandidates } from "./rankHrCandidates";
import { attachHitterStats } from "./attachHitterStats";
import { attachRecentHitterForm } from "./attachRecentHitterForm";
import { attachPitcherStats } from "./attachPitcherStats";

export async function buildHrBoardResponse(input: HrEngineInput = {}): Promise<HrBoardResponse> {
  const date = input.date ?? todayISO();
  const previewLimit = input.previewLimit ?? 50;

  const games = await getTodaySlate(date);
  const { hitters: rosterHitters, warnings: rosterWarnings } = await buildEligiblePlayerPool(games);
  const season = String(new Date(date).getFullYear());

  const { hitters: hitterStatRows, warnings: hitterStatsWarnings } = await attachHitterStats(
    rosterHitters,
    season
  );

  const { hitters: recentFormRows, warnings: recentFormWarnings } = await attachRecentHitterForm(
    hitterStatRows,
    season
  );

  const { hitters, warnings: pitcherStatsWarnings } = await attachPitcherStats(
    recentFormRows,
    season
  );

  const scoredCandidates = hitters.map((hitter) => calculateHrScore(hitter));
  const trustGate = applyTrustGate(scoredCandidates);
  const rankedResult = rankHrCandidates(trustGate.accepted, previewLimit);

  return {
    status: "ready",
    date,
    season: String(new Date(date).getFullYear()),
    gameCount: games.length,

    candidates: [],
    projectedCandidates: rankedResult.projectedCandidates,

    previewMeta: {
      previewLimit: rankedResult.previewLimit,
      eligiblePreviewPoolCount: hitters.length,
      scoredPreviewPoolCount: trustGate.accepted.length,
      projectedPreviewCount: rankedResult.projectedCandidates.length,
    },

    debug: {
      runtime: "hr_engine_pro_v2",
      trueTeamMismatchBlocked: trustGate.debug.trueTeamMismatchBlocked,
      registryConflictWarnings: 0,
      pitcherMissingBlocked: trustGate.debug.pitcherMissingBlocked,
      hitterStatsMissingBlocked: 0,
      badPairingAuditBlocked: trustGate.debug.badPairingAuditBlocked,
      warnings: [
        ...rosterWarnings,
        ...hitterStatsWarnings,
        ...recentFormWarnings,
        ...pitcherStatsWarnings,
      ],
    },

    dataQuality: "projection_preview",
    source: "official_mlb_statsapi_hr_engine_pro_v2",
    runtime: "hr_engine_pro_v2",
    updatedAt: new Date().toISOString(),
    warning:
      "HR Engine Pro v2 preview is active. Official lineups are not confirmed unless candidates[] is populated.",
  };
}
