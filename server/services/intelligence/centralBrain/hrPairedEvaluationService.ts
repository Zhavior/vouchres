import { getSupabaseAdmin } from "../../../middleware/auth";
import { structuredLog } from "../../../lib/structuredLog";
import {
  decideModelPromotion,
  evaluateBinaryPredictions,
  type EvaluatedPrediction,
  type ModelEvaluation,
  type PromotionDecision,
} from "./modelEvaluation";

export const HR_PAIRED_TABLE = "hr_paired_model_predictions";
export const HR_INCUMBENT_ENGINE_VERSION = "production-hr-score";

export function buildHrObservationKey(date: string, gamePk: string | number, playerId: string | number): string {
  return `mlb:home_run:${date}:${String(gamePk)}:${String(playerId)}`;
}

export interface HrPairedEvaluationReport {
  status: "INSUFFICIENT_DATA" | "CHALLENGER_BEHIND" | "CHALLENGER_NOT_ELIGIBLE" | "CHALLENGER_ELIGIBLE_FOR_PROMOTION";
  promotionEligible: boolean;
  incumbentModelVersions: string[];
  challengerModelVersions: string[];
  pairedObservations: number;
  positiveOutcomes: number;
  dropped: { missingOutcome: number; temporalLeakage: number; invalidPrediction: number };
  incumbent: ModelEvaluation;
  challenger: ModelEvaluation;
  brierImprovement: number;
  reasons: string[];
}

type PairRow = {
  observation_key: string;
  game_pk: string;
  player_id: string;
  scheduled_first_pitch: string;
  prediction_generated_at: string;
  incumbent_probability: number;
  incumbent_engine_version: string;
  challenger_probability: number;
  challenger_engine_version: string;
};

function emptyEvaluation(): ModelEvaluation {
  return evaluateBinaryPredictions([]);
}

function statusFor(decision: PromotionDecision): HrPairedEvaluationReport["status"] {
  if (decision.challenger.samples < 250 || decision.challenger.positives < 20) return "INSUFFICIENT_DATA";
  if (decision.challenger.logLoss >= decision.incumbent.logLoss || decision.challenger.brierScore >= decision.incumbent.brierScore) {
    return "CHALLENGER_BEHIND";
  }
  return "CHALLENGER_NOT_ELIGIBLE";
}

export async function persistHrV2PairedPrediction(input: {
  date: string;
  gamePk: string | number;
  playerId: string | number;
  scheduledFirstPitch: string;
  predictionGeneratedAt: string;
  incumbentProbability: number;
  challengerProbability: number;
  challengerEngineVersion: string;
}): Promise<boolean> {
  const generated = new Date(input.predictionGeneratedAt).getTime();
  const scheduled = new Date(input.scheduledFirstPitch).getTime();
  if (!Number.isFinite(generated) || !Number.isFinite(scheduled) || generated >= scheduled) {
    throw new Error("HR paired prediction must be generated before first pitch.");
  }
  if (![input.incumbentProbability, input.challengerProbability].every((value) => Number.isFinite(value) && value >= 0 && value <= 1)) {
    throw new Error("HR paired prediction probabilities must be finite values between 0 and 1.");
  }

  const supabase = await getSupabaseAdmin();
  const { error } = await supabase.from(HR_PAIRED_TABLE).upsert({
    observation_key: buildHrObservationKey(input.date, input.gamePk, input.playerId),
    slate_date: input.date,
    game_pk: String(input.gamePk),
    player_id: String(input.playerId),
    scheduled_first_pitch: new Date(scheduled).toISOString(),
    prediction_generated_at: new Date(generated).toISOString(),
    incumbent_probability: input.incumbentProbability,
    incumbent_engine_version: HR_INCUMBENT_ENGINE_VERSION,
    challenger_probability: input.challengerProbability,
    challenger_engine_version: input.challengerEngineVersion,
  }, { onConflict: "observation_key", ignoreDuplicates: true });
  if (error) throw error;
  return true;
}

export async function evaluatePairedHrHistory(limit = 10_000): Promise<HrPairedEvaluationReport> {
  const supabase = await getSupabaseAdmin();
  const [{ data: pairRows, error: pairError }, { data: outcomeRows, error: outcomeError }] = await Promise.all([
    supabase.from(HR_PAIRED_TABLE).select("observation_key,game_pk,player_id,scheduled_first_pitch,prediction_generated_at,incumbent_probability,incumbent_engine_version,challenger_probability,challenger_engine_version").order("slate_date", { ascending: true }).limit(Math.max(1, Math.min(limit, 50_000))),
    supabase.from("hr_game_outcomes").select("game_pk,player_id,hr_flag").limit(Math.max(1, Math.min(limit, 50_000))),
  ]);
  if (pairError) throw pairError;
  if (outcomeError) throw outcomeError;

  const outcomes = new Map((outcomeRows ?? []).map((row: any) => [`${row.game_pk}:${row.player_id}`, row.hr_flag ? 1 as const : 0 as const]));
  const incumbent: EvaluatedPrediction[] = [];
  const challenger: EvaluatedPrediction[] = [];
  const incumbentVersions = new Set<string>();
  const challengerVersions = new Set<string>();
  const dropped = { missingOutcome: 0, temporalLeakage: 0, invalidPrediction: 0 };

  for (const row of (pairRows ?? []) as PairRow[]) {
    const generated = new Date(row.prediction_generated_at).getTime();
    const scheduled = new Date(row.scheduled_first_pitch).getTime();
    if (!Number.isFinite(generated) || !Number.isFinite(scheduled) || generated >= scheduled) {
      dropped.temporalLeakage += 1;
      continue;
    }
    const outcome = outcomes.get(`${row.game_pk}:${row.player_id}`);
    if (outcome == null) {
      dropped.missingOutcome += 1;
      continue;
    }
    if (![row.incumbent_probability, row.challenger_probability].every((value) => value != null && Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 1)) {
      dropped.invalidPrediction += 1;
      continue;
    }
    incumbent.push({ probability: Number(row.incumbent_probability), outcome });
    challenger.push({ probability: Number(row.challenger_probability), outcome });
    incumbentVersions.add(row.incumbent_engine_version);
    challengerVersions.add(row.challenger_engine_version);
  }

  const decision = decideModelPromotion({ challenger, incumbent });
  const report: HrPairedEvaluationReport = {
    status: decision.promote ? "CHALLENGER_ELIGIBLE_FOR_PROMOTION" : statusFor(decision),
    promotionEligible: decision.promote,
    incumbentModelVersions: [...incumbentVersions].sort(),
    challengerModelVersions: [...challengerVersions].sort(),
    pairedObservations: challenger.length,
    positiveOutcomes: decision.challenger.positives,
    dropped,
    incumbent: decision.incumbent,
    challenger: decision.challenger,
    brierImprovement: Number((decision.incumbent.brierScore - decision.challenger.brierScore).toFixed(6)),
    reasons: decision.reasons,
  };
  structuredLog({ level: "info", event: "brain.hr.paired_evaluation.completed", pairedObservations: report.pairedObservations, evaluationStatus: report.status, promotionEligible: report.promotionEligible });
  return report;
}
