import { AppError } from "../../errors/AppError";
import { isPickLocked, PARLAY_LOCKED_MESSAGE } from "../../lib/parlayLockPolicy";
import {
  findLegsForPick,
  findLegsForPicks,
  findUserParlayById,
  hideUserParlay as hideUserParlayRow,
  listVisibleUserParlayRows,
  lockPickForFeedShare,
  updateUserParlay,
  type ParlayLegRow,
  type ParlayRow,
} from "../../repositories/parlayRepository";
import { insertPickAuditLog, listPickAuditLogs, type PickAuditRow } from "../../repositories/pickAuditRepository";

export interface ParlayWithLegs extends ParlayRow {
  legs: ParlayLegRow[];
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
      message: PARLAY_LOCKED_MESSAGE,
      details: { error: "parlay_locked", locked_at: existing.locked_at ?? null },
    });
  }
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
