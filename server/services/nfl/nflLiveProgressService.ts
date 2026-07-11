import type {
  ParlayLegProgressRequest,
  ParlayLegProgressResult,
} from "../mlb/parlayLiveProgressService";

/**
 * NFL live progress stub — returns null current until an NFL stats provider
 * is registered in SportsDataGateway and market stat maps are defined.
 */
export async function fetchNflParlayLegProgressBatch(
  legs: ParlayLegProgressRequest[],
): Promise<ParlayLegProgressResult[]> {
  return legs.map((leg) => ({
    id: leg.id,
    current: null,
    target: Number(leg.statTarget ?? 1) || 1,
    label: progressLabel(String(leg.marketCode ?? "")),
    gameStatus: "nfl_live_progress_not_yet_supported",
  }));
}

function progressLabel(marketCode: string): string {
  const code = marketCode.toUpperCase();
  if (code.includes("TOUCHDOWN") || code === "TD") return "Touchdowns";
  if (code.includes("PASSING")) return "Passing yards";
  if (code.includes("RUSHING")) return "Rushing yards";
  if (code.includes("RECEIVING")) return "Receiving yards";
  return "Progress";
}
