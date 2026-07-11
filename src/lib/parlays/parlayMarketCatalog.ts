/**
 * ParlayOS market catalog — canonical prop families + tiers for the global picker.
 * Drives tier popup UX (HR → 2 HR, runs 1–4, pitcher K lines, etc.).
 */

import type { ParlayMarketCode } from "./parlayBridge";

export type ParlayMarketFamilyId =
  | "home_runs"
  | "runs"
  | "hits"
  | "rbi"
  | "total_bases"
  | "pitcher"
  | "stolen_base";

export type ParlayPlayerRole = "batter" | "pitcher";

export interface ParlayMarketTier {
  id: string;
  familyId: ParlayMarketFamilyId;
  marketCode: ParlayMarketCode | string;
  statTarget: number;
  comparator: ">=" | "<=";
  label: string;
  shortLabel: string;
  marketLabel: string;
  selection: (playerName: string) => string;
  role: ParlayPlayerRole;
  /** Combo tiers add multiple legs in one confirm action */
  comboLegs?: Omit<ParlayMarketTier, "comboLegs">[];
}

export interface ParlayMarketFamily {
  id: ParlayMarketFamilyId;
  label: string;
  subtitle: string;
  icon: string;
  role: ParlayPlayerRole;
  tiers: ParlayMarketTier[];
}

function tier(
  partial: Omit<ParlayMarketTier, "selection"> & { selection?: (name: string) => string },
): ParlayMarketTier {
  const selection =
    partial.selection ??
    ((name: string) => `${name} ${partial.shortLabel}`);
  return { ...partial, selection };
}

export const PARLAY_MARKET_FAMILIES: ParlayMarketFamily[] = [
  {
    id: "home_runs",
    label: "Home Runs",
    subtitle: "Anytime & multi-HR",
    icon: "⚾",
    role: "batter",
    tiers: [
      tier({
        id: "hr_anytime",
        familyId: "home_runs",
        marketCode: "ANYTIME_HR",
        statTarget: 1,
        comparator: ">=",
        label: "Anytime Home Run",
        shortLabel: "Anytime HR",
        marketLabel: "To Hit a Home Run (Anytime)",
        role: "batter",
        selection: (n) => `${n} Anytime HR`,
      }),
      tier({
        id: "hr_2plus",
        familyId: "home_runs",
        marketCode: "ANYTIME_HR",
        statTarget: 2,
        comparator: ">=",
        label: "2+ Home Runs",
        shortLabel: "2+ HR",
        marketLabel: "To Hit 2+ Home Runs",
        role: "batter",
        selection: (n) => `${n} 2+ Home Runs`,
      }),
      tier({
        id: "hr_run_combo",
        familyId: "home_runs",
        marketCode: "ANYTIME_HR",
        statTarget: 1,
        comparator: ">=",
        label: "HR + Run Combo",
        shortLabel: "HR + Run",
        marketLabel: "Anytime HR + To Score",
        role: "batter",
        selection: (n) => `${n} HR + Run`,
        comboLegs: [
          tier({
            id: "hr_anytime",
            familyId: "home_runs",
            marketCode: "ANYTIME_HR",
            statTarget: 1,
            comparator: ">=",
            label: "Anytime HR",
            shortLabel: "Anytime HR",
            marketLabel: "To Hit a Home Run (Anytime)",
            role: "batter",
            selection: (n) => `${n} Anytime HR`,
          }),
          tier({
            id: "run_1",
            familyId: "runs",
            marketCode: "RUN",
            statTarget: 1,
            comparator: ">=",
            label: "To Score",
            shortLabel: "1+ Run",
            marketLabel: "To Score a Run",
            role: "batter",
            selection: (n) => `${n} To Score`,
          }),
        ],
      }),
    ],
  },
  {
    id: "runs",
    label: "Runs",
    subtitle: "Runs scored 1–4+",
    icon: "🏃",
    role: "batter",
    tiers: [1, 2, 3, 4].map((target) =>
      tier({
        id: `run_${target}`,
        familyId: "runs",
        marketCode: "RUN",
        statTarget: target,
        comparator: ">=",
        label: target === 1 ? "To Score" : `${target}+ Runs Scored`,
        shortLabel: target === 1 ? "1+ Run" : `${target}+ Runs`,
        marketLabel: "Runs Scored",
        role: "batter",
        selection: (n) => (target === 1 ? `${n} To Score` : `${n} ${target}+ Runs`),
      }),
    ),
  },
  {
    id: "hits",
    label: "Hits",
    subtitle: "Singles through multi-hit",
    icon: "🎯",
    role: "batter",
    tiers: [1, 2, 3].map((target) =>
      tier({
        id: `hit_${target}`,
        familyId: "hits",
        marketCode: "HIT",
        statTarget: target,
        comparator: ">=",
        label: `${target}+ Hit${target > 1 ? "s" : ""}`,
        shortLabel: `${target}+ Hit${target > 1 ? "s" : ""}`,
        marketLabel: "Total Hits",
        role: "batter",
        selection: (n) => `${n} ${target}+ Hit${target > 1 ? "s" : ""}`,
      }),
    ),
  },
  {
    id: "rbi",
    label: "RBI",
    subtitle: "Runs batted in",
    icon: "📊",
    role: "batter",
    tiers: [1, 2, 3].map((target) =>
      tier({
        id: `rbi_${target}`,
        familyId: "rbi",
        marketCode: "RBI",
        statTarget: target,
        comparator: ">=",
        label: `${target}+ RBI`,
        shortLabel: `${target}+ RBI`,
        marketLabel: "Runs Batted In",
        role: "batter",
        selection: (n) => `${n} ${target}+ RBI${target > 1 ? "s" : ""}`,
      }),
    ),
  },
  {
    id: "total_bases",
    label: "Total Bases",
    subtitle: "Power & contact",
    icon: "💥",
    role: "batter",
    tiers: [1, 2, 3, 4].map((target) =>
      tier({
        id: `tb_${target}`,
        familyId: "total_bases",
        marketCode: "TOTAL_BASES",
        statTarget: target,
        comparator: ">=",
        label: `${target}+ Total Bases`,
        shortLabel: `${target}+ TB`,
        marketLabel: "Total Bases",
        role: "batter",
        selection: (n) => `${n} ${target}+ Total Bases`,
      }),
    ),
  },
  {
    id: "pitcher",
    label: "Pitcher",
    subtitle: "Strikeouts & outs",
    icon: "🔥",
    role: "pitcher",
    tiers: [
      ...([4, 5, 6, 7] as const).map((target) =>
        tier({
          id: `k_${target}`,
          familyId: "pitcher",
          marketCode: "STRIKEOUTS",
          statTarget: target,
          comparator: ">=",
          label: `${target}+ Strikeouts`,
          shortLabel: `${target}+ K`,
          marketLabel: "Pitcher Strikeouts",
          role: "pitcher",
          selection: (n) => `${n} ${target}+ Ks`,
        }),
      ),
      tier({
        id: "pitcher_outs_15",
        familyId: "pitcher",
        marketCode: "PITCHER_OUTS",
        statTarget: 15,
        comparator: ">=",
        label: "15+ Pitching Outs",
        shortLabel: "15+ Outs",
        marketLabel: "Pitcher Outs",
        role: "pitcher",
        selection: (n) => `${n} 15+ Pitching Outs`,
      }),
    ],
  },
  {
    id: "stolen_base",
    label: "Stolen Base",
    subtitle: "Speed props",
    icon: "⚡",
    role: "batter",
    tiers: [
      tier({
        id: "sb_1",
        familyId: "stolen_base",
        marketCode: "STOLEN_BASE",
        statTarget: 1,
        comparator: ">=",
        label: "Stolen Base",
        shortLabel: "SB",
        marketLabel: "Stolen Base",
        role: "batter",
        selection: (n) => `${n} Stolen Base`,
      }),
    ],
  },
];

