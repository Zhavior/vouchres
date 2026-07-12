import { getSupabaseAdmin } from "../../../middleware/auth";
import { evaluateBinaryPredictions, type ModelEvaluation } from "./modelEvaluation";
import { BrainFeatureSnapshotSchema } from "./featureSchemas";

export interface BrainModelRecord {
  engineVersion: string;
  samples: number;
  evaluation: ModelEvaluation | null;
  excluded: { missingProbability: number; invalidSnapshot: number; temporalLeakage: number };
  readyForJudgment: boolean;
}

function emptyRecord(engineVersion: string): BrainModelRecord {
  return {
    engineVersion,
    samples: 0,
    evaluation: null,
    excluded: { missingProbability: 0, invalidSnapshot: 0, temporalLeakage: 0 },
    readyForJudgment: false,
  };
}

export async function evaluateBrainHrHistory(limit = 5_000): Promise<BrainModelRecord[]> {
  const supabase = await getSupabaseAdmin();
  const { data, error } = await supabase
    .from("brain_decisions")
    .select("engine_version,feature_snapshot,brain_decision_outcomes!inner(result)")
    .eq("sport", "mlb")
    .eq("market", "home_run")
    .in("brain_decision_outcomes.result", ["hit", "miss"])
    .order("decision_date", { ascending: true })
    .limit(Math.max(1, Math.min(limit, 10_000)));
  if (error) throw error;

  const records = new Map<string, BrainModelRecord & { predictions: Array<{ probability: number; outcome: 0 | 1 }> }>();
  for (const row of data ?? []) {
    const engineVersion = String(row.engine_version);
    const record = records.get(engineVersion) ?? { ...emptyRecord(engineVersion), predictions: [] };
    records.set(engineVersion, record);

    const parsed = BrainFeatureSnapshotSchema.safeParse(row.feature_snapshot);
    if (!parsed.success) {
      record.excluded.invalidSnapshot += 1;
      continue;
    }
    const snapshot = parsed.data;
    if (new Date(snapshot.observedAt).getTime() >= new Date(snapshot.scheduledAt).getTime()) {
      record.excluded.temporalLeakage += 1;
      continue;
    }
    const probability = snapshot.features.estimatedHrProbability;
    if (typeof probability !== "number" || probability <= 0 || probability >= 1) {
      record.excluded.missingProbability += 1;
      continue;
    }
    const joinedOutcome = row.brain_decision_outcomes as { result?: string } | Array<{ result?: string }>;
    const result = Array.isArray(joinedOutcome) ? joinedOutcome[0]?.result : joinedOutcome?.result;
    if (result !== "hit" && result !== "miss") continue;
    record.predictions.push({ probability, outcome: result === "hit" ? 1 : 0 });
  }

  return [...records.values()].map(({ predictions, ...record }) => ({
    ...record,
    samples: predictions.length,
    evaluation: predictions.length ? evaluateBinaryPredictions(predictions) : null,
    readyForJudgment: predictions.length >= 250 && predictions.filter((item) => item.outcome === 1).length >= 20,
  }));
}
