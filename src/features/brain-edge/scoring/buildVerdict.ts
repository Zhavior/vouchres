import type { Verdict } from "./verdictEngine";
import type { AggregateVerdict } from "./aggregateJudges";

export function buildVerdict(
  aggregate: AggregateVerdict
): Verdict {
  if (aggregate.overallScore >= 90) return "elite";
  if (aggregate.overallScore >= 75) return "strong";
  if (aggregate.overallScore >= 60) return "good";
  if (aggregate.overallScore >= 45) return "neutral";
  return "avoid";
}
