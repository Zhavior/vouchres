import { describe, expect, it } from "vitest";
import { PUBLIC_PICK_COLUMNS, toPublicPickDto } from "../server/lib/publicPickDto";

describe("publicPickDto", () => {
  it("never selects ots_proof or client_ref", () => {
    expect(PUBLIC_PICK_COLUMNS).not.toContain("ots_proof");
    expect(PUBLIC_PICK_COLUMNS).not.toContain("client_ref");
    expect(PUBLIC_PICK_COLUMNS).toContain("proof_hash");
  });

  it("strips sensitive keys and exposes has_ots_proof", () => {
    const dto = toPublicPickDto({
      id: "p1",
      status: "won",
      ots_proof: "BASE64BLOB",
      client_ref: "secret-ref",
      judge_verdict: "should not leak",
      ots_stamped_at: "2026-07-18T00:00:00.000Z",
    });

    expect(dto.ots_proof).toBeUndefined();
    expect(dto.client_ref).toBeUndefined();
    expect(dto.judge_verdict).toBeUndefined();
    expect(dto.has_ots_proof).toBe(true);
    expect(dto.status).toBe("won");
  });
});
