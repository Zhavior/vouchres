import { AppError } from "../../errors/AppError";
import { getSupabaseAdmin } from "../../middleware/auth";

function repairComparatorKey(comparator: string | null): "GTE" | "LTE" | "EQ" | null {
  if (comparator === ">=") return "GTE";
  if (comparator === "<=") return "LTE";
  if (comparator === "=" || comparator === "==") return "EQ";
  return null;
}

function repairCleanKey(value: unknown, fallback = ""): string {
  return String(value ?? fallback).trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
}

function repairPlayerIdFromSelection(selection: unknown): string {
  const text = String(selection ?? "");
  const metaMatch = text.match(/\|\|meta:\s*(\{.*\})\s*$/);
  if (!metaMatch) return "";

  try {
    const meta = JSON.parse(metaMatch[1]);
    return String(meta.p || meta.playerId || meta.player_id || "").trim();
  } catch {
    return "";
  }
}

function repairGameIdFromRow(row: any): string {
  const candidates = [
    row.game_id,
    row.event_id,
    row.picks?.event_id,
    row.picks?.metadata?.game_id,
    row.picks?.metadata?.gameId,
    row.picks?.metadata?.gamePk,
  ];

  for (const candidate of candidates) {
    const raw = String(candidate ?? "").trim();
    if (/^\d{5,}$/.test(raw)) return raw;
  }

  return "";
}

function repairMarketCode(row: any): string | null {
  const raw = String(row.market_code || row.market || row.selection || "").trim().toUpperCase();
  const compact = raw.replace(/[^A-Z0-9]/g, "");

  if (!raw) return null;

  if (
    raw.includes("HOME RUN") ||
    raw.includes("HOMER") ||
    raw.includes("ANYTIME HR") ||
    raw.includes("1+ HR") ||
    raw.includes("TO HIT 1+ HOME RUN") ||
    raw === "HR" ||
    compact.includes("ANYTIMEHR") ||
    compact.includes("HOME RUN".replace(/[^A-Z0-9]/g, "")) ||
    compact.includes("HOMERUN")
  ) {
    return "ANYTIME_HR";
  }

  return String(row.market_code || "").trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "") || null;
}

function repairStatTarget(row: any, marketCode: string | null): number | null {
  const raw = row.stat_target ?? row.threshold ?? row.target ?? row.line ?? null;
  const parsed = Number(raw);

  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  if (marketCode === "ANYTIME_HR") return 1;

  return null;
}

export async function repairLegacyParlayIdentityForSync(options: {
  dryRun?: boolean;
  limit?: number;
  externalProvider?: string;
} = {}) {
  const dryRun = options.dryRun ?? true;
  const limit = Math.min(Math.max(Number(options.limit ?? 50), 1), 250);
  const supabaseAdmin = await getSupabaseAdmin();

  const { data: rows, error } = await supabaseAdmin
    .from("pick_legs")
    .select("id,pick_id,leg_index,sport,game_id,event_id,team_id,player_id,market,selection,market_code,stat_target,comparator,event_key,popularity_key,external_provider,status,picks(event_id,metadata)")
    .or("event_key.is.null,market_code.is.null,stat_target.is.null,comparator.is.null")
    .limit(limit);

  if (error) {
    throw error;
  }

  let repairedCount = 0;
  let skippedCount = 0;

  for (const row of rows ?? []) {
    const sport = repairCleanKey(row.sport || "MLB", "MLB") || "MLB";
    const gameId = repairGameIdFromRow(row);
    const teamId = repairCleanKey(row.team_id || "TEAM", "TEAM") || "TEAM";
    const playerId = repairCleanKey(row.player_id || repairPlayerIdFromSelection(row.selection));
    const marketCode = repairMarketCode(row);
    const statTarget = repairStatTarget(row, marketCode);
    const comparator = String(row.comparator || (statTarget != null ? ">=" : "")).trim() || null;
    const comparatorKey = repairComparatorKey(comparator);

    if (!gameId || !playerId || !marketCode || statTarget == null || !comparatorKey) {
      skippedCount += 1;
      continue;
    }

    const eventKey = [sport, gameId, teamId, playerId, marketCode, statTarget, comparatorKey].join("_");
    const popularityKey = [sport, playerId, marketCode, statTarget, comparatorKey].join("_");

    const patch = {
      sport,
      game_id: gameId,
      team_id: teamId,
      player_id: playerId,
      market_code: marketCode,
      stat_target: statTarget,
      comparator,
      event_key: eventKey,
      popularity_key: popularityKey,
      external_provider: row.external_provider || options.externalProvider || "repair_identity",
    };

    if (!dryRun) {
      const { error: updateError } = await supabaseAdmin
        .from("pick_legs")
        .update(patch)
        .eq("id", row.id);

      if (updateError) {
        skippedCount += 1;
        continue;
      }
    }

    repairedCount += 1;
  }

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
    .select("id,pick_id,leg_index,sport,game_id,event_id,team_id,player_id,market,selection,market_code,stat_target,comparator,event_key,popularity_key,external_provider,status,picks(event_id,metadata)")
    .eq("pick_id", input.pickId)
    .or("event_key.is.null,market_code.is.null,stat_target.is.null,comparator.is.null");

  if (error) throw error;

  let repairedCount = 0;
  let skippedCount = 0;

  for (const row of rows ?? []) {
    const sport = repairCleanKey(row.sport || "MLB", "MLB") || "MLB";
    const gameId = repairGameIdFromRow(row);
    const teamId = repairCleanKey(row.team_id || "TEAM", "TEAM") || "TEAM";
    const playerId = repairCleanKey(row.player_id || repairPlayerIdFromSelection(row.selection));
    const marketCode = repairMarketCode(row);
    const statTarget = repairStatTarget(row, marketCode);
    const comparator = String(row.comparator || (statTarget != null ? ">=" : "")).trim() || null;
    const comparatorKey = repairComparatorKey(comparator);

    if (!gameId || !playerId || !marketCode || statTarget == null || !comparatorKey) {
      skippedCount += 1;
      continue;
    }

    const eventKey = [sport, gameId, teamId, playerId, marketCode, statTarget, comparatorKey].join("_");
    const popularityKey = [sport, playerId, marketCode, statTarget, comparatorKey].join("_");

    const patch = {
      sport,
      game_id: gameId,
      team_id: teamId,
      player_id: playerId,
      market_code: marketCode,
      stat_target: statTarget,
      comparator,
      event_key: eventKey,
      popularity_key: popularityKey,
      external_provider: row.external_provider || input.externalProvider || "user_repair_identity",
    };

    const { error: updateError } = await supabaseAdmin
      .from("pick_legs")
      .update(patch)
      .eq("id", row.id);

    if (updateError) {
      skippedCount += 1;
      continue;
    }

    repairedCount += 1;
  }

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
    console.error("[parlays/integrity] count failed", error.code, error.message);
    throw error;
  }
  return typeof count === "number" ? count : 0;
}
