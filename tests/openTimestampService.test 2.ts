import { describe, expect, it } from "vitest";
import { decodeOtsProofBase64 } from "../server/services/trust/openTimestampService";

describe("openTimestampService helpers", () => {
  it("decodes base64 OTS proof bytes", () => {
    expect(decodeOtsProofBase64("YQ==")?.toString("utf8")).toBe("a");
    expect(decodeOtsProofBase64("")).toBeNull();
    expect(decodeOtsProofBase64("%%%")).toBeNull();
  });
});
