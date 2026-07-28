import { describe, expect, it } from "vitest";
import { listAegisContracts } from "../server/aegis/registry";
import {
  CommitParlayTrustCommand,
  FinalizeParlayTrustLockCommand,
  SaveParlayCommand,
} from "../server/v3/modules/parlays/aegisContracts";

describe("Aegis parlay contracts", () => {
  it("registers one versioned contract per migrated command", () => {
    const keys = listAegisContracts().map((contract) => `${contract.name}@${contract.version}`);
    expect(keys).toEqual(expect.arrayContaining([
      "SaveParlayCommand@1",
      "CommitParlayTrustCommand@1",
      "FinalizeParlayTrustLockCommand@1",
    ]));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("declares canonical ownership, audit, and idempotency behavior", () => {
    expect(SaveParlayCommand).toMatchObject({
      domain: "parlay",
      allowedActors: ["user"],
      idempotency: { mode: "optional", durableStore: "public.picks(user_id, client_ref)" },
    });
    expect(CommitParlayTrustCommand.audit).toBe("best_effort_durable");
    expect(CommitParlayTrustCommand.emittedEvents).toEqual([]);
    expect(CommitParlayTrustCommand.idempotency.mode).toBe("resource_state");
    expect(FinalizeParlayTrustLockCommand.allowedActors).toEqual(["user", "worker", "system"]);
    expect(FinalizeParlayTrustLockCommand.idempotency.replay).toBe("return_current_state");
    expect(FinalizeParlayTrustLockCommand.audit).toBe("best_effort_durable");
  });

  it("rejects malformed parlay identity at the command boundary", () => {
    const parsed = SaveParlayCommand.input.safeParse({
      body: { legs: [{ event_id: "leg-fake", selection: "Unsafe leg" }] },
    });
    expect(parsed.success).toBe(false);
  });
});
