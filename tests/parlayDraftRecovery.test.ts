import { beforeEach, describe, expect, it, vi } from "vitest";
import { setAccountStorageScope } from "../src/lib/accountStorage";
import { useParlayCommandStore, type DraftParlayLeg } from "../src/stores/parlayCommandStore";

const STORAGE_BASE = "vouchedge_parlayos_draft_v1";
const leg: DraftParlayLeg = {
  id: "judge-hr",
  source: "manual",
  sport: "MLB",
  selection: "Aaron Judge 1+ Home Run",
  playerName: "Aaron Judge",
  playerId: "592450",
  gamePk: "777001",
  marketCode: "ANYTIME_HR",
  statTarget: 1,
};

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
    clear: () => values.clear(),
    key: (index: number) => [...values.keys()][index] ?? null,
    get length() { return values.size; },
  } satisfies Storage;
}

describe("ParlayOS account-scoped draft recovery", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", memoryStorage());
    setAccountStorageScope(null);
    useParlayCommandStore.getState().resetDraftSession();
  });

  it("restores draft, note, waiting, and removed state after a reload-shaped reset", () => {
    useParlayCommandStore.getState().addDraftLeg(leg);
    useParlayCommandStore.getState().setSlipNote("Two independent game environments.");
    useParlayCommandStore.getState().moveDraftLegToWaiting(leg.id, "Confirm lineup");
    const saved = localStorage.getItem(`${STORAGE_BASE}:guest`);
    expect(saved).toBeTruthy();

    useParlayCommandStore.setState({ draftLegs: [], slipNote: "", waitingTargets: [], removedTargets: [] });
    localStorage.setItem(`${STORAGE_BASE}:guest`, saved!);
    useParlayCommandStore.getState().hydrateDraftSession();

    const restored = useParlayCommandStore.getState();
    expect(restored.slipNote).toBe("Two independent game environments.");
    expect(restored.waitingTargets[0].leg.playerName).toBe("Aaron Judge");
    expect(restored.waitingTargets[0].reason).toBe("Confirm lineup");
  });

  it("keeps guest and signed-in account drafts isolated", () => {
    useParlayCommandStore.getState().addDraftLeg(leg);

    setAccountStorageScope("user-2");
    useParlayCommandStore.getState().hydrateDraftSession();
    expect(useParlayCommandStore.getState().draftLegs).toHaveLength(0);

    useParlayCommandStore.getState().addDraftLeg({ ...leg, id: "soto-hr", playerName: "Juan Soto", playerId: "665742" });
    setAccountStorageScope(null);
    useParlayCommandStore.getState().hydrateDraftSession();
    expect(useParlayCommandStore.getState().draftLegs[0].id).toBe("judge-hr");
  });

  it("rejects malformed and older-than-14-day recovery data", () => {
    localStorage.setItem(`${STORAGE_BASE}:guest`, "not-json");
    useParlayCommandStore.getState().hydrateDraftSession();
    expect(useParlayCommandStore.getState().draftLegs).toHaveLength(0);

    localStorage.setItem(`${STORAGE_BASE}:guest`, JSON.stringify({
      version: 1,
      savedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      draftLegs: [leg],
      slipNote: "stale",
      waitingTargets: [],
      removedTargets: [],
      draftMode: "manual",
    }));
    useParlayCommandStore.getState().hydrateDraftSession();
    expect(useParlayCommandStore.getState().draftLegs).toHaveLength(0);
    expect(useParlayCommandStore.getState().slipNote).toBe("");
  });
});
