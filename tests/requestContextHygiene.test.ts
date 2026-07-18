import { describe, expect, it } from "vitest";
import { requestContext, type RequestWithContext } from "../server/middleware/requestContext";

function run(header?: string) {
  const req = {
    headers: header == null ? {} : { "x-request-id": header },
  } as RequestWithContext;
  const headers: Record<string, string> = {};
  const res = {
    setHeader(name: string, value: string) {
      headers[name.toLowerCase()] = value;
      return this;
    },
  } as any;
  let nextCalled = false;
  requestContext(req, res, () => {
    nextCalled = true;
  });
  return { req, headers, nextCalled };
}

describe("requestContext hygiene", () => {
  it("accepts a safe inbound request id", () => {
    const { req, headers, nextCalled } = run("req_abc-123.OK");
    expect(nextCalled).toBe(true);
    expect(req.requestId).toBe("req_abc-123.OK");
    expect(headers["x-request-id"]).toBe("req_abc-123.OK");
  });

  it("rejects control characters / spaces and mints a UUID", () => {
    const { req, headers } = run("bad id\nwith\tcontrol");
    expect(req.requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(headers["x-request-id"]).toBe(req.requestId);
  });
});
