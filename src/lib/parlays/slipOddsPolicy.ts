import { computeCombinedOdds } from "../../components/parlay/types/parlayOsTypes";

export type SlipLegOddsInput = {
  odds?: number | string | null;
  oddsSource?: "live" | "estimated" | string | null;
  externalProvider?: string | null;
};

export type SlipOddsAssessment = {
  canShowCombined: boolean;
  canShowPayout: boolean;
  blockReason: string | null;
  hasTbdLegs: boolean;
  hasEstimatedLegs: boolean;
  combined: ReturnType<typeof computeCombinedOdds>;
};

function isEstimatedLeg(leg: SlipLegOddsInput): boolean {
  if (leg.oddsSource === "estimated") return true;
  const provider = String(leg.externalProvider ?? "").toLowerCase();
  return provider.includes("estimated") || provider.includes("vai") || provider.includes("ai");
}

function isTbdLeg(leg: SlipLegOddsInput): boolean {
  const raw = leg.odds;
  if (raw == null || raw === "") return true;
  const n = Number(raw);
  return !Number.isFinite(n) || n === 0;
}

/** Trust-first combined odds — no fake payout when prices are missing or estimated. */
export function assessSlipOdds(legs: SlipLegOddsInput[]): SlipOddsAssessment {
  const hasTbdLegs = legs.some(isTbdLeg);
  const hasEstimatedLegs = legs.some(isEstimatedLeg);
  const combined = computeCombinedOdds(legs);

  if (legs.length === 0) {
    return {
      canShowCombined: false,
      canShowPayout: false,
      blockReason: null,
      hasTbdLegs: false,
      hasEstimatedLegs: false,
      combined: null,
    };
  }

  if (hasTbdLegs) {
    return {
      canShowCombined: false,
      canShowPayout: false,
      blockReason: "Combined odds hidden — one or more legs have Odds TBD.",
      hasTbdLegs: true,
      hasEstimatedLegs,
      combined: null,
    };
  }

  if (hasEstimatedLegs) {
    return {
      canShowCombined: true,
      canShowPayout: false,
      blockReason: "To Win hidden — one or more legs use estimated odds, not live book prices.",
      hasTbdLegs: false,
      hasEstimatedLegs: true,
      combined,
    };
  }

  if (!combined) {
    return {
      canShowCombined: false,
      canShowPayout: false,
      blockReason: "Combined odds unavailable for this slip.",
      hasTbdLegs: false,
      hasEstimatedLegs: false,
      combined: null,
    };
  }

  return {
    canShowCombined: true,
    canShowPayout: true,
    blockReason: null,
    hasTbdLegs: false,
    hasEstimatedLegs: false,
    combined,
  };
}
