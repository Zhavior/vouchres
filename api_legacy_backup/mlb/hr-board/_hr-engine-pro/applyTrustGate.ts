import type { HrCandidate } from "./hrEngineTypes.js";

const BAD_PAIRINGS = new Set([
  "Pete Alonso|BAL",
  "Willson Contreras|BOS",
  "Bo Bichette|NYM",
  "Alex Bregman|CHC",
  "Brandon Lowe|PIT",
  "Rhys Hoskins|CLE",
  "Rob Refsnyder|SEA",
]);

export function applyTrustGate(candidates: HrCandidate[]) {
  const accepted: HrCandidate[] = [];
  const blocked: string[] = [];
  let pitcherMissingBlocked = 0;

  for (const candidate of candidates) {
    const badPairKey = `${candidate.playerName}|${candidate.team}`;

    if (BAD_PAIRINGS.has(badPairKey)) {
      blocked.push(badPairKey);
      continue;
    }

    if (!candidate.opponentPitcherName || candidate.opponentPitcherName === "TBD") {
      pitcherMissingBlocked++;
      accepted.push({
        ...candidate,
        dataConfidence: Math.min(candidate.dataConfidence, 50),
        riskTier: "Longshot",
        warnings: [
          ...candidate.warnings,
          "Opposing pitcher is missing or TBD. This row is watchlist quality only.",
        ],
      });
      continue;
    }

    accepted.push(candidate);
  }

  return {
    accepted,
    debug: {
      badPairingAuditBlocked: blocked,
      pitcherMissingBlocked,
    },
  };
}
