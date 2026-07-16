import { beforeEach, describe, expect, it } from "vitest";
import { useParlayCommandStore, type DraftParlayLeg } from "../src/stores/parlayCommandStore";

const leg: DraftParlayLeg = {
  id: "judge-hr",
  source: "manual",
  sport: "MLB",
  selection: "Aaron Judge 1+ Home Run",
  playerName: "Aaron Judge",
  playerId: "592450",
  gamePk: "777001",
  marketCode: "ANYTIME_HR",
  marketLabel: "Home Run",
  statTarget: 1,
  comparator: ">=",
  note: "Only if the lineup is confirmed.",
};

describe("ParlayOS decision states", () => {
  beforeEach(() => {
    useParlayCommandStore.setState({
      draftLegs: [],
      slipNote: "",
      waitingTargets: [],
      removedTargets: [],
      draftMode: "manual",
    });
  });

  it("moves a leg out of the active slip while it waits for confirmation", () => {
    const store = useParlayCommandStore.getState();
    store.addDraftLeg(leg);
    useParlayCommandStore.getState().moveDraftLegToWaiting(leg.id, "Lineup confirmation");

    const waiting = useParlayCommandStore.getState();
    expect(waiting.draftLegs).toHaveLength(0);
    expect(waiting.waitingTargets[0].leg.note).toBe("Only if the lineup is confirmed.");
    expect(waiting.waitingTargets[0].reason).toBe("Lineup confirmation");

    waiting.promoteWaitingTarget(waiting.waitingTargets[0].id);
    expect(useParlayCommandStore.getState().draftLegs).toHaveLength(1);
    expect(useParlayCommandStore.getState().waitingTargets).toHaveLength(0);
  });

  it("keeps removed legs recoverable with their previous state", () => {
    useParlayCommandStore.getState().addDraftLeg(leg);
    useParlayCommandStore.getState().removeDraftLeg(leg.id, "Changed my mind");

    const removed = useParlayCommandStore.getState().removedTargets[0];
    expect(removed.previousState).toBe("draft");
    expect(removed.reason).toBe("Changed my mind");

    useParlayCommandStore.getState().restoreRemovedTarget(removed.id);
    expect(useParlayCommandStore.getState().draftLegs[0].id).toBe(leg.id);
    expect(useParlayCommandStore.getState().removedTargets).toHaveLength(0);
  });

  it("stores a bounded slip note and clears it with the active draft", () => {
    useParlayCommandStore.getState().setSlipNote("x".repeat(700));
    expect(useParlayCommandStore.getState().slipNote).toHaveLength(500);
    useParlayCommandStore.getState().clearDraft();
    expect(useParlayCommandStore.getState().slipNote).toBe("");
  });
});
