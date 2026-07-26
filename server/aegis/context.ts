import { randomUUID } from "node:crypto";
import type { AegisActorType, AegisSourceType } from "./contracts";

export type AegisActor =
  | { type: "anonymous" }
  | { type: Exclude<AegisActorType, "anonymous">; id: string };

export type AegisExecutionContext = {
  executionId: string;
  requestId?: string;
  correlationId: string;
  causationId?: string;
  idempotencyKey?: string;
  actor: AegisActor;
  contract: { name: string; version: number };
  source: { type: AegisSourceType; name: string };
  startedAt: string;
};

export function createAegisExecutionContext(input: {
  actor: AegisActor;
  contract: { name: string; version: number };
  source: { type: AegisSourceType; name: string };
  requestId?: string;
  correlationId?: string;
  causationId?: string;
  idempotencyKey?: string;
}): AegisExecutionContext {
  const executionId = randomUUID();
  return {
    executionId,
    ...(input.requestId ? { requestId: input.requestId } : {}),
    correlationId: input.correlationId ?? input.requestId ?? executionId,
    ...(input.causationId ? { causationId: input.causationId } : {}),
    ...(input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : {}),
    actor: input.actor,
    contract: input.contract,
    source: input.source,
    startedAt: new Date().toISOString(),
  };
}
