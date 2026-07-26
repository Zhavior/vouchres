import type { AuroraVerdict } from "./types";

export function generateRecommendation(
  verdict: AuroraVerdict,
): string {
  switch (verdict) {
    case "elite":
      return "Elite opportunity. Aurora recommends strong consideration.";

    case "strong":
      return "Strong opportunity with favorable supporting evidence.";

    case "watch":
      return "Worth monitoring. Wait for additional confirmation.";

    case "avoid":
    default:
      return "Current risk outweighs the available edge.";
  }
}
