import { describe, expect, it } from "vitest";

import {
  addAuroraEvidence,
  createAuroraDecision,
  evaluateAuroraDecision,
} from "../src/core/aurora/AuroraDecision";
import { AuroraLedgerBridge } from "../src/core/aurora/ledger/AuroraLedgerBridge";
import { TrustLedger } from "../src/core/trust-ledger/TrustLedger";

const context = { marketId: "HR", contractVersion: "1.0" } as const;

const createCompletedDecision = () => {
  const draft = createAuroraDecision<
    { playerId: string; playerName: string },
    { selection: "yes" }
  >({
    id: "mlb-hr:2026-07-25:game-1:player-1",
    type: "mlb.home-run",
    question: "Will Test Player hit a home run?",
    input: { playerId: "player-1", playerName: "Test Player" },
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
    recommendation: { selection: "yes" },
    modelVersion: "aurora-test-v1",
  });
};

describe("AuroraLedgerBridge constitutional contract", () => {
  it("records one complete immutable prediction event", () => {
    const ledger = new TrustLedger();
    const bridge = new AuroraLedgerBridge(ledger);
    const decision = createCompletedDecision();

    expect(bridge.persist(decision, context)).toHaveLength(1);
    expect(ledger.history(decision.id)).toHaveLength(1);
    expect(ledger.history(decision.id)[0]).toMatchObject({
      type: "DECISION_RECORDED",
      version: 1,
      payload: {
        marketId: "HR",
        contractVersion: "1.0",
        confidence: decision.output?.confidence,
        score: decision.output?.score,
        recommendation: { selection: "yes" },
        modelVersion: "aurora-test-v1",
      },
      metadata: { source: "aurora" },
    });
  });

  it("is idempotent for the same completed decision", () => {
    const ledger = new TrustLedger();
    const bridge = new AuroraLedgerBridge(ledger);
    const decision = createCompletedDecision();

    expect(bridge.persist(decision, context)).toHaveLength(1);
    expect(bridge.persist(decision, context)).toHaveLength(0);
    expect(ledger.history(decision.id)).toHaveLength(1);
  });

  it("does not write an incomplete decision", () => {
    const ledger = new TrustLedger();
    const bridge = new AuroraLedgerBridge(ledger);
    const draft = createAuroraDecision({
      id: "mlb-hr:2026-07-25:game-2:player-2",
      type: "mlb.home-run",
      question: "Will Draft Player hit a home run?",
      input: { playerId: "player-2", playerName: "Draft Player" },
    });

    expect(bridge.persist(draft, context)).toHaveLength(0);
    expect(ledger.history(draft.id)).toHaveLength(0);
  });

  it("rejects an attempted amendment of the recorded prediction", () => {
    const ledger = new TrustLedger();
    const bridge = new AuroraLedgerBridge(ledger);
    const decision = createCompletedDecision();

    bridge.persist(decision, context);

    expect(() =>
      bridge.persist(decision, { ...context, contractVersion: "1.1" }),
    ).toThrow("immutable_event_conflict");
    expect(ledger.history(decision.id)).toHaveLength(1);
  });
});
