import { z } from "zod";
import type { HrBoardResponse } from "../types/hrBoard";
import { resolveMlbPersonId } from "../lib/mlbPersonId";

const UnknownRecordSchema = z.record(z.string(), z.unknown());
const RecordArraySchema = z.array(UnknownRecordSchema);

const HrBoardMetaSchema = z.object({
  requestId: z.string().optional(),
  timestamp: z.string().optional(),
  source: z.string().optional(),
  dataQuality: z.string().optional(),
  updatedAt: z.string().optional(),
  generatedAt: z.string().optional(),
  warnings: z.array(z.string()).optional(),
  cache: z.object({
    strategy: z.string().optional(),
    ttlMs: z.number().finite().nonnegative().optional(),
    asOf: z.string().optional(),
  }).passthrough().optional(),
}).passthrough();

const HrBoardWireSchema = z.object({
  contractVersion: z.string().optional(),
  transportMode: z.enum(["compact", "full"]).optional(),
  date: z.string().min(1),
  gameCount: z.number().finite().nonnegative(),
  generatedAt: z.string().min(1),
  dataQuality: z.string().min(1),
  disclaimer: z.string().default(""),
  rows: RecordArraySchema.optional(),
  candidates: RecordArraySchema.optional(),
  confirmedCandidates: RecordArraySchema.optional(),
  projectedCandidates: RecordArraySchema.optional(),
  allProjectedCandidates: RecordArraySchema.optional(),
  games: z.array(z.object({ rows: RecordArraySchema.optional() }).passthrough()).optional(),
  candidateBuckets: z.object({
    confirmed: RecordArraySchema.optional(),
    projected: RecordArraySchema.optional(),
    allProjected: RecordArraySchema.optional(),
    blocked: RecordArraySchema.optional(),
  }).passthrough().optional(),
  meta: HrBoardMetaSchema.optional(),
}).passthrough();

export class HrBoardContractError extends Error {
  readonly code = "hr_board_contract_invalid";
  readonly issues: string[];

  constructor(issues: string[]) {
    super("Home Run Intelligence received an incompatible API response.");
    this.name = "HrBoardContractError";
    this.issues = issues;
  }
}

function hasPlayerIdentity(row: Record<string, unknown>): boolean {
  const rawId = row.playerId ?? row.id ?? row.mlbId ?? row.personId;
  const headshot = typeof row.headshot === "string" ? row.headshot : null;
  const playerId = resolveMlbPersonId(rawId, headshot);
  const playerName = row.playerName ?? row.name ?? row.player;
  return playerId != null && typeof playerName === "string" && playerName.trim().length > 0;
}

function validRows(rows: Array<Record<string, unknown>> | undefined): Array<Record<string, unknown>> {
  return (rows ?? []).filter(hasPlayerIdentity);
}

/**
 * One runtime boundary for server, compact-wire, and explicitly allowed MLB
 * direct-fallback payloads. It rejects envelope drift and hydrates the aliases
 * used by older board consumers without duplicating those arrays on the wire.
 */
export function parseHrBoardApiResponse(input: unknown): HrBoardResponse {
  const parsed = HrBoardWireSchema.safeParse(input);
  if (!parsed.success) {
    throw new HrBoardContractError(
      parsed.error.issues.slice(0, 8).map((issue) => `${issue.path.join(".") || "response"}: ${issue.message}`),
    );
  }

  const wire = parsed.data;
  const directFallbackRows = validRows(wire.games?.flatMap((game) => game.rows ?? []));
  const confirmed = validRows(wire.confirmedCandidates ?? wire.candidates ?? wire.candidateBuckets?.confirmed);
  const projected = validRows(
    wire.projectedCandidates
      ?? wire.candidateBuckets?.projected
      ?? (directFallbackRows.length > 0 ? directFallbackRows : undefined),
  );
  const allProjected = validRows(
    wire.allProjectedCandidates
      ?? wire.candidateBuckets?.allProjected
      ?? (projected.length > 0 ? projected : undefined),
  );
  const rows = validRows(
    wire.rows
      ?? (confirmed.length > 0 ? confirmed : undefined)
      ?? (projected.length > 0 ? projected : undefined)
      ?? allProjected,
  );

  return {
    ...(wire as unknown as HrBoardResponse),
    candidates: confirmed,
    confirmedCandidates: confirmed,
    projectedCandidates: projected,
    allProjectedCandidates: allProjected,
    rows,
    candidateBuckets: {
      ...wire.candidateBuckets,
      confirmed,
      projected,
      allProjected,
    },
    meta: {
      ...wire.meta,
      warnings: wire.meta?.warnings ?? [],
    },
  };
}

