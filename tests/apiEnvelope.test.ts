import { describe, expect, it } from "vitest";
import { parseApiErrorBody, unwrapApiPayload } from "../src/lib/apiEnvelope";

describe("apiEnvelope", () => {
  it("unwraps ok+data envelopes", () => {
    expect(unwrapApiPayload({ ok: true, data: { rows: [1] } })).toEqual({ rows: [1] });
  });

  it("unwraps ok+flat legacy envelopes", () => {
    expect(
      unwrapApiPayload({
        ok: true,
        date: "2026-07-09",
        rows: [],
        meta: { requestId: "req_1" },
      }),
    ).toEqual({
      date: "2026-07-09",
      rows: [],
    });
  });

  it("passes through non-envelope payloads", () => {
    expect(unwrapApiPayload({ rows: [1] })).toEqual({ rows: [1] });
  });

  it("throws structured errors for ok:false envelopes", () => {
    try {
      unwrapApiPayload({
        ok: false,
        error: { code: "not_found", message: "Missing" },
      });
      expect.unreachable("expected unwrapApiPayload to throw");
    } catch (error) {
      expect(error).toMatchObject({ code: "not_found", message: "Missing" });
    }
  });

  it("parses error bodies with HTTP status", () => {
    expect(
      parseApiErrorBody(
        { ok: false, error: { code: "upstream_unavailable", message: "Down" } },
        503,
      ),
    ).toEqual({
      code: "upstream_unavailable",
      message: "Down",
      status: 503,
    });
  });
});
