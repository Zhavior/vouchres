/** CLI: Brand Craft Market Agent — market-graphics bar (human veto). */
import { judgeRepoBrandCraftMarket } from "../server/services/judging/brandCraftMarketAgent";

const v = judgeRepoBrandCraftMarket();

console.log("\n=== Brand Craft Market Agent (BC) ===\n");
console.log(`Final: ${v.finalScore}/100  ·  Status: ${v.marketShipStatus}  ·  ${v.confidence}`);
console.log(`marketReady: ${v.marketReady} (human veto always required)\n`);

console.log("Market bar:");
for (const b of v.marketBar) console.log(`  · ${b}`);
console.log("");

for (const j of v.judges) {
  console.log(`— ${j.judge}: ${j.score}/100`);
  for (const n of j.notes.slice(0, 3)) console.log(`   · ${n}`);
  for (const f of j.flags) console.log(`   ! ${f}`);
  console.log("");
}

if (v.killList.length) {
  console.log("Kill list:");
  for (const k of v.killList) console.log(`  - ${k}`);
  console.log("");
}

console.log("Letter brief:");
for (const b of v.letterBrief) console.log(`  · ${b}`);
console.log("\nNext actions:");
for (const a of v.nextActions) console.log(`  → ${a}`);
console.log("\nResearch:");
for (const r of v.researchNotes) console.log(`  · ${r}`);
console.log("");

if (v.marketShipStatus === "Reject" || v.marketShipStatus === "AI-cliché") {
  process.exitCode = 2;
}
