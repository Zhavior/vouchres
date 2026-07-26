import type { ZodType } from "zod";

export type AegisActorType = "anonymous" | "user" | "staff" | "system" | "worker";
export type AegisSourceType = "http" | "worker" | "cron" | "webhook" | "cli" | "internal";
export type AegisSensitivity = "public" | "internal" | "sensitive" | "critical";

export type AegisIdempotencyDeclaration = {
  mode: "none" | "optional" | "required" | "resource_state";
  keySource: string;
  durableStore?: string;
  replay: "return_prior_result" | "return_current_state" | "reject_conflict" | "not_applicable";
};

export type AegisContract<TInput, TOutput> = {
  name: string;
  version: number;
  kind: "command" | "query";
  domain: string;
  input: ZodType<TInput>;
  output: ZodType<TOutput>;
  allowedActors: readonly AegisActorType[];
  authorizationPolicy: string;
  entitlementPolicy: string | null;
  idempotency: AegisIdempotencyDeclaration;
  sideEffects: readonly string[];
  emittedEvents: readonly string[];
  expectedErrors: readonly string[];
  sensitivity: AegisSensitivity;
  audit: "none" | "telemetry" | "best_effort_durable" | "durable";
};

export function defineAegisContract<TInput, TOutput>(
  contract: AegisContract<TInput, TOutput>,
): AegisContract<TInput, TOutput> {
  return Object.freeze(contract);
}
