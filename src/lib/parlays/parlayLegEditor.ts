import type { DraftParlayLeg } from "../../stores/parlayCommandStore";
import { buildCustomTierFromFamily, inferFamilyFromLeg, validateCustomStatTarget } from "./parlayCustomLine";
import { getParlayMarketFamily } from "./parlayMarketCatalog";
import { resolveTierOdds } from "./parlayTierOddsResolver";
import type { PlayerProposition } from "../../types";
import type { ResearchProp } from "../../stores/appCommandStore";

export function buildDraftLegEventKey(leg: Pick<DraftParlayLeg, "sport" | "gamePk" | "playerId" | "marketCode" | "statTarget" | "comparator">): string {
  const gamePart = leg.gamePk ?? "GAME_TBD";
  const playerPart = leg.playerId ?? "PLAYER_TBD";
  const marketPart = leg.marketCode ?? "MARKET_TBD";
  const targetPart = leg.statTarget ?? "TARGET_TBD";
  const comparatorPart = String(leg.comparator ?? ">=").replace(/[^a-zA-Z0-9]+/g, "");
  return `${leg.sport ?? "MLB"}_${gamePart}_${playerPart}_${marketPart}_${targetPart}_${comparatorPart}`;
}

export type LegEditContext = {
  propHint?: ResearchProp;
  propositions?: PlayerProposition[];
};

/** Apply a new stat target to a draft leg — recomputes selection, eventKey, and honest odds. */
export function applyLegStatTargetEdit(
  leg: DraftParlayLeg,
  statTarget: number,
  ctx: LegEditContext = {},
): { leg: DraftParlayLeg; error?: string } {
  const familyId = inferFamilyFromLeg(leg);
  if (!familyId) {
    return { leg, error: "Cannot edit — unknown market type." };
  }

  const validation = validateCustomStatTarget(familyId, statTarget);
  if (!validation.valid) {
    return { leg, error: validation.reason };
  }

  const family = getParlayMarketFamily(familyId);
  if (!family) {
    return { leg, error: "Cannot edit — market family missing." };
  }

  const tier = buildCustomTierFromFamily(family, statTarget);
  if (!tier) {
    return { leg, error: "Cannot build custom line for this target." };
  }

  const playerName = leg.playerName ?? leg.selection.split(" ")[0] ?? "Player";
  const selection = tier.selection(playerName);
  const tierOdds = resolveTierOdds({
    tier,
    propHint: ctx.propHint,
    propositions: ctx.propositions,
  });

  const next: DraftParlayLeg = {
    ...leg,
    selection,
    marketCode: tier.marketCode,
    marketLabel: tier.marketLabel,
    statTarget: tier.statTarget,
    comparator: tier.comparator,
    odds: tierOdds.odds ?? undefined,
    externalProvider: tierOdds.source === "live" ? "parlayos_research" : "parlayos_picker",
    eventKey: buildDraftLegEventKey({
      sport: leg.sport,
      gamePk: leg.gamePk,
      playerId: leg.playerId,
      marketCode: tier.marketCode,
      statTarget: tier.statTarget,
      comparator: tier.comparator,
    }),
    tags: ["#ParlayOS", `#${tier.shortLabel.replace(/\s+/g, "")}`],
  };

  return { leg: next };
}
