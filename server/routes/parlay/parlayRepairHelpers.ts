import { AppError } from "../../errors/AppError";
import { structuredLog } from "../../lib/structuredLog";
import { getSupabaseAdmin } from "../../middleware/auth";
import {
  planLegacyLegIdentityRepair,
  singleCanonicalGameId,
  type IdentityRepairReason,
} from "../../services/parlays/legacyParlayIdentityRepairService";

async function syncParentEventFromCanonicalLegs(supabaseAdmin: any, pickId: string): Promise<boolean> {
  const { data: legs, error } = await supabaseAdmin
    .from("pick_legs")
    .select("game_id")
    .eq("pick_id", pickId);
  if (error) return false;

  const gameId = singleCanonicalGameId(legs ?? []);
  if (!gameId) return false;

  const { error: updateError } = await supabaseAdmin
    .from("picks")
    .update({ event_id: gameId })
    .eq("id", pickId)
    .eq("status", "pending")
    .eq("leg_type", "parlay");
  return !updateError;
}

export async function repairLegacyParlayIdentityForSync(options: {
  dryRun?: boolean;
  limit?: number;
  externalProvider?: string;
  requestId?: string;
} = {}) {
  const dryRun = options.dryRun ?? true;
  const limit = Math.min(Math.max(Number(options.limit ?? 50), 1), 250);
  const supabaseAdmin = await getSupabaseAdmin();

  const { data: rows, error } = await supabaseAdmin
    .from("pick_legs")
    .select("id,pick_id,leg_index,sport,game_id,event_id,team_id,player_id,market,selection,market_code,stat_target,comparator,event_key,popularity_key,external_provider,status,picks(event_id)")
    .or("event_key.is.null,market_code.is.null,player_id.is.null,stat_target.is.null,comparator.is.null")
    .limit(limit);

  if (error) {
    throw error;
  }

  let repairedCount = 0;
  let skippedCount = 0;
  let parentSyncedCount = 0;
  const reasonCounts: Partial<Record<IdentityRepairReason, number>> = {};
  const repairedPickIds = new Set<string>();

  for (const row of rows ?? []) {
    const plan = planLegacyLegIdentityRepair(row, options.externalProvider || "repair_identity");
    if ("reasons" in plan) {
      skippedCount += 1;
      for (const reason of plan.reasons) reasonCounts[reason] = (reasonCounts[reason] ?? 0) + 1;
      continue;
    }

    if (!dryRun) {
      const { error: updateError } = await supabaseAdmin
        .from("pick_legs")
        .update(plan.patch)
        .eq("id", row.id);

      if (updateError) {
        skippedCount += 1;
        continue;
      }
    }

    repairedCount += 1;
    if (!dryRun) repairedPickIds.add(String(row.pick_id));
  }

  for (const pickId of repairedPickIds) {
    if (await syncParentEventFromCanonicalLegs(supabaseAdmin, pickId)) parentSyncedCount += 1;
  }

  structuredLog({
    level: skippedCount > 0 ? "warn" : "info",
    event: "parlay.identity_repair.completed",
    requestId: options.requestId,
    mode: dryRun ? "dry_run" : "apply",
    scanned: rows?.length ?? 0,
    repairedCount,
    skippedCount,
    parentSyncedCount,
    reasonCounts,
  });

  return {
    dryRun,
    scanned: rows?.length ?? 0,
    repairedCount,
    skippedCount,
  };
}

export async function repairParlayIdentityForPick(input: {
  pickId: string;
  userId: string;
  externalProvider?: string;
}) {
  const supabaseAdmin = await getSupabaseAdmin();

  const { data: pick, error: pickError } = await supabaseAdmin
    .from("picks")
    .select("id, user_id, locked_at, leg_type")
    .eq("id", input.pickId)
    .eq("user_id", input.userId)
    .eq("leg_type", "parlay")
    .maybeSingle();

  if (pickError) throw pickError;
  if (!pick) {
    throw new AppError({ status: 404, code: "not_found", message: "Parlay not found." });
  }
  if (pick.locked_at) {
    throw new AppError({
      status: 403,
      code: "parlay_locked",
      message: "Locked parlays cannot be repaired.",
      details: { error: "parlay_locked", locked_at: pick.locked_at },
    });
  }

  const { data: rows, error } = await supabaseAdmin
    .from("pick_legs")
    .select("id,pick_id,leg_index,sport,game_id,event_id,team_id,player_id,market,selection,market_code,stat_target,comparator,event_key,popularity_key,external_provider,status,picks(event_id)")
    .eq("pick_id", input.pickId)
    .or("event_key.is.null,market_code.is.null,player_id.is.null,stat_target.is.null,comparator.is.null");

  if (error) throw error;

  let repairedCount = 0;
  let skippedCount = 0;

  for (const row of rows ?? []) {
    const plan = planLegacyLegIdentityRepair(
      row,
      input.externalProvider || "user_repair_identity",
    );
    if (!plan.repairable) {
      skippedCount += 1;
      continue;
    }

    const { error: updateError } = await supabaseAdmin
      .from("pick_legs")
      .update(plan.patch)
      .eq("id", row.id);

    if (updateError) {
      skippedCount += 1;
      continue;
    }

    repairedCount += 1;
  }

  await syncParentEventFromCanonicalLegs(supabaseAdmin, input.pickId);

  return {
    pickId: input.pickId,
    scanned: rows?.length ?? 0,
    repairedCount,
    skippedCount,
  };
}

export function isLegacyManualEventId(value: unknown): boolean {
  const raw = String(value ?? "").trim();
  return raw.startsWith("leg-") || raw.startsWith("ai-leg-") || raw.startsWith("manual-");
}

export async function countParlayIntegrityRows(query: any): Promise<number> {
  const { count, error } = await query;
  if (error) {
    console.warn("[parlays/integrity] count failed", error.code, error.message);
    return -1;
  }
  return typeof count === "number" ? count : 0;
}
