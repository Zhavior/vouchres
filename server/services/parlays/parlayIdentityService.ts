export interface ParlayIdentityAssessment {
  complete: boolean;
  totalLegs: number;
  completeLegs: number;
  missingLegIndexes: number[];
}

export function isLegIdentityComplete(leg: Record<string, unknown>): boolean {
  const eventKey = String(leg.event_key ?? "").trim();
  const marketCode = String(leg.market_code ?? "").trim();
  const playerId = leg.player_id;
  const statTarget = leg.stat_target;
  const comparator = String(leg.comparator ?? "").trim();

  return Boolean(
    eventKey &&
    marketCode &&
    playerId != null &&
    String(playerId).trim() !== "" &&
    statTarget != null &&
    Number.isFinite(Number(statTarget)) &&
    comparator,
  );
}

export function assessParlayIdentity(legs: Record<string, unknown>[]): ParlayIdentityAssessment {
  if (legs.length === 0) {
    return {
      complete: false,
      totalLegs: 0,
      completeLegs: 0,
      missingLegIndexes: [],
    };
  }

  const missingLegIndexes = legs
    .filter((leg) => !isLegIdentityComplete(leg))
    .map((leg) => Number(leg.leg_index ?? 0));

  const completeLegs = legs.length - missingLegIndexes.length;

  return {
    complete: missingLegIndexes.length === 0,
    totalLegs: legs.length,
    completeLegs,
    missingLegIndexes,
  };
}
