import { getSupabaseAdmin } from "../../middleware/auth";
import { previewLiveHrParlayMatches } from "./liveHrParlayService";
import { persistGradingRunLogs } from "./gradingLogService";

export interface LiveHrSyncResult {
  checked: number;
  insertedEvents: number;
  duplicateEvents: number;
  updatedLegs: number;
  skipped: number;
}

function buildEventKey(match: any): string {
  const event = match.event;
  const gamePk = String(event.gamePk ?? "");
  const playerId = String(event.playerId ?? "");
  const inning = String(event.inning ?? "");
  const timestamp = String(event.timestamp ?? event.description ?? "");
  return `mlb:${gamePk}:${playerId}:home_run:${inning}:${timestamp}`;
}

const TERMINAL_LEG_STATUSES = new Set(["won", "lost", "push", "void"]);

/**
 * Parent status only when every leg is a known terminal state.
 * Unknown/empty/open statuses must not allow a premature "won".
 */
export function deriveParentStatusFromLegs(
  legs: Array<{ status: string | null }>,
): "won" | "lost" | "push" | "void" | null {
  if (!legs.length) return null;

  const statuses = legs.map((leg) => String(leg.status ?? "").trim().toLowerCase());
  if (statuses.some((status) => !TERMINAL_LEG_STATUSES.has(status))) {
    return null;
  }

  if (statuses.some((status) => status === "lost")) return "lost";
  if (statuses.every((status) => status === "push")) return "push";
  if (statuses.every((status) => status === "void")) return "void";
  // Parlay win: at least one won, remainder won/push/void, none lost.
  if (
    statuses.some((status) => status === "won")
    && statuses.every((status) => status === "won" || status === "push" || status === "void")
  ) {
    return "won";
  }

  return null;
}

async function refreshParentPickStatusFromLegs(admin: any, pickId: string): Promise<boolean> {
  const { data: legs, error: legError } = await admin
    .from("pick_legs")
    .select("status")
    .eq("pick_id", pickId);

  if (legError) {
    console.error("[liveHrParlayWrite] parent refresh leg load failed", legError.message);
    return false;
  }

  const nextStatus = deriveParentStatusFromLegs(legs ?? []);
  if (!nextStatus) return false;

  const { error: pickError } = await admin
    .from("picks")
    .update({
      status: nextStatus,
      graded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", pickId)
    .in("status", ["pending", "grading", "live", "open", "active", "in_progress"]);

  if (pickError) {
    console.error("[liveHrParlayWrite] parent refresh failed", pickError.message);
    return false;
  }

  return true;
}


export async function applyLiveHrParlayMatches(date?: string): Promise<LiveHrSyncResult> {
  const admin = await getSupabaseAdmin();
  const matches = await previewLiveHrParlayMatches(date);

  const result: LiveHrSyncResult = {
    checked: matches.length,
    insertedEvents: 0,
    duplicateEvents: 0,
    updatedLegs: 0,
    skipped: 0,
  };

  for (const match of matches as any[]) {
    const event = match.event;
    const leg = match.leg;
    const eventKey = buildEventKey(match);

    const { error: eventError } = await admin
      .from("parlay_events")
      .upsert(
        {
          event_key: eventKey,
          sport: "mlb",
          game_pk: String(event.gamePk ?? leg.event_id ?? ""),
          player_id: event.playerId ? String(event.playerId) : leg.player_id ? String(leg.player_id) : null,
          player_name: event.playerName ?? null,
          event_type: "home_run",
          inning: typeof event.inning === "number" ? event.inning : null,
          description: event.description ?? null,
          occurred_at: event.timestamp ?? null,
          processed_at: new Date().toISOString(),
        },
        { onConflict: "event_key", ignoreDuplicates: true }
      );

    if (eventError) {
      console.error("[liveHrParlayWrite] event insert failed", eventError.message);
      result.skipped += 1;
      continue;
    }

    result.insertedEvents += 1;

    const update: Record<string, any> = {
      status: "won",
      actual: "HR detected live",
      note: `${event.playerName ?? "Player"} home run detected live.`,
      graded_at: new Date().toISOString(),
    };

    const baseUpdate = admin
      .from("pick_legs")
      .update(update)
      .eq("status", "pending")
      .select("pick_id");

    const q = leg.id
      ? baseUpdate.eq("id", leg.id)
      : baseUpdate.eq("pick_id", leg.pick_id).eq("leg_index", leg.leg_index);

    const { data: updated, error: updateError } = await q;

    if (updateError) {
      console.error("[liveHrParlayWrite] leg update failed", updateError.message);
      result.skipped += 1;
      continue;
    }

    const updatedCount = updated?.length ?? 0;
    result.updatedLegs += updatedCount;

    if (updatedCount > 0) {
      const parentRefreshed = await refreshParentPickStatusFromLegs(admin, String(leg.pick_id));
      await persistGradingRunLogs([{
        pick_id: String(leg.pick_id),
        status: "won",
        reason: "live_hr_detected",
        source: "live-hr-sync",
        previous_status: "pending",
        evidence: {
          leg_index: leg.leg_index,
          player_id: event.playerId ?? leg.player_id,
          event_key: eventKey,
          parent_refreshed: parentRefreshed,
        },
      }]).catch((err) => {
        console.warn("[liveHrParlayWrite] grading log failed", (err as Error)?.message);
      });
    }
  }

  return result;
}
