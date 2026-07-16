import { create } from "zustand";
import {
  PublicParlaySlip,
  normalizePublicSlip,
  normalizeSlipStatus,
  isLiveLikeStatus,
} from "../lib/parlayDisplay";
import { repairDraftLegIdentity, repairDraftLegsIdentity } from "../lib/parlays/repairDraftLegIdentity";
import type { LiveGameRef } from "../lib/parlays/parlayLegValidator";
import type { ParlayAddSnapshot } from "../lib/parlays/parlayAddContract";
import { accountStorageKey } from "../lib/accountStorage";

const PARLAY_DRAFT_STORAGE_KEY = "vouchedge_parlayos_draft_v1";
const DRAFT_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

export type ParlayCommandPanel = "build" | "ai" | "vai_ledger" | "live" | "premium";

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
  addSnapshot?: ParlayAddSnapshot;
  note?: string | null;
};

export type WaitingParlayTarget = {
  id: string;
  leg: DraftParlayLeg;
  reason: string | null;
  movedAt: string;
};

export type RemovedParlayTarget = {
  id: string;
  leg: DraftParlayLeg;
  reason: string | null;
  removedAt: string;
  previousState: "draft" | "waiting";
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
  slipNote: string;
  waitingTargets: WaitingParlayTarget[];
  removedTargets: RemovedParlayTarget[];
  draftMode: DraftMode;
  aiPicks: AiRecommendedLeg[];
  savedSlips: PublicParlaySlip[];
  optimistic: OptimisticSaveState;
  lastSyncAt: string | null;

  setActivePanel: (panel: ParlayCommandPanel) => void;
  addDraftLeg: (leg: DraftParlayLeg) => void;
  addAiLegToDraft: (leg: AiRecommendedLeg) => void;
  removeDraftLeg: (id: string, reason?: string | null) => void;
  updateDraftLeg: (id: string, patch: Partial<DraftParlayLeg>) => void;
  replaceDraftLeg: (id: string, leg: DraftParlayLeg) => void;
  setSlipNote: (note: string) => void;
  moveDraftLegToWaiting: (id: string, reason?: string | null) => void;
  promoteWaitingTarget: (id: string) => void;
  removeWaitingTarget: (id: string, reason?: string | null) => void;
  restoreRemovedTarget: (id: string) => void;
  clearRemovedTargets: () => void;
  clearDraft: () => void;
  hydrateDraftSession: () => void;
  resetDraftSession: () => void;
  setAiPicks: (legs: AiRecommendedLeg[]) => void;
  hydrateSavedSlips: (rawSlips: unknown[]) => void;
  addOptimisticSlip: (rawSlip: unknown) => string;
  replaceOptimisticSlip: (optimisticId: string, savedSlip: unknown) => void;
  removeOptimisticSlip: (optimisticId: string) => void;
  setSaving: (saving: boolean) => void;
  setPosting: (posting: boolean) => void;
  setError: (message: string | null) => void;
  batchRepairDraftLegs: (liveGames: LiveGameRef[]) => void;
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

const normalizeDraftLeg = (leg: DraftParlayLeg, liveGames: LiveGameRef[] = []): DraftParlayLeg => {
  const { leg: repaired } = repairDraftLegIdentity(leg, liveGames);
  const gamePk = repaired.gamePk ?? (repaired.gameId != null ? String(repaired.gameId) : undefined);
  const gameId = repaired.gameId ?? repaired.gamePk ?? null;
  return {
    ...repaired,
    id: leg.id || makeDraftLegId(repaired),
    gamePk,
    gameId,
    comparator: repaired.comparator ?? ">=",
  };
};

type PersistedDraftSession = {
  version: 1;
  savedAt: string;
  draftLegs: DraftParlayLeg[];
  slipNote: string;
  waitingTargets: WaitingParlayTarget[];
  removedTargets: RemovedParlayTarget[];
  draftMode: DraftMode;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isDraftLeg(value: unknown): value is DraftParlayLeg {
  return isRecord(value)
    && typeof value.id === "string"
    && typeof value.source === "string"
    && typeof value.sport === "string"
    && typeof value.selection === "string";
}

function validWaitingTarget(value: unknown): value is WaitingParlayTarget {
  return isRecord(value)
    && typeof value.id === "string"
    && isDraftLeg(value.leg)
    && typeof value.movedAt === "string";
}

function validRemovedTarget(value: unknown): value is RemovedParlayTarget {
  return isRecord(value)
    && typeof value.id === "string"
    && isDraftLeg(value.leg)
    && typeof value.removedAt === "string"
    && (value.previousState === "draft" || value.previousState === "waiting");
}

function parsePersistedDraftSession(raw: string | null): PersistedDraftSession | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || parsed.version !== 1 || typeof parsed.savedAt !== "string") return null;
    const savedAt = Date.parse(parsed.savedAt);
    if (!Number.isFinite(savedAt) || Date.now() - savedAt > DRAFT_MAX_AGE_MS) return null;

    const draftLegs = Array.isArray(parsed.draftLegs) ? parsed.draftLegs.filter(isDraftLeg).slice(0, 12) : [];
    const waitingTargets = Array.isArray(parsed.waitingTargets) ? parsed.waitingTargets.filter(validWaitingTarget).slice(0, 25) : [];
    const removedTargets = Array.isArray(parsed.removedTargets) ? parsed.removedTargets.filter(validRemovedTarget).slice(0, 25) : [];
    return {
      version: 1,
      savedAt: parsed.savedAt,
      draftLegs,
      slipNote: typeof parsed.slipNote === "string" ? parsed.slipNote.slice(0, 500) : "",
      waitingTargets,
      removedTargets,
      draftMode: parsed.draftMode === "ai_locked" && draftLegs.length > 0 ? "ai_locked" : "manual",
    };
  } catch {
    return null;
  }
}

