import { beforeEach, describe, expect, it, vi } from "vitest";

const otsMocks = vi.hoisted(() => ({
  submit: vi.fn(),
  write: vi.fn(),
}));

vi.mock("@vitrified/typescript-opentimestamps", () => ({
  submit: otsMocks.submit,
  write: otsMocks.write,
}));

import {
  decodeOtsProofBase64,
  stampSha256ProofHash,
} from "../server/services/trust/openTimestampService";

describe("openTimestampService", () => {
  beforeEach(() => {
    otsMocks.submit.mockReset();
    otsMocks.write.mockReset();
  });

  it("rejects malformed proof hashes without contacting a calendar", async () => {
    await expect(stampSha256ProofHash("not-a-sha256")).resolves.toBeNull();
    expect(otsMocks.submit).not.toHaveBeenCalled();
  });

  it("rejects empty or malformed proof encodings", () => {
    expect(decodeOtsProofBase64("")).toBeNull();
    expect(decodeOtsProofBase64("%%%")).toBeNull();
  });

  it("serializes a proof and reports only calendars that accepted it", async () => {
    otsMocks.submit.mockResolvedValue({
      timestamp: { version: 1 },
      errors: [
        new Error("Error (https://bob.btc.calendar.opentimestamps.org/): unavailable"),
        new Error("Error (https://finney.calendar.eternitywall.com/): unavailable"),
        new Error("Error (https://btc.calendar.catallaxy.com/): unavailable"),
      ],
    });
    otsMocks.write.mockReturnValue(Uint8Array.of(0, 79, 84, 83));

    const result = await stampSha256ProofHash("a".repeat(64));

    expect(otsMocks.submit).toHaveBeenCalledWith("sha256", expect.any(Uint8Array));
    expect(result).toMatchObject({
      proofBase64: Buffer.from(Uint8Array.of(0, 79, 84, 83)).toString("base64"),
      calendars: ["https://alice.btc.calendar.opentimestamps.org"],
    });
    expect(decodeOtsProofBase64(result?.proofBase64 ?? "")).toEqual(Buffer.from(Uint8Array.of(0, 79, 84, 83)));
  });

  it("fails closed when every calendar rejects the stamp", async () => {
    otsMocks.submit.mockResolvedValue({
      timestamp: { version: 1 },
      errors: [
        new Error("alice failed"),
        new Error("bob failed"),
        new Error("finney failed"),
        new Error("catallaxy failed"),
      ],
    });

    await expect(stampSha256ProofHash("b".repeat(64))).resolves.toBeNull();
    expect(otsMocks.write).not.toHaveBeenCalled();
  });
});
