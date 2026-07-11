import type { ParlayMarketFamily, ParlayMarketFamilyId, ParlayMarketTier } from "./parlayMarketCatalog";
import { getParlayMarketFamily } from "./parlayMarketCatalog";
import type { DraftParlayLeg } from "../../stores/parlayCommandStore";

export type CustomStatLimit = { min: number; max: number };

/** Grading-safe custom stat ranges per prop family. */
export const CUSTOM_STAT_LIMITS: Record<ParlayMarketFamilyId, CustomStatLimit> = {
  home_runs: { min: 1, max: 4 },
  runs: { min: 1, max: 6 },
  hits: { min: 1, max: 5 },
  rbi: { min: 1, max: 6 },
  total_bases: { min: 1, max: 8 },
  pitcher: { min: 3, max: 15 },
  stolen_base: { min: 1, max: 3 },
};

export function validateCustomStatTarget(
  familyId: ParlayMarketFamilyId,
  statTarget: number,
): { valid: boolean; reason?: string } {
  const limits = CUSTOM_STAT_LIMITS[familyId];
  if (!limits) return { valid: false, reason: "Unknown prop family." };
  if (!Number.isFinite(statTarget) || statTarget < limits.min || statTarget > limits.max) {
    return {
      valid: false,
      reason: `Line must be between ${limits.min} and ${limits.max} for this market.`,
    };
  }
  return { valid: true };
}

function customTierId(familyId: ParlayMarketFamilyId, statTarget: number): string {
  return `custom_${familyId}_${statTarget}`;
}

function labelForFamily(familyId: ParlayMarketFamilyId, statTarget: number): {
  label: string;
  shortLabel: string;
  marketLabel: string;
  selection: (name: string) => string;
} {
  switch (familyId) {
    case "home_runs":
      return statTarget === 1
        ? {
            label: "Anytime Home Run",
            shortLabel: "Anytime HR",
            marketLabel: "To Hit a Home Run (Anytime)",
            selection: (n) => `${n} Anytime HR`,
          }
        : {
            label: `${statTarget}+ Home Runs`,
            shortLabel: `${statTarget}+ HR`,
            marketLabel: "To Hit 2+ Home Runs",
            selection: (n) => `${n} ${statTarget}+ Home Runs`,
          };
    case "runs":
      return statTarget === 1
        ? {
            label: "To Score",
            shortLabel: "1+ Run",
            marketLabel: "Runs Scored",
            selection: (n) => `${n} To Score`,
          }
        : {
            label: `${statTarget}+ Runs Scored`,
            shortLabel: `${statTarget}+ Runs`,
            marketLabel: "Runs Scored",
            selection: (n) => `${n} ${statTarget}+ Runs`,
          };
    case "hits":
      return {
        label: `${statTarget}+ Hit${statTarget > 1 ? "s" : ""}`,
        shortLabel: `${statTarget}+ Hit${statTarget > 1 ? "s" : ""}`,
        marketLabel: "Total Hits",
        selection: (n) => `${n} ${statTarget}+ Hit${statTarget > 1 ? "s" : ""}`,
      };
    case "rbi":
      return {
        label: `${statTarget}+ RBI`,
        shortLabel: `${statTarget}+ RBI`,
        marketLabel: "Runs Batted In",
        selection: (n) => `${n} ${statTarget}+ RBI${statTarget > 1 ? "s" : ""}`,
      };
    case "total_bases":
      return {
        label: `${statTarget}+ Total Bases`,
        shortLabel: `${statTarget}+ TB`,
        marketLabel: "Total Bases",
        selection: (n) => `${n} ${statTarget}+ Total Bases`,
      };
    case "pitcher":
      return {
        label: `${statTarget}+ Strikeouts`,
        shortLabel: `${statTarget}+ K`,
        marketLabel: "Pitcher Strikeouts",
        selection: (n) => `${n} ${statTarget}+ Ks`,
      };
    case "stolen_base":
      return {
        label: statTarget === 1 ? "Stolen Base" : `${statTarget}+ Stolen Bases`,
        shortLabel: statTarget === 1 ? "SB" : `${statTarget}+ SB`,
        marketLabel: "Stolen Base",
        selection: (n) => (statTarget === 1 ? `${n} Stolen Base` : `${n} ${statTarget}+ Stolen Bases`),
      };
    default:
      return {
        label: `${statTarget}+`,
        shortLabel: `${statTarget}+`,
        marketLabel: "Player Prop",
        selection: (n) => `${n} ${statTarget}+`,
      };
  }
}

function marketCodeForFamily(familyId: ParlayMarketFamilyId): string {
  switch (familyId) {
    case "home_runs": return "ANYTIME_HR";
    case "runs": return "RUN";
    case "hits": return "HIT";
    case "rbi": return "RBI";
    case "total_bases": return "TOTAL_BASES";
    case "pitcher": return "STRIKEOUTS";
    case "stolen_base": return "STOLEN_BASE";
    default: return "PROP";
  }
}

/** Build a gradable custom tier from family + stat target. */
export function buildCustomTierFromFamily(
  family: ParlayMarketFamily,
  statTarget: number,
): ParlayMarketTier | null {
  const check = validateCustomStatTarget(family.id, statTarget);
  if (!check.valid) return null;

  const copy = labelForFamily(family.id, statTarget);
  return {
    id: customTierId(family.id, statTarget),
    familyId: family.id,
    marketCode: marketCodeForFamily(family.id),
    statTarget,
    comparator: ">=",
    label: copy.label,
    shortLabel: copy.shortLabel,
    marketLabel: copy.marketLabel,
    role: family.role,
    selection: copy.selection,
  };
}

export function inferFamilyFromLeg(leg: Pick<DraftParlayLeg, "marketCode" | "marketLabel">): ParlayMarketFamilyId | null {
  const code = String(leg.marketCode ?? "").toUpperCase();
  if (code === "ANYTIME_HR" || code === "HR") return "home_runs";
  if (code === "RUN") return "runs";
  if (code === "HIT") return "hits";
  if (code === "RBI") return "rbi";
  if (code === "TOTAL_BASES") return "total_bases";
  if (code === "STRIKEOUTS" || code === "PITCHER_OUTS") return "pitcher";
  if (code === "STOLEN_BASE") return "stolen_base";
  const haystack = `${leg.marketLabel ?? ""}`.toLowerCase();
  if (/strikeout|\bk\b/.test(haystack)) return "pitcher";
  if (/stolen|\bsb\b/.test(haystack)) return "stolen_base";
  if (/total bases|\btb\b/.test(haystack)) return "total_bases";
  if (/\brbi\b/.test(haystack)) return "rbi";
  if (/\brun/.test(haystack)) return "runs";
  if (/\bhit/.test(haystack)) return "hits";
  if (/home run|\bhr\b/.test(haystack)) return "home_runs";
  return null;
}

/** Reconstruct a catalog tier from a draft leg for re-editing. */
export function tierFromDraftLeg(leg: DraftParlayLeg): ParlayMarketTier | null {
  const familyId = inferFamilyFromLeg(leg);
  if (!familyId) return null;
  const family = getParlayMarketFamily(familyId);
  if (!family) return null;
  const statTarget = Number(leg.statTarget);
  if (!Number.isFinite(statTarget)) return null;
  return buildCustomTierFromFamily(family, statTarget)
    ?? family.tiers.find((t) => t.statTarget === statTarget && t.marketCode === leg.marketCode)
    ?? null;
}

export function isCustomTierId(tierId: string): boolean {
  return tierId.startsWith("custom_");
}
