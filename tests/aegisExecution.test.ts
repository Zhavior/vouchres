import { z } from "zod";
import { describe, expect, it, vi } from "vitest";
import { AppError } from "../server/errors/AppError";
import { defineAegisContract } from "../server/aegis/contracts";
import { executeAegis } from "../server/aegis/execute";

const TestCommand = defineAegisContract({
  name: "TestCommand",
  version: 1,
  kind: "command",
  domain: "test",
  input: z.object({ value: z.string().min(1) }),
  output: z.object({ normalized: z.string() }),
  allowedActors: ["user"],
  authorizationPolicy: "test user",
  entitlementPolicy: null,
  idempotency: {
    mode: "required",
    keySource: "test header",
    durableStore: "test store",
    replay: "return_prior_result",
  },
  sideEffects: [],
  emittedEvents: [],
  expectedErrors: ["validation_error", "forbidden"],
  sensitivity: "internal",
  audit: "telemetry",
});

describe("executeAegis", () => {
  it("validates, preserves the request correlation id, and invokes the handler once", async () => {
    const handler = vi.fn(async (input: { value: string }) => ({
      value: { normalized: input.value.toUpperCase() },
    }));

    const result = await executeAegis({
      contract: TestCommand,
      rawInput: { value: "safe" },
      actor: { type: "user", id: "user-1" },
      requestId: "request-1234",
      idempotencyKey: "same-command-1",
      source: { type: "http", name: "POST /test" },
      handler,
    });

    expect(result.value).toEqual({ normalized: "SAFE" });
    expect(result.context.requestId).toBe("request-1234");
    expect(result.context.correlationId).toBe("request-1234");
    expect(result.context.executionId).toMatch(/^[0-9a-f-]{36}$/);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("fails before the handler when the idempotency key is missing", async () => {
    const handler = vi.fn();
    await expect(executeAegis({
      contract: TestCommand,
      rawInput: { value: "safe" },
      actor: { type: "user", id: "user-1" },
      source: { type: "internal", name: "test" },
      handler,
    })).rejects.toMatchObject({
      code: "validation_error",
      executionId: expect.stringMatching(/^[0-9a-f-]{36}$/),
    });
    expect(handler).not.toHaveBeenCalled();
  });

  it("rejects disallowed actors and attaches the execution id", async () => {
    await expect(executeAegis({
      contract: TestCommand,
      rawInput: { value: "safe" },
      actor: { type: "anonymous" },
      idempotencyKey: "anonymous-1",
      source: { type: "http", name: "POST /test" },
      handler: async () => ({ value: { normalized: "never" } }),
    })).rejects.toMatchObject({ code: "missing_token", executionId: expect.any(String) });
  });

  it("fails closed when a handler violates the output contract", async () => {
    await expect(executeAegis({
      contract: TestCommand,
      rawInput: { value: "safe" },
      actor: { type: "user", id: "user-1" },
      idempotencyKey: "output-1",
      source: { type: "internal", name: "test" },
      handler: async () => ({ value: { normalized: 42 } as unknown as { normalized: string } }),
    })).rejects.toBeInstanceOf(AppError);
  });
});
