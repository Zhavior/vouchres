import type { HrCandidate } from "./hrEngineTypes";
import {
  TEAM_MISMATCH_REASON,
  hasTeamAssignmentMismatch,
  teamAssignmentMismatchDetail,
} from "../teamAssignmentSafety";

/**
 * Preview trust gate for HR Engine Pro.
 * Blocks stale/mismatched team assignments via structured team IDs — never a name handlist.
 * This path never promotes rows into candidates[]; callers keep candidates: [].
 */
export function applyTrustGate(candidates: HrCandidate[]) {
  const accepted: HrCandidate[] = [];
  const blocked: string[] = [];
  let pitcherMissingBlocked = 0;
  let trueTeamMismatchBlocked = 0;

  for (const candidate of candidates) {
    if (
      hasTeamAssignmentMismatch({
        teamId: candidate.teamId,
        sourceTeamId: candidate.sourceTeamId,
        activeRosterTeamId: candidate.activeRosterTeamId,
        currentTeamId: candidate.currentTeamId,
      })
    ) {
      trueTeamMismatchBlocked += 1;
      blocked.push(
        `${candidate.playerName}|${candidate.team}|${teamAssignmentMismatchDetail({
          teamId: candidate.teamId,
          sourceTeamId: candidate.sourceTeamId,
          activeRosterTeamId: candidate.activeRosterTeamId,
          currentTeamId: candidate.currentTeamId,
        })}`,
      );
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
      teamMismatchBlocked: blocked,
      teamMismatchReason: TEAM_MISMATCH_REASON,
      trueTeamMismatchBlocked,
      pitcherMissingBlocked,
    },
  };
}
