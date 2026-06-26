/**
 * Result grader. Determines win/loss/push for a pick.
 * When a final game outcome is supplied it grades deterministically; otherwise it
 * leaves the pick pending. (Real auto-grading hooks into boxscore data later.)
 */
import { PickRecord, ResultStatus } from "./resultTypes";

export interface GameOutcome {
  gamePk?: number;
  final: boolean;
  // Minimal outcome signals the grader can use today.
  hitHomeRun?: boolean; // for HR markets
  teamRuns?: number; // for team-total markets
  line?: number; // the line a total/over was set at
}

/** Grade a pick against a known outcome. Returns "pending" if the game isn't final. */
export function gradeResult(pick: PickRecord, outcome: GameOutcome): ResultStatus {
  if (!outcome.final) return "pending";

  const market = pick.market.toLowerCase();
  if (market.includes("hr") || market.includes("home run")) {
    return outcome.hitHomeRun ? "win" : "loss";
  }
  if ((market.includes("total") || market.includes("team total")) && typeof outcome.teamRuns === "number" && typeof outcome.line === "number") {
    if (outcome.teamRuns === outcome.line) return "push";
    return outcome.teamRuns > outcome.line ? "win" : "loss";
  }
  // Unknown market with a final game: leave undecided rather than guess.
  return "pending";
}

/** Convenience: should this pick be auto-graded now? */
export function canAutoGrade(pick: PickRecord, outcome: GameOutcome): boolean {
  return pick.status === "pending" && outcome.final;
}
