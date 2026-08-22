import dotenv from "dotenv";
import { getSupabaseAdmin } from "../server/middleware/auth";

dotenv.config();
dotenv.config({ path: ".env.local", override: true });

type EvaluationRow = { probability: number; outcome: 0 | 1 };

function clampProbability(value: number): number {
  return Math.min(1 - 1e-9, Math.max(1e-9, value));
}

function brier(rows: EvaluationRow[]): number {
  return rows.reduce((sum, row) => sum + (row.probability - row.outcome) ** 2, 0) / rows.length;
}

function logLoss(rows: EvaluationRow[]): number {
  return -rows.reduce((sum, row) => {
    const p = clampProbability(row.probability);
    return sum + row.outcome * Math.log(p) + (1 - row.outcome) * Math.log(1 - p);
  }, 0) / rows.length;
}

async function main(): Promise<void> {
  const db = await getSupabaseAdmin();
  const { data: candidates, error: candidateError } = await db
    .from("nfl_td_candidate_snapshots")
    .select("provider_player_id,model_score,nfl_td_board_snapshots!inner(slate_date)")
    .not("model_score", "is", null)
    .order("created_at", { ascending: true });
  if (candidateError) throw new Error(candidateError.message);

  const { data: outcomes, error: outcomeError } = await db
    .from("nfl_td_outcomes")
    .select("slate_date,provider_player_id,touchdowns");
  if (outcomeError) throw new Error(outcomeError.message);

  const outcomeIndex = new Map(
    (outcomes ?? []).map((row: any) => [
      `${row.slate_date}:${row.provider_player_id}`,
      Number(row.touchdowns) > 0 ? 1 : 0,
    ]),
  );

  const rows: EvaluationRow[] = [];
  for (const candidate of candidates ?? []) {
    const board = Array.isArray((candidate as any).nfl_td_board_snapshots)
      ? (candidate as any).nfl_td_board_snapshots[0]
      : (candidate as any).nfl_td_board_snapshots;
    const outcome = outcomeIndex.get(`${board?.slate_date}:${(candidate as any).provider_player_id}`);
    if (outcome !== 0 && outcome !== 1) continue;
    rows.push({
      probability: clampProbability(Number((candidate as any).model_score) / 100),
      outcome,
    });
  }

  if (rows.length === 0) {
    console.log("[TD_BACKTEST_V2] no paired source-backed predictions and outcomes; promotion blocked");
    return;
  }

  const baseRate = rows.reduce((sum, row) => sum + row.outcome, 0) / rows.length;
  const baseline = rows.map((row) => ({ probability: baseRate, outcome: row.outcome }));
  const report = {
    sampleSize: rows.length,
    touchdownRate: baseRate,
    model: { brier: brier(rows), logLoss: logLoss(rows) },
    baseline: { brier: brier(baseline), logLoss: logLoss(baseline) },
  };
  const promoted = rows.length >= 500
    && report.model.brier < report.baseline.brier
    && report.model.logLoss < report.baseline.logLoss;

  console.log(JSON.stringify({ ...report, promotion: promoted ? "eligible" : "blocked" }, null, 2));
}

main().catch((error) => {
  console.error("[TD_BACKTEST_V2] failed", error);
  process.exitCode = 1;
});
