import { getSharedDailyReport } from "../mlbIntelligenceEngine";
import type {
  CentralBrainAdapter,
  CentralBrainDecision,
  CentralBrainQuality,
} from "./contracts";

export type MlbCentralBrainInput = { date?: string };

function confidenceValue(confidence: "Strong" | "Moderate" | "Speculative"): number {
  if (confidence === "Strong") return 80;
  if (confidence === "Moderate") return 65;
  return 45;
}

export const mlbCentralBrainAdapter: CentralBrainAdapter<MlbCentralBrainInput> = {
  sport: "mlb",
  engineVersion: "mlb-daily-report@1",
  async build(input) {
    const report = await getSharedDailyReport(input.date);
    const decisions: CentralBrainDecision[] = report.hrTargets.map((target, index) => ({
      id: target.targetId,
      subjectId: String(target.opposingPitcherId),
      subjectLabel: target.team,
      market: "matchup_home_run_environment",
      score: target.hrScore,
      confidence: confidenceValue(target.confidence),
      rank: index + 1,
      recommendation: target.label,
      reasons: target.reasons,
      risks: target.riskWarnings,
      evidence: [
        {
          id: `pitcher:${target.opposingPitcherId}`,
          label: `Matchup versus ${target.opposingPitcher}`,
          source: "shared_daily_mlb_report",
          status: target.dataQuality === "limited" ? "missing" : "verified",
          observedAt: report.generatedAt,
        },
      ],
      metadata: {
        team: target.team,
        opponent: target.opponent,
        opposingPitcher: target.opposingPitcher,
        judgeStatus: target.judgeStatus,
        sourceDataQuality: target.dataQuality,
      },
    }));

    return {
      scope: `daily:${report.date}`,
      generatedAt: report.generatedAt,
      dataQuality: report.dataQuality as CentralBrainQuality,
      decisions,
      warnings: report.warnings,
      disclaimer: report.disclaimer,
    };
  },
};
