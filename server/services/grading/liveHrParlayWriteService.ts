import { getSupabaseAdmin } from "../../middleware/auth";
import { previewLiveHrParlayMatches } from "./liveHrParlayService";

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

    let q = admin
      .from("pick_legs")
      .update(update)
      .eq("pick_id", leg.pick_id)
      .eq("leg_index", leg.leg_index)
      .eq("status", "pending")
      .select("pick_id");

    const { data: updated, error: updateError } = await q;

    if (updateError) {
      console.error("[liveHrParlayWrite] leg update failed", updateError.message);
      result.skipped += 1;
      continue;
    }

    result.updatedLegs += updated?.length ?? 0;
  }

  return result;
}
