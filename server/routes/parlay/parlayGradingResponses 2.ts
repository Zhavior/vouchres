import type { GradeRunResult } from "../../services/grading/gradingService";

export function partitionGradeDueResult(result: GradeRunResult) {
  const { graded, skipped, summary } = result;
  const settled = graded.filter((row) => row.status !== "graded_error");
  const pending = skipped.filter(
    (row) => row.error?.includes("not final") || row.error?.includes("isComplete=false"),
  );
  const errors = skipped.filter(
    (row) => !row.error?.includes("not final") && !row.error?.includes("isComplete=false"),
  );
  return { settled, pending, errors, graded, skipped, summary };
}
