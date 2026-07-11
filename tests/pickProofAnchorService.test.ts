import { beforeEach, describe, expect, it, vi } from "vitest";

const stampSha256ProofHash = vi.hoisted(() => vi.fn());

vi.mock("../server/services/trust/openTimestampService", () => ({
  stampSha256ProofHash,
}));

const supabaseAdmin = vi.hoisted(() => ({
  from: vi.fn(),
}));

vi.mock("../server/middleware/auth", () => ({
  getSupabaseAdmin: vi.fn(async () => supabaseAdmin),
}));

import { anchorParlayProofOpenTimestamp, backfillOpenTimestampsForLockedPicks } from "../server/services/trust/pickProofAnchorService";

describe("pickProofAnchorService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stampSha256ProofHash.mockResolvedValue({
      proofBase64: "b3Rz",
      stampedAt: "2026-07-11T06:00:00.000Z",
      calendars: [],
    });

    const updateEq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn(() => ({ eq: updateEq }));
    const limit = vi.fn().mockResolvedValue({
      data: [{ id: "pick-1", proof_hash: "a".repeat(64), locked_at: "2026-07-10T12:00:00.000Z", ots_proof: null }],
      error: null,
    });
    const order = vi.fn(() => ({ limit }));
    const isOts = vi.fn(() => ({ order }));
    const notProof = vi.fn(() => ({ is: isOts }));
    const notLocked = vi.fn(() => ({ not: notProof }));
    const select = vi.fn(() => ({ not: notLocked }));
    supabaseAdmin.from.mockReturnValue({ update, select });
  });

  it("anchors an OpenTimestamp proof for a pick", async () => {
    const result = await anchorParlayProofOpenTimestamp({
      pickId: "pick-1",
      proofHash: "a".repeat(64),
    });

    expect(result.anchored).toBe(true);
    expect(stampSha256ProofHash).toHaveBeenCalledWith("a".repeat(64));
  });

  it("backfills locked picks missing OTS proofs", async () => {
    const result = await backfillOpenTimestampsForLockedPicks({ limit: 5 });
    expect(result.scanned).toBe(1);
    expect(result.anchored).toBe(1);
  });
});
