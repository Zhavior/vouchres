import { AppError, isAppError } from "../errors/AppError";
import { structuredLog } from "../lib/structuredLog";
import type { AegisContract } from "./contracts";
import { createAegisExecutionContext, type AegisActor, type AegisExecutionContext } from "./context";

export type AegisCommandResult<T> = {
  value: T;
  provenance?: readonly Record<string, unknown>[];
  audit?: Record<string, unknown>;
};

export type AegisExecutionResult<T> = AegisCommandResult<T> & {
  context: AegisExecutionContext;
  durationMs: number;
};

function withExecutionId(error: AppError, executionId: string): AppError {
  return new AppError({
    status: error.status,
    code: error.code,
    message: error.message,
    details: error.details,
    expose: error.expose,
    cause: error.cause ?? error,
    executionId,
  });
}

export async function executeAegis<TInput, TOutput>(input: {
  contract: AegisContract<TInput, TOutput>;
  rawInput: unknown;
  actor: AegisActor;
  source: AegisExecutionContext["source"];
  requestId?: string;
  correlationId?: string;
  causationId?: string;
  idempotencyKey?: string;
  handler: (validatedInput: TInput, context: AegisExecutionContext) => Promise<AegisCommandResult<TOutput>>;
}): Promise<AegisExecutionResult<TOutput>> {
  const context = createAegisExecutionContext({
    actor: input.actor,
    contract: { name: input.contract.name, version: input.contract.version },
    source: input.source,
    requestId: input.requestId,
    correlationId: input.correlationId,
    causationId: input.causationId,
    idempotencyKey: input.idempotencyKey,
  });
  const started = process.hrtime.bigint();

  structuredLog({
    level: "info",
    event: "aegis.execution.started",
    requestId: context.requestId,
    executionId: context.executionId,
    correlationId: context.correlationId,
    contract: input.contract.name,
    contractVersion: input.contract.version,
    domain: input.contract.domain,
    actorType: input.actor.type,
    source: input.source,
  });

  try {
    if (!input.contract.allowedActors.includes(input.actor.type)) {
      throw new AppError({
        status: input.actor.type === "anonymous" ? 401 : 403,
        code: input.actor.type === "anonymous" ? "missing_token" : "forbidden",
        message: "This actor is not allowed to execute the requested operation.",
      });
    }

    if (input.contract.idempotency.mode === "required" && !input.idempotencyKey) {
      throw new AppError({
        status: 400,
        code: "validation_error",
        message: "An idempotency key is required for this operation.",
      });
    }

    const parsedInput = input.contract.input.safeParse(input.rawInput);
    if (!parsedInput.success) {
      throw new AppError({
        status: 400,
        code: "validation_error",
        message: "Request validation failed.",
        details: parsedInput.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const result = await input.handler(parsedInput.data, context);
    const parsedOutput = input.contract.output.safeParse(result.value);
    if (!parsedOutput.success) {
      throw new AppError({
        status: 500,
        code: "internal_server_error",
        message: `Aegis output contract failed for ${input.contract.name}.`,
        cause: parsedOutput.error,
      });
    }

    const durationMs = Number(process.hrtime.bigint() - started) / 1_000_000;
    structuredLog({
      level: "info",
      event: "aegis.execution.completed",
      requestId: context.requestId,
      executionId: context.executionId,
      correlationId: context.correlationId,
      contract: input.contract.name,
      contractVersion: input.contract.version,
      domain: input.contract.domain,
      durationMs: Math.round(durationMs),
      success: true,
      idempotencyDeclared: input.contract.idempotency.mode,
      idempotencyKeyPresent: Boolean(input.idempotencyKey),
      provenanceCount: result.provenance?.length ?? 0,
    });

    return { ...result, value: parsedOutput.data, context, durationMs };
  } catch (error) {
    const durationMs = Number(process.hrtime.bigint() - started) / 1_000_000;
    const normalized = isAppError(error)
      ? withExecutionId(error, context.executionId)
      : new AppError({
          status: 500,
          code: "internal_server_error",
          message: "Aegis execution failed.",
          cause: error,
          executionId: context.executionId,
        });

    structuredLog({
      level: normalized.status >= 500 ? "error" : "warn",
      event: "aegis.execution.failed",
      requestId: context.requestId,
      executionId: context.executionId,
      correlationId: context.correlationId,
      contract: input.contract.name,
      contractVersion: input.contract.version,
      domain: input.contract.domain,
      durationMs: Math.round(durationMs),
      success: false,
      code: normalized.code,
      retryable: normalized.code === "upstream_unavailable" || normalized.code === "external_service_error",
    });
    throw normalized;
  }
}

export function aegisResponseMeta(result: AegisExecutionResult<unknown>) {
  return {
    executionId: result.context.executionId,
    correlationId: result.context.correlationId,
    contract: result.context.contract,
  };
}
