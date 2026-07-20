import { previewUserParlaySave } from "../server/services/parlays/parlayCreationService";

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

async function main() {
  const sampleUserId = "00000000-0000-4000-8000-000000000123";
  const samplePayload = {
    title: "Judge + Soto HR ladder",
    mode: "PRACTICE" as const,
    source: "manual_builder",
    wagerAmount: 2,
    edgeScore: 78,
    explanation: "Testing the dry-run save path without touching the database.",
    clientRef: "preview-smoke-001",
    legs: [
      {
        gamePk: "777001",
        sport: "mlb",
        teamId: "147",
        playerId: 592450,
        market: "Anytime HR",
        marketCode: "HR",
        selection: "Aaron Judge to hit a home run",
        odds: 310,
      },
      {
        gamePk: "777001",
        sport: "mlb",
        teamId: "147",
        playerId: 665489,
        market: "Anytime HR",
        marketCode: "HR",
        selection: "Juan Soto to hit a home run",
        odds: 360,
      },
    ],
  };

  const preview = await previewUserParlaySave({
    userId: sampleUserId,
    body: samplePayload,
  });

  assert(preview.ok === true, "Preview should succeed.");
  assert(preview.dryRun === true, "Preview must be dryRun.");
  assert(preview.summary.legCount === 2, "Preview should report two legs.");
  assert(preview.summary.source === "manual", "manual_builder should normalize to manual.");
  assert(preview.summary.combinedOdds !== null, "Combined odds should be computed.");
  assert(preview.canonical.parent.user_id === sampleUserId, "Canonical parent should keep the user id.");
  assert(Array.isArray(preview.canonical.legs) && preview.canonical.legs.length === 2, "Canonical legs should be present.");
  assert(preview.canonical.legs.every((leg) => leg.market_code === "ANYTIME_HR"), "HR markets should normalize to ANYTIME_HR.");

  console.log(JSON.stringify({
    ok: true,
    mode: "parlay_save_preview_verify",
    checkedAt: new Date().toISOString(),
    previewSummary: preview.summary,
    warningCount: preview.warnings.length,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
