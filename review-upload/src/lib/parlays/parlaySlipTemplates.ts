/**
 * ParlayOS slip templates — tier patterns users fill from Player Research.
 * Templates never invent players; they guide which props to add.
 */
import {
  PARLAY_MARKET_FAMILIES,
  type ParlayMarketTier,
} from "./parlayMarketCatalog";

export type ParlaySlipTemplateSlot = {
  id: string;
  label: string;
  tierId: string;
};

export type ParlaySlipTemplate = {
  id: string;
  label: string;
  description: string;
  icon: string;
  minLegs: number;
  slots: ParlaySlipTemplateSlot[];
};

function findTierById(tierId: string): ParlayMarketTier | undefined {
  for (const family of PARLAY_MARKET_FAMILIES) {
    for (const tier of family.tiers) {
      if (tier.id === tierId) return tier;
      for (const combo of tier.comboLegs ?? []) {
        if (combo.id === tierId) return combo;
      }
    }
  }
  return undefined;
}

export function resolveTemplateTier(tierId: string): ParlayMarketTier | undefined {
  return findTierById(tierId);
}

export const PARLAY_SLIP_TEMPLATES: ParlaySlipTemplate[] = [
  {
    id: "power_stack",
    label: "Power Stack",
    description: "HR + total bases + RBI from your research picks.",
    icon: "💥",
    minLegs: 3,
    slots: [
      { id: "s1", label: "Anytime HR", tierId: "hr_anytime" },
      { id: "s2", label: "2+ Total Bases", tierId: "tb_2" },
      { id: "s3", label: "1+ RBI", tierId: "rbi_1" },
    ],
  },
  {
    id: "contact_ladder",
    label: "Contact Ladder",
    description: "Multi-hit upside with a run-scored leg.",
    icon: "🎯",
    minLegs: 3,
    slots: [
      { id: "s1", label: "2+ Hits", tierId: "hit_2" },
      { id: "s2", label: "3+ Hits", tierId: "hit_3" },
      { id: "s3", label: "To Score", tierId: "run_1" },
    ],
  },
  {
    id: "pitcher_k_ladder",
    label: "K Ladder",
    description: "Strikeout ladder — same pitcher, two K tiers.",
    icon: "🔥",
    minLegs: 2,
    slots: [
      { id: "s1", label: "5+ Strikeouts", tierId: "k_5" },
      { id: "s2", label: "7+ Strikeouts", tierId: "k_7" },
    ],
  },
  {
    id: "speed_utility",
    label: "Speed + Run",
    description: "Stolen base plus runs scored combo path.",
    icon: "⚡",
    minLegs: 2,
    slots: [
      { id: "s1", label: "Stolen Base", tierId: "sb_1" },
      { id: "s2", label: "To Score", tierId: "run_1" },
    ],
  },
];

export function getParlaySlipTemplate(id: string): ParlaySlipTemplate | undefined {
  return PARLAY_SLIP_TEMPLATES.find((t) => t.id === id);
}
