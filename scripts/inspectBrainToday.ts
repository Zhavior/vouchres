import { scanMlbSlate } from "../server/services/intelligence/centralBrain/brainScanService";
import {
  buildLiveBrainHrPicks,
  buildLiveBrainPitcherKPicks,
  buildLiveBrainStolenBasePicks,
} from "../server/services/intelligence/centralBrain/brainLedgerService";
import { todayISO } from "../server/services/mlb/mlbClient";

const date = todayISO();
console.log("DATE", date);

const scan = await scanMlbSlate(date);
console.log("\n=== BRAIN SCAN ===");
console.log(
  JSON.stringify(
    {
      coverage: scan.coverage,
      temporal: scan.temporal,
      markets: Object.fromEntries(
        Object.entries(scan.markets).map(([k, v]) => [
          k,
          { readiness: v.readiness, state: v.state, blockers: v.blockers },
        ]),
      ),
      sources: scan.sources.map((s) => ({
        key: s.key,
        status: s.status,
        coverage: s.coverage,
        note: s.note,
      })),
      warnings: scan.warnings.slice(0, 8),
    },
    null,
    2,
  ),
);

const [hr, sb, k] = await Promise.all([
  buildLiveBrainHrPicks(date),
  buildLiveBrainStolenBasePicks(date),
  buildLiveBrainPitcherKPicks(date),
]);

console.log("\n=== LIVE HR PICKS ===", hr.length);
console.log(
  JSON.stringify(
    hr.slice(0, 12).map((p) => ({
      rank: p.rank,
      player: p.playerName,
      team: p.team,
      opp: p.opponent,
      score: p.score,
      conf: p.confidence,
      evidence: p.evidenceQuality,
      tier: p.tier,
      reasons: p.reasons.slice(0, 2),
    })),
    null,
    2,
  ),
);

console.log("\n=== LIVE SB PICKS ===", sb.length);
console.log(
  JSON.stringify(
    sb.slice(0, 8).map((p) => ({
      rank: p.rank,
      player: p.playerName,
      team: p.team,
      score: p.score,
      evidence: p.evidenceQuality,
    })),
    null,
    2,
  ),
);

console.log("\n=== LIVE PITCHER K PICKS ===", k.length);
console.log(
  JSON.stringify(
    k.slice(0, 8).map((p) => ({
      rank: p.rank,
      player: p.playerName,
      team: p.team,
      score: p.score,
      conf: p.confidence,
    })),
    null,
    2,
  ),
);