function writeDraftSession(state: ParlayCommandState): void {
  if (typeof localStorage === "undefined") return;
  const payload: PersistedDraftSession = {
    version: 1,
    savedAt: new Date().toISOString(),
    draftLegs: state.draftLegs.slice(0, 12),
    slipNote: state.slipNote.slice(0, 500),
    waitingTargets: state.waitingTargets.slice(0, 25),
    removedTargets: state.removedTargets.slice(0, 25),
    draftMode: state.draftMode,
  };
  try {
    localStorage.setItem(accountStorageKey(PARLAY_DRAFT_STORAGE_KEY), JSON.stringify(payload));
  } catch {
    // Browser storage can be unavailable or full; the in-memory draft still works.
  }
}

export const useParlayCommandStore = create<ParlayCommandState>()((set, get) => ({
  activePanel: "build",
  draftLegs: [],
  slipNote: "",
  waitingTargets: [],
  removedTargets: [],
  draftMode: "manual",
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
        activePanel: "build",
        draftMode: "ai_locked",
        draftLegs: exists ? state.draftLegs : [...state.draftLegs, normalized],
      };
    }),

  removeDraftLeg: (id, reason = null) =>
    set((state) => {
      const removedLeg = state.draftLegs.find((leg) => leg.id === id);
      if (!removedLeg) return state;
      const nextDraftLegs = state.draftLegs.filter((leg) => leg.id !== id);

      return {
        draftLegs: nextDraftLegs,
        removedTargets: [{
          id: `removed-${Date.now()}-${removedLeg.id}`,
          leg: removedLeg,
          reason,
          removedAt: new Date().toISOString(),
          previousState: "draft" as const,
        }, ...state.removedTargets].slice(0, 25),
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
        existing.id === id
          ? normalizeDraftLeg({
              ...existing,
              ...leg,
              id: existing.id,
              addSnapshot: leg.addSnapshot ?? existing.addSnapshot,
              note: Object.prototype.hasOwnProperty.call(leg, "note") ? leg.note : existing.note,
            })
          : existing,
      ),
    })),

  setSlipNote: (note) => set({ slipNote: note.slice(0, 500) }),

  moveDraftLegToWaiting: (id, reason = null) =>
    set((state) => {
      const leg = state.draftLegs.find((candidate) => candidate.id === id);
      if (!leg) return state;
      const nextDraftLegs = state.draftLegs.filter((candidate) => candidate.id !== id);
      return {
        draftLegs: nextDraftLegs,
        waitingTargets: [{
          id: `waiting-${Date.now()}-${leg.id}`,
          leg,
          reason,
          movedAt: new Date().toISOString(),
        }, ...state.waitingTargets],
        draftMode: nextDraftLegs.length === 0 ? "manual" : state.draftMode,
      };
    }),

  promoteWaitingTarget: (id) =>
    set((state) => {
      const target = state.waitingTargets.find((candidate) => candidate.id === id);
      if (!target || state.draftLegs.some((leg) => leg.id === target.leg.id)) return state;
      return {
        draftLegs: [...state.draftLegs, normalizeDraftLeg(target.leg)],
        waitingTargets: state.waitingTargets.filter((candidate) => candidate.id !== id),
      };
    }),

  removeWaitingTarget: (id, reason = null) =>
    set((state) => {
      const target = state.waitingTargets.find((candidate) => candidate.id === id);
      if (!target) return state;
      return {
        waitingTargets: state.waitingTargets.filter((candidate) => candidate.id !== id),
        removedTargets: [{
          id: `removed-${Date.now()}-${target.leg.id}`,
          leg: target.leg,
          reason: reason ?? target.reason,
          removedAt: new Date().toISOString(),
          previousState: "waiting" as const,
        }, ...state.removedTargets].slice(0, 25),
      };
    }),

  restoreRemovedTarget: (id) =>
    set((state) => {
      const target = state.removedTargets.find((candidate) => candidate.id === id);
      if (!target) return state;
      const removedTargets = state.removedTargets.filter((candidate) => candidate.id !== id);
      if (target.previousState === "waiting") {
        return {
          removedTargets,
          waitingTargets: [{
            id: `waiting-${Date.now()}-${target.leg.id}`,
            leg: target.leg,
            reason: target.reason,
            movedAt: new Date().toISOString(),
          }, ...state.waitingTargets],
        };
      }
      if (state.draftLegs.some((leg) => leg.id === target.leg.id)) return { removedTargets };
      return {
        removedTargets,
        draftLegs: [...state.draftLegs, normalizeDraftLeg(target.leg)],
      };
    }),

  clearRemovedTargets: () => set({ removedTargets: [] }),

  clearDraft: () => set({ draftLegs: [], slipNote: "", draftMode: "manual" }),

  hydrateDraftSession: () => {
    if (typeof localStorage === "undefined") return;
    let restored: PersistedDraftSession | null = null;
    try {
      restored = parsePersistedDraftSession(localStorage.getItem(accountStorageKey(PARLAY_DRAFT_STORAGE_KEY)));
    } catch {
      restored = null;
    }
    set(restored ? {
      draftLegs: restored.draftLegs.map((leg) => normalizeDraftLeg(leg)),
      slipNote: restored.slipNote,
      waitingTargets: restored.waitingTargets,
      removedTargets: restored.removedTargets,
      draftMode: restored.draftMode,
    } : {
      draftLegs: [],
      slipNote: "",
      waitingTargets: [],
      removedTargets: [],
      draftMode: "manual",
    });
  },

  resetDraftSession: () => {
    if (typeof localStorage !== "undefined") {
      try {
        localStorage.removeItem(accountStorageKey(PARLAY_DRAFT_STORAGE_KEY));
      } catch {
        // Ignore storage failures and still reset in-memory state.
      }
    }
    set({ draftLegs: [], slipNote: "", waitingTargets: [], removedTargets: [], draftMode: "manual" });
  },

  setAiPicks: (legs) => set({ aiPicks: legs.map((leg) => normalizeDraftLeg(leg)) }),

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

  batchRepairDraftLegs: (liveGames) =>
    set((state) => {
      const { legs, changed } = repairDraftLegsIdentity(state.draftLegs, liveGames);
      if (!changed) return state;
      return {
        draftLegs: legs.map((leg) => normalizeDraftLeg(leg, liveGames)),
      };
    }),
}));

useParlayCommandStore.subscribe((state, previous) => {
  if (
    state.draftLegs !== previous.draftLegs
    || state.slipNote !== previous.slipNote
    || state.waitingTargets !== previous.waitingTargets
    || state.removedTargets !== previous.removedTargets
    || state.draftMode !== previous.draftMode
  ) {
    writeDraftSession(state);
  }
});

export const selectActiveParlayPanel = (state: ParlayCommandState) => state.activePanel;
export const selectDraftLegs = (state: ParlayCommandState) => state.draftLegs;
export const selectSavedSlips = (state: ParlayCommandState) => state.savedSlips;
