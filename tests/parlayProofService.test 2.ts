import { describe, expect, it } from "vitest";
import {
  formatProofTimestamp,
  parlayProofAuthorLabel,
  type PublicParlayProof,
} from "../server/services/proof/parlayProofService";

describe("parlayProofService helpers", () => {
  it("formats proof timestamps in UTC", () => {
    const formatted = formatProofTimestamp("2026-07-10T15:30:00.000Z");
    expect(formatted).toContain("2026");
    expect(formatted.toLowerCase()).toContain("utc");
  });

  it("prefers author handle for proof labels", () => {
    const proof = {
      author: { id: "u1", handle: "edgeking", username: "EdgeKing", display_name: "Edge King", avatar_url: null },
      capper: null,
    } as PublicParlayProof;

    expect(parlayProofAuthorLabel(proof)).toBe("@edgeking");
  });

  it("falls back to capper display name", () => {
    const proof = {
      author: null,
      capper: { id: "professor", display_name: "The Professor" },
    } as PublicParlayProof;

    expect(parlayProofAuthorLabel(proof)).toBe("The Professor");
  });
});
