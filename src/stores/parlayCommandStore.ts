import { create } from "zustand";
import {
  PublicParlaySlip,
  normalizePublicSlip,
  normalizeSlipStatus,
  isLiveLikeStatus,
} from "../lib/parlayDisplay";

export type ParlayCommandPanel = "build" | "ai" | "live" | "premium";

export type DraftParlayLeg = {
  id: string;
  source: "manual" | "vai" | "tail";
  sport: "MLB" | "NBA" | "NFL" | "NHL" | string;
  selection: string;
  playerName?: string | null;
  playerId?: string | number | null;
  teamId?: string | number | null;
  teamLabel?: string | null;
  gameId?: string | number | null;
  game?: unknown;
  gamePk?: string;
  gameDate?: string | null;
  marketCode?: string | null;
  marketLabel?: string | null;
  statTarget?: string | number | null;
  comparator?: ">=" | "<=" | ">" | "<" | "=" | string | null;
  odds?: string | number | null;
  externalProvider?: string | null;
  eventKey?: string | null;
  tags?: string[];
};

export type AiRecommendedLeg = DraftParlayLeg & {
  confidence?: number | null;
  reason?: string | null;
  modelTag?: string | null;
};

type OptimisticSaveState = {
  saving: boolean;
  posting: boolean;
  lastError: string | null;
  lastSavedAt: string | null;
};

type ParlayCommandState = {
  activePanel: ParlayCommandPanel;
  draftLegs: DraftParlayLeg[];
  aiPicks: AiRecommendedLeg[];
  savedSlips: PublicParlaySlip[];
  optimistic: OptimisticSaveState;
  lastSyncAt: string | null;

  setActivePanel: (panel: ParlayCommandPanel) => void;
  addDraftLeg: (leg: DraftParlayLeg) => void;
  addAiLegToDraft: (leg: AiRecommendedLeg) => void;
  removeDraftLeg: (id: string) => void;
  clearDraft: () => void;
  setAiPicks: (legs: AiRecommendedLeg[]) => void;
  hydrateSavedSlips: (rawSlips: unknown[]) => void;
  addOptimisticSlip: (rawSlip: unknown) => string;
  replaceOptimisticSlip: (optimisticId: string, savedSlip: unknown) => void;
  removeOptimisticSlip: (optimisticId: string) => void;
  setSaving: (saving: boolean) => void;
  setPosting: (posting: boolean) => void;
  setError: (message: string | null) => void;
};

const makeDraftLegId = (leg: Partial<DraftParlayLeg>) => {
  const stable =
    leg.eventKey ||
    [
      leg.sport,
      leg.gameId,
      leg.playerId,
      leg.marketCode,
      leg.statTarget,
      leg.comparator,
    ]
      .filter(Boolean)
      .join("_");

  return stable || `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const normalizeDraftLeg = (leg: DraftParlayLeg): DraftParlayLeg => ({
  ...leg,
  id: leg.id || makeDraftLegId(leg),
});

export const useParlayCommandStore = create<ParlayCommandState>()((set, get) => ({
  activePanel: "build",
  draftLegs: [],
  aiPicks: [],
  savedSlips: [],
  optimistic: {
    saving: false,
    posting: false,
    lastError: null,
    lastSavedAt: null,
  },
  lastSyncAt: null,

  setActivePanel: (panel) => set({ activePanel: panel }),

  addDraftLeg: (leg) =>
    set((state) => {
      const normalized = normalizeDraftLeg(leg);
      const exists = state.draftLegs.some((existing) => existing.id === normalized.id);
      return {
        draftLegs: exists ? state.draftLegs : [...state.draftLegs, normalized],
      };
    }),

  addAiLegToDraft: (leg) => {
    get().addDraftLeg({ ...leg, source: "vai" });
    set({ activePanel: "build" });
  },

  removeDraftLeg: (id) =>
    set((state) => ({
      draftLegs: state.draftLegs.filter((leg) => leg.id !== id),
    })),

  clearDraft: () => set({ draftLegs: [] }),

  setAiPicks: (legs) => set({ aiPicks: legs.map(normalizeDraftLeg) }),

  hydrateSavedSlips: (rawSlips) =>
    set({
      savedSlips: rawSlips.map(normalizePublicSlip),
      lastSyncAt: new Date().toISOString(),
    }),

  addOptimisticSlip: (rawSlip) => {
    const optimisticId = `optimistic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const optimisticSlip = normalizePublicSlip({
      ...(rawSlip as Record<string, unknown>),
      id: optimisticId,
      status: normalizeSlipStatus((rawSlip as any)?.status || "PENDING"),
      synced: false,
    });

    set((state) => ({
      savedSlips: [optimisticSlip, ...state.savedSlips],
      optimistic: {
        ...state.optimistic,
        saving: true,
        lastError: null,
      },
    }));

    return optimisticId;
  },

  replaceOptimisticSlip: (optimisticId, savedSlip) =>
    set((state) => ({
      savedSlips: state.savedSlips.map((slip) =>
        slip.publicId.endsWith(optimisticId.slice(-6).toUpperCase())
          ? normalizePublicSlip({ ...(savedSlip as Record<string, unknown>), synced: true })
          : slip
      ),
      optimistic: {
        ...state.optimistic,
        saving: false,
        lastSavedAt: new Date().toISOString(),
      },
    })),

  removeOptimisticSlip: (optimisticId) =>
    set((state) => ({
      savedSlips: state.savedSlips.filter(
        (slip) => !slip.publicId.endsWith(optimisticId.slice(-6).toUpperCase())
      ),
      optimistic: {
        ...state.optimistic,
        saving: false,
      },
    })),

  setSaving: (saving) =>
    set((state) => ({
      optimistic: { ...state.optimistic, saving },
    })),

  setPosting: (posting) =>
    set((state) => ({
      optimistic: { ...state.optimistic, posting },
    })),

  setError: (message) =>
    set((state) => ({
      optimistic: { ...state.optimistic, lastError: message },
    })),
}));

export const selectActiveParlayPanel = (state: ParlayCommandState) => state.activePanel;
export const selectDraftLegs = (state: ParlayCommandState) => state.draftLegs;
export const selectSavedSlips = (state: ParlayCommandState) => state.savedSlips;
