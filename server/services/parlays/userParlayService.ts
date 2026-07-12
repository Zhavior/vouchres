import { AppError } from "../../errors/AppError";
import { isPickLocked, lockedParlayMessage } from "../../lib/parlayLockPolicy";
import { computeParlayProofHash } from "../../lib/parlayProofHash";
import {
  findLegsForPick,
  findLegsForPicks,
  findUserParlayById,
  hideUserParlay as hideUserParlayRow,
  listVisibleUserParlayRows,
  lockPickForFeedShare,
  commitPickTrustPending,
  lockPickForTrustLedger,
  listDueTrustLockPicks,
  updatePickProofHash,
  updateUserParlay,
  type ParlayLegRow,
  type ParlayRow,
  type TrustAudience,
} from "../../repositories/parlayRepository";
import { insertPickAuditLog, listPickAuditLogs, type PickAuditRow } from "../../repositories/pickAuditRepository";
import { assessParlayIdentity } from "./parlayIdentityService";

export interface ParlayWithLegs extends ParlayRow {
  legs: ParlayLegRow[];
  identity?: ReturnType<typeof assessParlayIdentity>;
}

export function enrichParlayForDisplay(row: ParlayRow, legs: ParlayLegRow[]): ParlayWithLegs {
  return {
    ...row,
    legs,
    title: row.title ?? String(row.explanation ?? row.market ?? "Saved Parlay").split("\n")[0],
    riskTier: row.risk_tier ?? "MEDIUM",
    source: isAiPickRow(row) ? "AI" : (row.source ?? "manual"),
    ai_generated: isAiPickRow(row),
    game_date: row.game_date ?? ymdFromValue(row.created_at),
    identity: assessParlayIdentity(legs as Record<string, unknown>[]),
  };
}

