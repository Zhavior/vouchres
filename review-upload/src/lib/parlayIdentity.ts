/**
 * Client-side canonical identity assessment — mirrors server parlayIdentityService
 * using fields available on saved slips / legs.
 */

export interface ClientIdentityAssessment {
  complete: boolean;
  totalLegs: number;
  completeLegs: number;
  missingLegIndexes: number[];
}

function isHrLikeMarket(marketCode?: string | null, market?: string | null, selection?: string | null): boolean {
  const code = String(marketCode ?? "").toUpperCase();
  if (code === "ANYTIME_HR" || code === "HR" || code === "HOME_RUN") return true;
  const haystack = `${market ?? ""} ${selection ?? ""}`.toLowerCase();
  return haystack.includes("hr") || haystack.includes("home run");
}

export function isClientLegIdentityComplete(leg: Record<string, unknown>, index: number): boolean {
  const playerId = leg.playerId ?? leg.player_id;
  const marketCode = String(leg.marketCode ?? leg.market_code ?? "").trim();
  const gameRef = leg.gamePk ?? leg.game_pk ?? leg.eventId ?? leg.event_id ?? leg.gameId ?? leg.game_id;
  const statTarget = leg.statTarget ?? leg.stat_target ?? leg.threshold ?? (isHrLikeMarket(marketCode, String(leg.market ?? ""), String(leg.selection ?? "")) ? 1 : null);
  const comparator = String(leg.comparator ?? ">=").trim();

  return Boolean(
    gameRef &&
    marketCode &&
    playerId != null &&
    String(playerId).trim() !== "" &&
    statTarget != null &&
    Number.isFinite(Number(statTarget)) &&
    comparator,
  );
}

export function assessClientParlayIdentity(legs: Record<string, unknown>[]): ClientIdentityAssessment {
  if (legs.length === 0) {
    return { complete: false, totalLegs: 0, completeLegs: 0, missingLegIndexes: [] };
  }

  const missingLegIndexes = legs
    .map((leg, index) => (isClientLegIdentityComplete(leg, index) ? null : index))
    .filter((value): value is number => value != null);

  return {
    complete: missingLegIndexes.length === 0,
    totalLegs: legs.length,
    completeLegs: legs.length - missingLegIndexes.length,
    missingLegIndexes,
  };
}