export function getParlayMarketFamily(id: ParlayMarketFamilyId): ParlayMarketFamily | undefined {
  return PARLAY_MARKET_FAMILIES.find((f) => f.id === id);
}

export function inferFamilyFromText(text: string): ParlayMarketFamilyId {
  const t = text.toLowerCase();
  if (/strikeout|\bks?\b|pitcher|outs/.test(t)) return "pitcher";
  if (/stolen|\bsb\b/.test(t)) return "stolen_base";
  if (/total bases|\btb\b/.test(t)) return "total_bases";
  if (/\brbi\b/.test(t)) return "rbi";
  if (/\brun(s)?\b|to score/.test(t) && !/home run|\bhr\b/.test(t)) return "runs";
  if (/\bhit(s)?\b/.test(t)) return "hits";
  return "home_runs";
}

const PITCHER_POSITIONS = new Set(["P", "SP", "RP", "CP", "LHP", "RHP"]);

/** Batter vs pitcher for ParlayOS — avoids false positives from matchup text (e.g. "11 K/9"). */
export function resolveParlayPlayerRole(input: {
  position?: string | null;
  marketHint?: string | null;
  specHint?: string | null;
}): ParlayPlayerRole {
  const pos = String(input.position ?? "").trim().toUpperCase();
  if (PITCHER_POSITIONS.has(pos)) return "pitcher";

  const market = String(input.marketHint ?? "").toLowerCase();
  const spec = String(input.specHint ?? "").toLowerCase();
  const text = `${market} ${spec}`.trim();

  if (/home run|\bhr\b|to hit a home run|anytime hr/.test(text)) return "batter";
  if (/stolen base|\bsb\b|\brbi\b|\btotal bases|\bhit(s)?\b|\brun(s)?\b|to score/.test(text)) return "batter";

  if (/pitcher strikeout|pitching out|\b\d+\+\s*k\b|to record.*strikeout/.test(text)) return "pitcher";
  if (/^pitcher\b|\bpitcher props\b/.test(market)) return "pitcher";

  return "batter";
}

export function tiersForRole(role: ParlayPlayerRole): ParlayMarketFamily[] {
  return PARLAY_MARKET_FAMILIES.filter((f) => f.role === role);
}

export function flattenTierLegs(selected: ParlayMarketTier): ParlayMarketTier[] {
  if (selected.comboLegs?.length) return selected.comboLegs;
  return [selected];
}
