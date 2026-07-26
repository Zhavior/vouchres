import { z } from "zod";
import { defineAegisContract } from "../../../aegis/contracts";
import { registerAegisContract } from "../../../aegis/registry";
import { SaveMeParlaySchema } from "../../../validators/parlaySchemas";

const parlayRowSchema = z.object({ id: z.union([z.string(), z.number()]) }).passthrough();

export const SaveParlayCommand = defineAegisContract({
  name: "SaveParlayCommand",
  version: 1,
  kind: "command",
  domain: "parlay",
  input: z.object({ body: SaveMeParlaySchema }),
  output: z.object({
    statusCode: z.union([z.literal(200), z.literal(201)]),
    body: parlayRowSchema,
  }),
  allowedActors: ["user"],
  authorizationPolicy: "authenticated user is canonical owner",
  entitlementPolicy: "legal confirmation required by entry point",
  idempotency: {
    mode: "optional",
    keySource: "body.clientRef or body.client_ref",
    durableStore: "public.picks(user_id, client_ref)",
    replay: "return_prior_result",
  },
  sideEffects: ["insert picks", "insert pick_legs"],
  emittedEvents: [],
  expectedErrors: ["validation_error", "forbidden", "conflict", "internal_server_error"],
  sensitivity: "sensitive",
  audit: "telemetry",
});

export const CommitParlayTrustCommand = defineAegisContract({
  name: "CommitParlayTrustCommand",
  version: 1,
  kind: "command",
  domain: "parlay",
  input: z.object({
    parlayId: z.string().uuid(),
    audience: z.enum(["private", "public", "subscriber"]).default("private"),
  }),
  output: parlayRowSchema,
  allowedActors: ["user"],
  authorizationPolicy: "authenticated user owns parlay",
  entitlementPolicy: null,
  idempotency: {
    mode: "resource_state",
    keySource: "actor.id + parlayId + target committed state",
    durableStore: "public.picks",
    replay: "reject_conflict",
  },
  sideEffects: ["commit trust window", "write pick audit", "record trust event"],
  emittedEvents: [],
  expectedErrors: ["not_found", "validation_error", "parlay_locked", "conflict"],
  sensitivity: "critical",
  audit: "best_effort_durable",
});

export const FinalizeParlayTrustLockCommand = defineAegisContract({
  name: "FinalizeParlayTrustLockCommand",
  version: 1,
  kind: "command",
  domain: "trust",
  input: z.object({ parlayId: z.string().uuid() }),
  output: parlayRowSchema,
  allowedActors: ["user", "worker", "system"],
  authorizationPolicy: "user owns parlay or trusted trust-lock runtime",
  entitlementPolicy: null,
  idempotency: {
    mode: "resource_state",
    keySource: "parlayId + locked_at",
    durableStore: "public.picks",
    replay: "return_current_state",
  },
  sideEffects: ["lock parlay", "calculate proof hash", "request OTS anchor", "write audit", "record trust event"],
  emittedEvents: [],
  expectedErrors: ["not_found", "domain_state_error", "internal_server_error"],
  sensitivity: "critical",
  audit: "best_effort_durable",
});

[SaveParlayCommand, CommitParlayTrustCommand, FinalizeParlayTrustLockCommand]
  .forEach(registerAegisContract);
