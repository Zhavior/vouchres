/** CLI: run Brand Mark Judge panel on the shipping VE icon. */
import { judgeRepoBrandMark } from "../server/services/judging/brandMarkJudgeService";

const verdict = judgeRepoBrandMark();

console.log("\n=== VouchEdge Brand Mark Judge Panel (strict craft bar) ===\n");
console.log(`Final: ${verdict.finalScore}/100  ·  Craft: ${verdict.craftScore}/100`);
console.log(`Status: ${verdict.approvalStatus}  ·  ${verdict.confidence}`);
console.log(`Read:  ${verdict.marketingRead}\n`);
console.log(`Approve gate: final≥90 · craft≥85 · letters≥85\n`);

for (const j of verdict.judges) {
  console.log(`— ${j.judge}: ${j.score}/100`);
  for (const n of j.notes.slice(0, 3)) console.log(`   · ${n}`);
  for (const f of j.flags) console.log(`   ! ${f}`);
  console.log("");
}

if (verdict.whatCouldGoWrong.length) {
  console.log("What could go wrong:");
  for (const w of verdict.whatCouldGoWrong) console.log(`  - ${w}`);
  console.log("");
}

if (verdict.approvalStatus === "Needs more work" || verdict.approvalStatus === "Avoid") {
  process.exitCode = 2;
}
