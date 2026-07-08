import { summarizeGradeRun, type GradeResult } from "../server/services/grading/gradingService";
import { settleParlay } from "../server/services/grading/sportGraders";

const graded: GradeResult[] = [
  { pick_id: "pick-win", status: "won", settled_units: 1.2, game_date: "2026-06-30" },
  { pick_id: "pick-loss", status: "lost", settled_units: -1, game_date: "2026-06-30" },
  { pick_id: "pick-push", status: "push", settled_units: 0, game_date: "2026-06-30" },
];

const skipped: GradeResult[] = [
  {
    pick_id: "pick-pending",
    status: "graded_error",
    settled_units: null,
    error: "game not final (isComplete=false)",
    warnings: ["Game data missing for event 123: game not final (isComplete=false)"],
  },
];

const summary = summarizeGradeRun(graded, skipped, 4);
if (summary.total_pending !== 1) throw new Error(`expected 1 pending, got ${summary.total_pending}`);
if (summary.total_graded !== 3) throw new Error(`expected 3 graded, got ${summary.total_graded}`);
if (summary.wins !== 1 || summary.losses !== 1 || summary.pushes !== 1) {
  throw new Error(`unexpected summary counts: ${JSON.stringify(summary)}`);
}
if (summary.warnings.length === 0) throw new Error("expected missing-game warning");

const parlayOne = settleParlay(
  [
    { outcome: { status: "won" }, oddsDecimal: 2.1 },
    { outcome: { status: "push" }, oddsDecimal: 1.8 },
    { outcome: { status: "won" }, oddsDecimal: 1.9 },
  ],
  1
);
const parlayTwo = settleParlay(
  [
    { outcome: { status: "won" }, oddsDecimal: 2.1 },
    { outcome: { status: "push" }, oddsDecimal: 1.8 },
    { outcome: { status: "won" }, oddsDecimal: 1.9 },
  ],
  1
);

if (JSON.stringify(parlayOne) !== JSON.stringify(parlayTwo)) {
  throw new Error("parlay settlement is not idempotent");
}
if (parlayOne.status !== "won" || parlayOne.settledUnits !== 2.99) {
  throw new Error(`unexpected parlay settlement: ${JSON.stringify(parlayOne)}`);
}

console.log(JSON.stringify({ ok: true, summary, parlay: parlayOne }, null, 2));

