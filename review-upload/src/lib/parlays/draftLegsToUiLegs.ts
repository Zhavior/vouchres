import type { Leg } from "../../types";
import type { DraftParlayLeg } from "../../stores/parlayCommandStore";

function numOrUndef(value: string | number | null | undefined): number | undefined {
  if (value == null) return undefined;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function parseOdds(value: string | number | null | undefined): number | null {
  if (value == null) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Map draft slip legs to UI `Leg` rows for ParlayOS cards and combined odds. */
export function draftLegsToUiLegs(draftLegs: DraftParlayLeg[]): Leg[] {
  return draftLegs.map((leg) => ({
    id: leg.id,
    sport: leg.sport,
    game: String(leg.game ?? ""),
    market: leg.marketLabel ?? leg.marketCode ?? "Prop",
    selection: leg.selection,
    odds: parseOdds(leg.odds),
    status: "PENDING",
    gamePk: leg.gamePk,
    marketCode: leg.marketCode ?? undefined,
    statTarget: numOrUndef(leg.statTarget),
    threshold: numOrUndef(leg.statTarget),
    comparator: leg.comparator ?? undefined,
    eventKey: leg.eventKey ?? undefined,
    playerId: leg.playerId ?? undefined,
    teamId: leg.teamId ?? undefined,
    oddsSource: leg.externalProvider === "estimated" ? "estimated" : undefined,
  }));
}