function ymdFromValue(value: unknown): string | null {
  if (typeof value !== "string" || !value) return null;
  const match = value.match(/\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : null;
}

function isAiPickRow(row: ParlayRow): boolean {
  return row?.source === "ai_pick" || /source=AI|aiGenerated=true|aiSignature=/i.test(String(row?.explanation ?? ""));
}

export async function getUserParlay(input: {
  userId: string;
  parlayId: string;
}): Promise<ParlayWithLegs> {
  const parlay = await findUserParlayById(input.userId, input.parlayId);
  if (!parlay) {
    throw new AppError({ status: 404, code: "not_found", message: "Parlay not found." });
  }

  const legs = await findLegsForPick(input.parlayId);
  return enrichParlayForDisplay(parlay, legs);
}

export async function listUserParlays(input: {
  userId: string;
  limit: number;
  offset: number;
}): Promise<{ parlays: ParlayWithLegs[]; total: number; limit: number; offset: number }> {
  const { rows, total } = await listVisibleUserParlayRows(input);
  const legsByPickId = await findLegsForPicks(rows.map((row) => String(row.id)));
  return {
    parlays: rows.map((row) => enrichParlayForDisplay(row, legsByPickId[String(row.id)] ?? [])),
    total,
    limit: input.limit,
    offset: input.offset,
  };
}

export async function listUserParlayRows(input: {
  userId: string;
  limit: number;
  offset: number;
}): Promise<{ parlays: ParlayRow[]; total: number; limit: number; offset: number }> {
  const { rows, total } = await listVisibleUserParlayRows(input);
  return { parlays: rows, total, limit: input.limit, offset: input.offset };
}

function assertParlayEditable(existing: ParlayRow): void {
  if (isPickLocked(existing)) {
    throw new AppError({
      status: 403,
      code: "parlay_locked",
      message: lockedParlayMessage(existing as Record<string, unknown>),
      details: { error: "parlay_locked", locked_at: existing.locked_at ?? null, lock_reason: existing.lock_reason ?? null },
    });
  }
  if (existing.committed_at) {
    throw new AppError({
      status: 403,
      code: "parlay_locked",
      message: "This parlay is committed to your trust ledger window and cannot be edited.",
      details: { error: "parlay_committed", committed_at: existing.committed_at },
    });
  }
}

const TRUST_LOCK_WINDOW_MS = 5 * 60_000;
const TRUST_LOCK_WARN_MS = 4 * 60_000;

export function trustLockAtFromCommitted(committedAt: string): string {
  return new Date(new Date(committedAt).getTime() + TRUST_LOCK_WINDOW_MS).toISOString();
}

export function trustLockWarnAtFromCommitted(committedAt: string): string {
  return new Date(new Date(committedAt).getTime() + TRUST_LOCK_WARN_MS).toISOString();
}

function normalizeTrustAudience(value: unknown): TrustAudience {
  const raw = String(value ?? "private").toLowerCase();
  if (raw === "public" || raw === "subscriber") return raw;
  return "private";
}

async function applyTrustLockProof(input: {
  parlayId: string;
  userId: string;
  parlay: ParlayRow;
  lockedAt: string;
  auditAction: string;
  extraAudit?: Record<string, unknown>;
}): Promise<ParlayRow> {
  const legs = await findLegsForPick(input.parlayId);
  const effectiveLockedAt = String(input.parlay.locked_at ?? input.lockedAt);
  const proofHash = computeParlayProofHash({
    id: String(input.parlay.id),
    created_at: input.parlay.created_at,
    locked_at: effectiveLockedAt,
    odds_decimal: input.parlay.odds_decimal,
    stake_units: input.parlay.stake_units,
    legs,
  });
  await updatePickProofHash(input.parlayId, proofHash).catch((err) => {
    console.warn("[trustLock] proof hash failed", (err as Error)?.message);
  });
  input.parlay.proof_hash = proofHash;

  void import("../trust/pickProofAnchorService")
    .then(({ anchorParlayProofOpenTimestamp }) => anchorParlayProofOpenTimestamp({
      pickId: input.parlayId,
      proofHash,
    }))
    .catch((err) => {
      console.warn("[trustLock] OTS anchor failed", (err as Error)?.message);
    });

  await insertPickAuditLog({
    pickId: input.parlayId,
    userId: input.userId,
    action: input.auditAction,
    fieldChanges: {
      locked_at: { before: null, after: input.parlay.locked_at ?? input.lockedAt },
      ...(input.extraAudit ?? {}),
    },
  }).catch((err) => {
    console.warn("[trustLock] audit log failed", (err as Error)?.message);
  });

  return input.parlay;
}

export async function commitParlayTrustLedger(input: {
  userId: string;
  parlayId: string;
  audience?: TrustAudience;
}): Promise<ParlayRow> {
  const existing = await findUserParlayById(input.userId, input.parlayId);
  if (!existing) {
    throw new AppError({ status: 404, code: "not_found", message: "Parlay not found." });
  }
  assertParlayEditable(existing);

  const legs = await findLegsForPick(input.parlayId);
  const identity = assessParlayIdentity(legs as Record<string, unknown>[]);
  if (!identity.complete) {
    throw new AppError({
      status: 422,
      code: "validation_error",
      message: "Complete canonical leg identity before locking to the trust ledger.",
      details: { error: "identity_incomplete", missingLegIndexes: identity.missingLegIndexes },
    });
  }

  const audience = normalizeTrustAudience(input.audience ?? existing.visibility ?? "private");
  const committedAt = new Date().toISOString();
  const trustLockAt = trustLockAtFromCommitted(committedAt);

  const parlay = await commitPickTrustPending({
    pickId: input.parlayId,
    userId: input.userId,
    audience,
    committedAt,
    trustLockAt,
  });

  if (!parlay) {
    throw new AppError({
      status: 409,
      code: "conflict",
      message: "Parlay is already committed or locked.",
    });
  }

  await insertPickAuditLog({
    pickId: input.parlayId,
    userId: input.userId,
    action: "commit_trust_pending",
    fieldChanges: {
      committed_at: { before: null, after: committedAt },
      trust_lock_at: { before: null, after: trustLockAt },
      visibility: { before: existing.visibility ?? "private", after: audience },
    },
  }).catch((err) => {
    console.warn("[commitParlayTrustLedger] audit log failed", (err as Error)?.message);
  });

  return parlay;
}

export async function finalizeParlayTrustLock(input: {
  userId: string;
  parlayId: string;
}): Promise<ParlayRow | null> {
  const existing = await findUserParlayById(input.userId, input.parlayId);
  if (!existing) return null;
  if (isPickLocked(existing)) return existing;
  if (!existing.committed_at) return null;

  const trustLockAt = existing.trust_lock_at ? new Date(String(existing.trust_lock_at)).getTime() : 0;
  if (trustLockAt > Date.now()) return null;

  const audience = normalizeTrustAudience(existing.visibility ?? "private");
  const lockedAt = new Date().toISOString();
  const parlay = await lockPickForTrustLedger({
    pickId: input.parlayId,
    userId: input.userId,
    lockedAt,
    audience,
  });

  if (!parlay) return existing;

  return applyTrustLockProof({
    parlayId: input.parlayId,
    userId: input.userId,
    parlay,
    lockedAt,
    auditAction: "lock_trust_ledger",
  });
}

export async function finalizeDueTrustLocks(limit = 50): Promise<{ finalized: number; ids: string[] }> {
  const due = await listDueTrustLockPicks(limit);
  const ids: string[] = [];
  for (const row of due) {
    const result = await finalizeParlayTrustLock({
      userId: String(row.user_id),
      parlayId: String(row.id),
    }).catch((err) => {
      console.warn("[finalizeDueTrustLocks] failed", String(row.id), (err as Error)?.message);
      return null;
    });
    if (result?.locked_at) ids.push(String(result.id));
  }
  return { finalized: ids.length, ids };
}

export async function lockParlayOnFeedShare(input: {
  userId: string;
  parlayId: string;
  postId?: string;
  lockedAt?: string;
}): Promise<ParlayRow | null> {
  const lockedAt = input.lockedAt ?? new Date().toISOString();
  const parlay = await lockPickForFeedShare({
    pickId: input.parlayId,
    userId: input.userId,
    lockedAt,
  });

  if (!parlay) return null;

  const legs = await findLegsForPick(input.parlayId);
  const effectiveLockedAt = String(parlay.locked_at ?? lockedAt);
  const proofHash = computeParlayProofHash({
    id: String(parlay.id),
    created_at: parlay.created_at,
    locked_at: effectiveLockedAt,
    odds_decimal: parlay.odds_decimal,
    stake_units: parlay.stake_units,
    legs,
  });
  await updatePickProofHash(input.parlayId, proofHash).catch((err) => {
    console.warn("[lockParlayOnFeedShare] proof hash failed", (err as Error)?.message);
  });
  parlay.proof_hash = proofHash;

  void import("../trust/pickProofAnchorService")
    .then(({ anchorParlayProofOpenTimestamp }) => anchorParlayProofOpenTimestamp({
      pickId: input.parlayId,
      proofHash,
    }))
    .then((result) => {
      if (result.anchored) {
        parlay.ots_stamped_at = result.stampedAt ?? null;
      }
    })
    .catch((err) => {
      console.warn("[lockParlayOnFeedShare] OTS anchor failed", (err as Error)?.message);
    });

  await insertPickAuditLog({
    pickId: input.parlayId,
    userId: input.userId,
    action: "lock_feed_share",
    fieldChanges: {
      locked_at: { before: null, after: parlay.locked_at ?? lockedAt },
      ...(input.postId ? { post_id: input.postId } : {}),
    },
  }).catch((err) => {
    console.warn("[lockParlayOnFeedShare] audit log failed", (err as Error)?.message);
  });

  return parlay;
}

export async function updateParlaySummary(input: {
  userId: string;
  parlayId: string;
  title?: string;
  stakeUnits?: number;
}): Promise<ParlayRow> {
  const existing = await findUserParlayById(input.userId, input.parlayId);
  if (!existing) {
    throw new AppError({ status: 404, code: "not_found", message: "Parlay not found." });
  }
  assertParlayEditable(existing);

  const updates: Record<string, unknown> = {};
  const fieldChanges: Record<string, { before: unknown; after: unknown }> = {};

  if (input.title) {
    const nextTitle = input.title.slice(0, 200);
    updates.explanation = nextTitle;
    fieldChanges.explanation = { before: existing.explanation ?? null, after: nextTitle };
  }
  if (input.stakeUnits != null) {
    updates.stake_units = input.stakeUnits;
    fieldChanges.stake_units = { before: existing.stake_units ?? null, after: input.stakeUnits };
  }

  if (Object.keys(updates).length === 0) {
    throw new AppError({ status: 400, code: "validation_error", message: "No valid parlay fields were provided." });
  }

  updates.updated_at = new Date().toISOString();
  const parlay = await updateUserParlay({ userId: input.userId, parlayId: input.parlayId, updates });
  if (!parlay) {
    throw new AppError({ status: 404, code: "not_found", message: "Parlay not found." });
  }

  await insertPickAuditLog({
    pickId: input.parlayId,
    userId: input.userId,
    action: "update_summary",
    fieldChanges,
  }).catch((err) => {
    console.warn("[updateParlaySummary] audit log failed", (err as Error)?.message);
  });

  return parlay;
}

export async function getParlayAuditHistory(input: {
  userId: string;
  parlayId: string;
  limit?: number;
}): Promise<{ entries: PickAuditRow[]; created_at: string | null; updated_at: string | null; locked_at: string | null }> {
  const parlay = await findUserParlayById(input.userId, input.parlayId);
  if (!parlay) {
    throw new AppError({ status: 404, code: "not_found", message: "Parlay not found." });
  }

  const entries = await listPickAuditLogs({
    pickId: input.parlayId,
    userId: input.userId,
    limit: input.limit,
  });

  return {
    entries,
    created_at: parlay.created_at ?? null,
    updated_at: parlay.updated_at ?? null,
    locked_at: parlay.locked_at ?? null,
  };
}

export async function hideUserParlay(input: {
  userId: string;
  parlayId: string;
}) {
  const existing = await findUserParlayById(input.userId, input.parlayId);
  if (!existing) {
    throw new AppError({ status: 404, code: "not_found", message: "Parlay not found or already hidden." });
  }
  assertParlayEditable(existing);

  const hiddenAt = new Date().toISOString();
  const parlay = await hideUserParlayRow({ userId: input.userId, parlayId: input.parlayId, hiddenAt });
  if (!parlay) {
    throw new AppError({ status: 404, code: "not_found", message: "Parlay not found or already hidden." });
  }

  return {
    hidden: true,
    id: parlay.id,
    status: parlay.status,
    user_hidden_at: parlay.user_hidden_at,
    updated_at: parlay.updated_at,
    truth_rule: "status_preserved_void_reserved_for_sportsbook_no_action",
  };
}

export async function repairUserParlayIdentity(input: {
  userId: string;
  parlayId: string;
}) {
  const { repairParlayIdentityForPick } = await import("../../routes/parlay/parlayRepairHelpers");
  const result = await repairParlayIdentityForPick({
    pickId: input.parlayId,
    userId: input.userId,
    externalProvider: "user_repair_identity",
  });

  await insertPickAuditLog({
    pickId: input.parlayId,
    userId: input.userId,
    action: "repair_identity",
    fieldChanges: {
      repairedCount: result.repairedCount,
      skippedCount: result.skippedCount,
      scanned: result.scanned,
    },
  }).catch((err) => {
    console.warn("[repairUserParlayIdentity] audit log failed", (err as Error)?.message);
  });

  const parlay = await getUserParlay({ userId: input.userId, parlayId: input.parlayId });
  return { result, parlay };
}
