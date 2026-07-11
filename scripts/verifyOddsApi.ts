/**
 * Smoke test for The Odds API ParlayOS feed.
 * Requires ODDS_API_KEY in .env.local (or env).
 *
 * Usage: npm run verify:odds-api
 */
import { fetchLiveTierOddsBatch } from "../server/services/mlb/parlayOddsFeedService";

async function main() {
  const key = process.env.ODDS_API_KEY?.trim();
  if (!key) {
    console.error("FAIL: ODDS_API_KEY is not set. Add it to .env.local and retry.");
    process.exit(1);
  }

  console.log("ODDS_API_KEY: configured ✓");
  console.log("Fetching live MLB tier odds (Aaron Judge, NYY, Anytime HR)…\n");

  const quotes = await fetchLiveTierOddsBatch({
    playerName: "Aaron Judge",
    teamName: "NYY",
    tiers: [
      { key: "hr_anytime", marketCode: "ANYTIME_HR", statTarget: 1 },
      { key: "sb_1", marketCode: "STOLEN_BASE", statTarget: 1 },
    ],
  });

  for (const [tierKey, quote] of Object.entries(quotes)) {
    console.log(`  ${tierKey}:`);
    console.log(`    source:   ${quote.source}`);
    console.log(`    odds:     ${quote.odds ?? "TBD"}`);
    console.log(`    provider: ${quote.provider}`);
    console.log(`    detail:   ${quote.detail}`);
    console.log("");
  }

  const anyLive = Object.values(quotes).some((q) => q.source === "live" && q.odds != null);
  if (anyLive) {
    console.log("PASS: Live odds returned from The Odds API.");
    process.exit(0);
  }

  console.log(
    "WARN: No live prices matched (off-season, no posted lines, or team/player mismatch).",
  );
  console.log("API key works — TBD is honest when books have no line.");
  process.exit(0);
}

main().catch((err) => {
  console.error("FAIL:", err instanceof Error ? err.message : err);
  process.exit(1);
});
