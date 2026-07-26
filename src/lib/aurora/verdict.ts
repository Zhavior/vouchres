import type { AuroraVerdict } from "./types";

export function calculateVerdict(score: number): AuroraVerdict {
  if (score >= 90) return "elite";
  if (score >= 75) return "strong";
  if (score >= 60) return "watch";
  return "avoid";
}
