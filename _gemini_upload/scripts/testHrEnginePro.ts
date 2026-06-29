import { buildHrBoardResponse } from "../server/services/mlb/hr-engine";

async function main() {
  const board = await buildHrBoardResponse({
    previewLimit: 50,
  });

  console.log("status:", board.status);
  console.log("date:", board.date);
  console.log("gameCount:", board.gameCount);
  console.log("candidates:", board.candidates.length);
  console.log("projectedCandidates:", board.projectedCandidates.length);
  console.log("previewMeta:", board.previewMeta);
  console.log("runtime:", board.runtime);
  console.log("badPairingAuditBlocked:", board.debug.badPairingAuditBlocked);
  console.log("pitcherMissingBlocked:", board.debug.pitcherMissingBlocked);

  console.log("\nTop 15 detailed:");
  for (const [index, pick] of board.projectedCandidates.slice(0, 15).entries()) {
    console.log("\n#", index + 1, pick.playerName, "|", pick.team);
    console.log("score:", pick.hrScore, "| tier:", pick.riskTier);
    console.log("pitcher:", pick.opponentPitcherName, "| venue:", pick.venue);
    console.log("breakdown:", pick.scoreBreakdown);
    console.log("recentForm:", pick.recentForm);
    console.log("reasons:");
    for (const reason of pick.reasons.slice(0, 8)) {
      console.log(" -", reason);
    }
    console.log("warnings:");
    for (const warning of pick.warnings.slice(0, 4)) {
      console.log(" -", warning);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
