/**
 * Scheduled HR V2 shadow capture.
 *
 * This is deliberately separate from the staff diagnostics endpoint. A
 * report that is only generated when a person opens a page cannot produce a
 * trustworthy longitudinal evaluation set.
 */
import { getCachedValidatedHrBoard } from "../services/hubs/hrBoardHub";
import { buildHrV2ShadowReport } from "../services/mlb/hr-engine/v2/shadowService";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function runHrShadowCapture(date = todayISO()): Promise<void> {
  console.log(`[HR_SHADOW] start date=${date}`);
  const board = await getCachedValidatedHrBoard(date);
  const report = await buildHrV2ShadowReport(board.candidates, date);
  console.log(
    `[HR_SHADOW] done date=${date} requested=${report.summary.requested} ` +
      `scored=${report.summary.scored} persisted_candidates=${report.candidates.filter((candidate) => candidate.status === "SCORED" && candidate.pModel != null).length}`,
  );
}

async function main(): Promise<void> {
  try {
    await runHrShadowCapture();
    process.exit(0);
  } catch (error) {
    console.error("[HR_SHADOW] capture failed:", error);
    process.exit(1);
  }
}

if (process.argv[1] && process.argv[1].includes("hrShadowCapture")) {
  void main();
}
