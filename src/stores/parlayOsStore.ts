/**
 * ParlayOS global UI store.
 *
 * Architecture layers:
 * 1. parlayMarketCatalog — prop families + tiers (picker content)
 * 2. parlayOsLegBuilder — tier → canonical draft legs
 * 3. parlayCommandStore — draft slip state (source of truth)
 * 4. parlayOsStore (this) — picker/sheet chrome only
 * 5. ParlayOsLayer — floating dock + bottom sheet on all player pages
 */
import { create } from "zustand";
import type { MLBPlayer, Vouch } from "../types";
import type { ResearchProp } from "./appCommandStore";
import type { ParlayMarketFamilyId } from "../lib/parlays/parlayMarketCatalog";

export type ParlayPickerContext = {
  player: MLBPlayer;
  propHint?: ResearchProp;
  vouch?: Vouch;
  initialFamily?: ParlayMarketFamilyId;
  isPitcher?: boolean;
};

type ParlayOsState = {
  pickerOpen: boolean;
  pickerContext: ParlayPickerContext | null;
  /** When set, tier confirm replaces this draft leg instead of adding. */
  editLegId: string | null;
  /** Leg being edited in ParlayLegEditorSheet. */
  editorLegId: string | null;
  sheetOpen: boolean;
  sheetExpanded: boolean;
  /** Active slip template guide (tier pattern only — no fake legs). */
  buildTemplateId: string | null;

  openPicker: (ctx: ParlayPickerContext, options?: { editLegId?: string }) => void;
  closePicker: () => void;
  openLegEditor: (legId: string) => void;
  closeLegEditor: () => void;
  setBuildTemplate: (templateId: string | null) => void;
  openSheet: (expanded?: boolean) => void;
  closeSheet: () => void;
  toggleSheet: () => void;
  setSheetExpanded: (expanded: boolean) => void;
  proofPickId: string | null;
  openProofPage: (pickId: string) => void;
  clearProofPage: () => void;
};

export const useParlayOsStore = create<ParlayOsState>()((set) => ({
  pickerOpen: false,
  pickerContext: null,
  editLegId: null,
  editorLegId: null,
  sheetOpen: false,
  sheetExpanded: false,
  buildTemplateId: null,
  proofPickId: null,

  openPicker: (ctx, options) =>
    set({
      pickerOpen: true,
      pickerContext: ctx,
      editLegId: options?.editLegId ?? null,
    }),

  closePicker: () =>
    set({
      pickerOpen: false,
      pickerContext: null,
      editLegId: null,
    }),

  openLegEditor: (legId) => set({ editorLegId: legId }),
  closeLegEditor: () => set({ editorLegId: null }),

  setBuildTemplate: (templateId) => set({ buildTemplateId: templateId }),

  openSheet: (expanded = true) =>
    set({
      sheetOpen: true,
      sheetExpanded: expanded,
    }),

  closeSheet: () =>
    set({
      sheetOpen: false,
      sheetExpanded: false,
    }),

  toggleSheet: () =>
    set((state) => ({
      sheetOpen: !state.sheetOpen,
      sheetExpanded: state.sheetOpen ? state.sheetExpanded : true,
    })),

  setSheetExpanded: (expanded) => set({ sheetExpanded: expanded }),

  openProofPage: (pickId) => set({ proofPickId: pickId }),
  clearProofPage: () => set({ proofPickId: null }),
}));
