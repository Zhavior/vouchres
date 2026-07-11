import type { DraftParlayLeg } from "../../stores/parlayCommandStore";
import {
  getParlaySlipTemplate,
  resolveTemplateTier,
  type ParlaySlipTemplate,
} from "./parlaySlipTemplates";

export type TemplateSlotStatus = {
  slotId: string;
  label: string;
  tierId: string;
  filled: boolean;
  matchedLegId?: string;
};

export type TemplateProgress = {
  template: ParlaySlipTemplate;
  filledCount: number;
  totalSlots: number;
  complete: boolean;
  slots: TemplateSlotStatus[];
};

function legMatchesTier(leg: DraftParlayLeg, tierId: string): boolean {
  const tier = resolveTemplateTier(tierId);
  if (!tier) return false;
  const code = String(leg.marketCode ?? "").toUpperCase();
  const tierCode = String(tier.marketCode).toUpperCase();
  if (code !== tierCode) return false;
  const target = Number(leg.statTarget);
  return Number.isFinite(target) && target === tier.statTarget;
}

/** Match draft legs to template slots — same marketCode + statTarget fills a slot. */
export function assessTemplateProgress(
  templateId: string | null | undefined,
  draftLegs: DraftParlayLeg[],
): TemplateProgress | null {
  if (!templateId) return null;
  const template = getParlaySlipTemplate(templateId);
  if (!template) return null;

  const usedLegIds = new Set<string>();
  const slots: TemplateSlotStatus[] = template.slots.map((slot) => {
    const match = draftLegs.find(
      (leg) => !usedLegIds.has(leg.id) && legMatchesTier(leg, slot.tierId),
    );
    if (match) usedLegIds.add(match.id);
    return {
      slotId: slot.id,
      label: slot.label,
      tierId: slot.tierId,
      filled: Boolean(match),
      matchedLegId: match?.id,
    };
  });

  const filledCount = slots.filter((s) => s.filled).length;
  return {
    template,
    filledCount,
    totalSlots: slots.length,
    complete: filledCount >= template.minLegs,
    slots,
  };
}
