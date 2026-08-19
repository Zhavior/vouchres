import { priceCorrelatedParlay } from "./correlatedParlayPricing";

export type SlipLegOddsInput = {
  odds?: number | string | null;
  oddsSource?: "live" | "estimated" | string | null;
  externalProvider?: string | null;
  /**
   * Correlation inputs. Legs in one game move together, so multiplying their
   * prices overstates the payout — these let the pricer account for it. Absent
   * on a caller, every leg reads as a different game and pricing falls back to
   * the plain independent product.
   */
  id?: string;
  gamePk?: string | number | null;
  playerId?: string | number | null;
  teamId?: string | number | null;
  marketCode?: string | null;
};

export type SlipOddsAssessment = {
  canShowCombined: boolean;
  canShowPayout: boolean;
  blockReason: string | null;
  hasTbdLegs: boolean;
  hasEstimatedLegs: boolean;
  combined: { decimal: number; american: string } | null;
  /** True when the price was adjusted for related legs. */
  correlated: boolean;
  /**
   * What the naive independent product would have shown. Kept for diagnostics
   * and future explainer UI — the slip itself displays the corrected price only.
   */
  naive: { decimal: number; american: string } | null;
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

  // Correlation-aware price. Legs from different games are independent and this
  // returns the same number the plain product used to; legs inside one game are
  // repriced, because a batter homering also moves his team's and his opponent's
  // markets. The slip shows this number directly — `naive` is kept for
  // diagnostics, not displayed.
  const priced = priceCorrelatedParlay(
    legs.map((leg, index) => ({
      id: leg.id ?? `leg-${index}`,
      odds: leg.odds,
      gamePk: leg.gamePk,
      playerId: leg.playerId,
      teamId: leg.teamId,
      marketCode: leg.marketCode,
    })),
  );

  const combined = priced ? { decimal: priced.decimal, american: priced.american } : null;
  const correlated = priced?.correlated ?? false;
  const naive = priced
    ? { decimal: priced.naiveDecimal, american: priced.naiveAmerican }
    : null;

  if (legs.length === 0) {
    return {
      canShowCombined: false,
      canShowPayout: false,
      blockReason: null,
      hasTbdLegs: false,
      hasEstimatedLegs: false,
      combined: null,
      correlated: false,
      naive: null,
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
      correlated: false,
      naive: null,
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
      correlated,
      naive,
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
      correlated: false,
      naive: null,
    };
  }

  return {
    canShowCombined: true,
    canShowPayout: true,
    blockReason: null,
    hasTbdLegs: false,
    hasEstimatedLegs: false,
    combined,
    correlated,
    naive,
  };
}
