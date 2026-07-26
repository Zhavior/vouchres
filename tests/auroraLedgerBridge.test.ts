import { describe, expect, it } from "vitest";

import {
  addAuroraEvidence,
  createAuroraDecision,
  evaluateAuroraDecision,
} from "../src/core/aurora/AuroraDecision";
import { AuroraLedgerBridge } from "../src/core/aurora/ledger/AuroraLedgerBridge";
import type { TrustLedger } from "../src/core/trust-ledger/TrustLedger";

class FakeTrustLedger {
  private readonly events = new Map<string, any[]>();

  history(streamId: string): readonly any[] {
    return this.events.get(streamId) ?? [];
  }

  append(event: any): void {
    const history = this.events.get(event.streamId) ?? [];

    if (history.some((existing) => existing.id === event.id)) {
      return;
    }

    this.events.set(event.streamId, [...history, event]);
  }
}

const createCompletedDecision = () => {
  const draft = createAuroraDecision<
    {
      playerId: string;
      playerName: string;
    },
    {
      selection: "yes";
    }
  >({
    id: "mlb-hr:2026-07-25:game-1:player-1",
    type: "mlb.home-run",
    question: "Will Test Player hit a home run?",
    input: {
      playerId: "player-1",
      playerName: "Test Player",
    },
  });

  const evaluating = addAuroraEvidence(draft, {
    id: "evidence-1",
    decisionId: draft.id,
    label: "Barrel rate",
    summary: "Barrel rate supports the home-run projection.",
    direction: "supports",
    weight: 0.9,
    confidence: 0.8,
  });

  return evaluateAuroraDecision(evaluating, {
    recommendation: {
      selection: "yes",
    },
    modelVersion: "aurora-test-v1",
  });
};

describe("AuroraLedgerBridge", () => {
  it("persists creation and confidence events for a completed decision", () => {
    const ledger = new FakeTrustLedger();
    const bridge = new AuroraLedgerBridge(ledger as unknown as TrustLedger);

    const decision = createCompletedDecision();
    const persisted = bridge.persist(decision);
    const history = ledger.history(decision.id);

    expect(persisted).toHaveLength(2);
    expect(history).toHaveLength(2);
    expect(history.map((event) => event.type)).toEqual([
      "DecisionCreated",
      "ConfidenceRevised",
    ]);

    expect(history[0]?.version).toBe(1);
    expect(history[1]?.version).toBe(2);
    expect(history[1]?.payload).toMatchObject({
      confidence: decision.output?.confidence,
      score: decision.output?.score,
      status: decision.output?.status,
      modelVersion: "aurora-test-v1",
    });
  });

  it("does not duplicate an unchanged completed decision", () => {
    const ledger = new FakeTrustLedger();
    const bridge = new AuroraLedgerBridge(ledger as unknown as TrustLedger);

    const decision = createCompletedDecision();

    expect(bridge.persist(decision)).toHaveLength(2);
    expect(bridge.persist(decision)).toHaveLength(0);
    expect(ledger.history(decision.id)).toHaveLength(2);
  });

  it("persists only the creation event for an unfinished decision", () => {
    const ledger = new FakeTrustLedger();
    const bridge = new AuroraLedgerBridge(ledger as unknown as TrustLedger);

    const decision = createAuroraDecision({
      id: "mlb-hr:2026-07-25:game-2:player-2",
      type: "mlb.home-run",
      question: "Will Draft Player hit a home run?",
      input: {
        playerId: "player-2",
        playerName: "Draft Player",
      },
    });

    const persisted = bridge.persist(decision);

    expect(persisted).toHaveLength(1);
    expect(ledger.history(decision.id)).toHaveLength(1);
    expect(ledger.history(decision.id)[0]?.type).toBe("DecisionCreated");
  });
});
