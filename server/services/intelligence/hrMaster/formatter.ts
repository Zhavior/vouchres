import type { GameEvaluationOutput } from "./types";
import { formatAmericanOdds, formatEvPercent, formatPercent } from "./normalize";

export function formatGameEvaluationMarkdown(game: GameEvaluationOutput): string {
  const lines: string[] = [];

  lines.push(`## [Game Matchup: ${game.matchup}]`);
  lines.push(
    `**Starting Pitchers:** ${game.starting_pitchers.away} vs ${game.starting_pitchers.home}`,
  );
  lines.push("");
  lines.push("### Top Home Run Target Matrix");
  lines.push(
    "| Batter | Team | PCQI | ZFAS | PVM | EPV | OVS | HR Prob | Fair Odds | Market Odds | EV | Confidence | Status |",
  );
  lines.push(
    "| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |",
  );

  for (const row of game.matrix) {
    lines.push(
      `| ${row.batter_name} | ${row.team} | ${row.features.pcqi.toFixed(2)} | ${row.features.zfas.toFixed(2)} | ${row.features.pvm.toFixed(2)} | ${row.features.epv.toFixed(2)} | ${row.features.ovs.toFixed(2)} | ${formatPercent(row.hr_probability)} | ${formatAmericanOdds(row.odds.fair_american_odds)} | ${formatAmericanOdds(row.odds.market_american_odds)} | ${formatEvPercent(row.odds.expected_value)} | ${row.confidence} | ${row.status} |`,
    );
  }

  const targets = game.matrix.filter((r) => r.status === "VOUCHEDGE VERIFIED +EV TARGET");
  if (targets.length > 0) {
    lines.push("");
    lines.push("### Quantitative Breakdown");
    for (const target of targets) {
      lines.push(`#### ${target.batter_name} (${target.team})`);
      const q = target.quantitative_breakdown;
      if (!q) continue;
      lines.push("- Power Profile:");
      for (const [k, v] of Object.entries(q.power_profile)) {
        lines.push(`  - ${k}: ${v}`);
      }
      lines.push("- Pitch Overlap:");
      lines.push(`  - pitch_matchup_quality: ${q.pitch_overlap.pitch_matchup_quality}`);
      lines.push(`  - weak_pitch_sample: ${q.pitch_overlap.weak_pitch_sample}`);
      lines.push("- Vulnerability Layer:");
      for (const [k, v] of Object.entries(q.vulnerability_layer)) {
        lines.push(`  - ${k}: ${v}`);
      }
      lines.push("- Environment Layer:");
      for (const [k, v] of Object.entries(q.environment_layer)) {
        lines.push(`  - ${k}: ${v}`);
      }
      lines.push("- Market Layer:");
      for (const [k, v] of Object.entries(q.market_layer)) {
        lines.push(`  - ${k}: ${v}`);
      }
      lines.push("- Audit Ledger Recommendation:");
      lines.push(`  - raw_fractional_kelly: ${q.audit_ledger_recommendation.raw_fractional_kelly.toFixed(4)}`);
      lines.push(`  - risk_adjusted_fractional_kelly: ${q.audit_ledger_recommendation.risk_adjusted_fractional_kelly.toFixed(4)}`);
      lines.push(`  - minimum_playable_odds: ${q.audit_ledger_recommendation.minimum_playable_odds}`);
      lines.push(`  - unit_recommendation: ${q.audit_ledger_recommendation.unit_recommendation}`);
    }
  }

  if (game.market_discipline_notes.length > 0) {
    lines.push("");
    lines.push("### Market Discipline Notes");
    for (const note of game.market_discipline_notes) {
      lines.push(`- ${note}`);
    }
  }

  lines.push("");
  lines.push("### Integrity Block");
  lines.push(`- model_version: ${game.integrity_block.model_version}`);
  lines.push(`- calibration_method: ${game.integrity_block.calibration_method}`);
  lines.push(`- data_quality_summary: ${game.integrity_block.data_quality_summary}`);
  lines.push(`- lineup_status: ${game.integrity_block.lineup_status}`);
  lines.push(`- weather_status: ${game.integrity_block.weather_status}`);
  lines.push(`- market_timestamp_status: ${game.integrity_block.market_timestamp_status}`);

  return lines.join("\n");
}

export function formatEngineResultMarkdown(games: GameEvaluationOutput[]): string {
  return games.map(formatGameEvaluationMarkdown).join("\n\n---\n\n");
}
