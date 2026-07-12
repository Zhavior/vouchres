import { create } from "zustand";
export type ParlayCommandPanel = "ai" | "vai_ledger" | "live" | "premium";

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

type DraftMode = "manual" | "ai_locked";

type ParlayCommandState = {
  activePanel: ParlayCommandPanel;
  draftLegs: DraftParlayLeg[];
  draftMode: DraftMode;
  aiPicks: AiRecommendedLeg[];
  optimistic: OptimisticSaveState;

  setActivePanel: (panel: ParlayCommandPanel) => void;
  addDraftLeg: (leg: DraftParlayLeg) => void;
  addAiLegToDraft: (leg: AiRecommendedLeg) => void;
  removeDraftLeg: (id: string) => void;
  updateDraftLeg: (id: string, patch: Partial<DraftParlayLeg>) => void;
  replaceDraftLeg: (id: string, leg: DraftParlayLeg) => void;
  clearDraft: () => void;
  setAiPicks: (legs: AiRecommendedLeg[]) => void;
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
  activePanel: "live",
  draftLegs: [],
  draftMode: "manual",
  aiPicks: [],
  optimistic: {
    saving: false,
    posting: false,
    lastError: null,
    lastSavedAt: null,
  },

  setActivePanel: (panel) => set({ activePanel: panel }),

  addDraftLeg: (leg) =>
    set((state) => {
      const normalized = normalizeDraftLeg(leg);
      const isAiLeg = normalized.source === "vai";

      if (state.draftMode === "ai_locked" && !isAiLeg) {
        return state;
      }

      if (state.draftMode === "manual" && state.draftLegs.some((existing) => existing.source === "vai") && !isAiLeg) {
        return state;
      }

      const exists = state.draftLegs.some((existing) => existing.id === normalized.id);
      return {
        draftLegs: exists ? state.draftLegs : [...state.draftLegs, normalized],
      };
    }),

  addAiLegToDraft: (leg) =>
    set((state) => {
      if (state.draftMode === "manual" && state.draftLegs.length > 0) {
        return state;
      }

      const normalized = normalizeDraftLeg({ ...leg, source: "vai" });
      const exists = state.draftLegs.some((existing) => existing.id === normalized.id);

      return {
        activePanel: "live",
        draftMode: "ai_locked",
        draftLegs: exists ? state.draftLegs : [...state.draftLegs, normalized],
      };
    }),

  removeDraftLeg: (id) =>
    set((state) => {
      const nextDraftLegs = state.draftLegs.filter((leg) => leg.id !== id);

      return {
        draftLegs: nextDraftLegs,
        draftMode: nextDraftLegs.length === 0 ? "manual" : state.draftMode,
      };
    }),

  updateDraftLeg: (id, patch) =>
    set((state) => ({
      draftLegs: state.draftLegs.map((leg) =>
        leg.id === id ? normalizeDraftLeg({ ...leg, ...patch, id: leg.id }) : leg,
      ),
    })),

  replaceDraftLeg: (id, leg) =>
    set((state) => ({
      draftLegs: state.draftLegs.map((existing) =>
        existing.id === id ? normalizeDraftLeg({ ...leg, id: existing.id }) : existing,
      ),
    })),

  clearDraft: () => set({ draftLegs: [], draftMode: "manual" }),

  setAiPicks: (legs) => set({ aiPicks: legs.map(normalizeDraftLeg) }),

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
