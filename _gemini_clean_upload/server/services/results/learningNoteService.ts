/**
 * Results orchestrator: grade a pick, build a structured learning note (AI-backed),
 * persist it to the ledger, and surface the updated trust for the capper.
 */
import { PickRecord, ResultStatus, LearningNote } from "./resultTypes";
import { gradePick, getPick } from "../trust/resultLedgerService";
import { getCapperTrust, invalidateCapperTrust } from "../trust/trustScoreService";
import { generateLearningNote } from "../ai/learningNoteService";

export async function buildLearningNote(pick: PickRecord, result: ResultStatus, whatActuallyHappened: string): Promise<LearningNote> {
  const ai = await generateLearningNote({
    pickId: pick.pickId,
    result: result === "pending" ? "push" : result,
    originalLogic: pick.reasons?.join("; ") || pick.selection,
    whatActuallyHappened,
  });

  const won = result === "win";
  const lost = result === "loss";
  return {
    pickId: pick.pickId,
    result,
    originalLogic: pick.reasons?.join("; ") || pick.selection,
    whatActuallyHappened,
    whyWon: won ? "Modeled edge aligned with the outcome." : null,
    whyLost: lost ? "Variance or unmodeled inputs outweighed the lean." : null,
    dataWasCorrect: won,
    dataWasMisleading: lost,
    futureAdjustment: "Wire lineup + Statcast inputs and keep sample size in mind before trusting one result.",
    note: ai.note,
  };
}

export interface GradeAndLearnResult {
  pick: PickRecord | undefined;
  learningNote: LearningNote | null;
  capperTrust: ReturnType<typeof getCapperTrust> | null;
}

/** Grade a pick by id, attach a learning note, and return refreshed trust. */
export async function gradeAndLearn(
  pickId: string,
  result: ResultStatus,
  whatActuallyHappened = "Final result recorded."
): Promise<GradeAndLearnResult> {
  const existing = getPick(pickId);
  if (!existing) return { pick: undefined, learningNote: null, capperTrust: null };

  const note = await buildLearningNote(existing, result, whatActuallyHappened);
  const pick = gradePick(pickId, result, note);
  // Grading changes the record, so drop the stale trust cache before recomputing.
  if (pick) invalidateCapperTrust(pick.capperId);
  const capperTrust = pick ? getCapperTrust(pick.capperId) : null;
  return { pick, learningNote: note, capperTrust };
}
