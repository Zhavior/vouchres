import type { PlayerProposition } from "../../types";
import type { ResearchProp } from "../../stores/appCommandStore";
import type { ParlayMarketTier } from "./parlayMarketCatalog";
import { americanLabel } from "../odds";

export type TierOddsSource = "live" | "tbd";

export type TierOddsQuote = {
  odds: number | null;
  source: TierOddsSource;
  label: string;
  detail: string;
};

function normalizeText(value: unknown): string {
  return String(value ?? "").toLowerCase().replace(/\s+/g, " ").trim();
}

function parseAmericanOdds(value: number | string | null | undefined): number | null {
  if (value == null) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const raw = String(value).trim();
  if (!raw) return null;
  const n = Number(raw);
  if (Number.isFinite(n)) return n;
  return null;
}

function tierMatchesProp(tier: ParlayMarketTier, prop: PlayerProposition | ResearchProp): boolean {
  const haystack = normalizeText(`${"market" in prop ? prop.market : ""} ${"spec" in prop ? prop.spec : ""}`);
  const code = String(tier.marketCode).toUpperCase();
  const target = tier.statTarget;

  if (code === "ANYTIME_HR") {
    return /home run|\bhr\b/.test(haystack) && (target === 1 || !/\b2\s*\+|\b2\+/.test(haystack));
  }
  if (code === "ANYTIME_HR" && target >= 2) {
    return /home run|\bhr\b/.test(haystack) && /\b2\s*\+|\b2\+|multi/.test(haystack);
  }
  if (code === "RUN") {
    return /\brun\b|\bscore\b|\bruns\b/.test(haystack) && (
      target === 1 || new RegExp(`\\b${target}\\s*\\+|\\b${target}\\+`).test(haystack)
    );
  }
  if (code === "HIT") {
    return /\bhit/.test(haystack) && (
      target === 1 || new RegExp(`\\b${target}\\s*\\+|\\b${target}\\+`).test(haystack)
    );
  }
  if (code === "RBI") {
    return /\brbi\b/.test(haystack);
  }
  if (code === "TOTAL_BASES") {
    return /total bases|\btb\b/.test(haystack);
  }
  if (code === "STRIKEOUTS") {
    return /strikeout|\bk\b|\bks\b/.test(haystack);
  }
  if (code === "STOLEN_BASE") {
    return /stolen base|\bsb\b/.test(haystack);
  }
  return false;
}

function quoteFromOdds(odds: number | null, source: TierOddsSource, detail: string): TierOddsQuote {
  if (odds == null) {
    return {
      odds: null,
      source: "tbd",
      label: "TBD",
      detail: "No sportsbook price linked for this tier.",
    };
  }
  return {
    odds,
    source,
    label: americanLabel(odds),
    detail,
  };
}

/** Honest tier odds — research props and player propositions only; never synthetic books. */
export function resolveTierOdds(input: {
  tier: ParlayMarketTier;
  propHint?: ResearchProp;
  propositions?: PlayerProposition[];
}): TierOddsQuote {
  const { tier, propHint, propositions = [] } = input;

  if (propHint && tierMatchesProp(tier, propHint)) {
    const odds = parseAmericanOdds(propHint.odds);
    if (odds != null) {
      return quoteFromOdds(odds, "live", "From Player Research prop price.");
    }
  }

  for (const prop of propositions) {
    if (!tierMatchesProp(tier, prop)) continue;
    const odds = parseAmericanOdds(prop.odds);
    if (odds != null) {
      const detail = prop.truthLabel
        ? `From research market (${prop.truthLabel}).`
        : "From player research market catalog.";
      return quoteFromOdds(odds, "live", detail);
    }
  }

  return quoteFromOdds(null, "tbd", "Odds TBD — add from a priced research market or wait for book feed.");
}

export function resolveTierOddsMap(input: {
  tiers: ParlayMarketTier[];
  propHint?: ResearchProp;
  propositions?: PlayerProposition[];
}): Map<string, TierOddsQuote> {
  const map = new Map<string, TierOddsQuote>();
  for (const tier of input.tiers) {
    map.set(tier.id, resolveTierOdds({ tier, propHint: input.propHint, propositions: input.propositions }));
  }
  return map;
}
