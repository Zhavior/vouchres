import { getSupabaseAdmin } from "../supabaseBackend";
import { getTodayHomeRuns, type HrEvent } from "../mlb/hrFeedService";

export interface LiveHrLegMatch {
  event: HrEvent;
  leg: {
    id?: string;
    pick_id: string;
    leg_index: number;
    event_id: string | number | null;
    player_id: string | number | null;
    market: string | null;
    selection: string | null;
    status: string | null;
  };
}

function isAnytimeHrMarket(market: string | null | undefined, selection: string | null | undefined): boolean {
  const haystack = `${market ?? ""} ${selection ?? ""}`.toLowerCase();
  return haystack.includes("hr") || haystack.includes("home run") || haystack.includes("homer");
}

export async function previewLiveHrParlayMatches(date?: string): Promise<LiveHrLegMatch[]> {
  const admin = await getSupabaseAdmin();
  const events = await getTodayHomeRuns(date);

  if (events.length === 0) {
    return [];
  }

  const gamePks = [...new Set(events.map((event) => String(event.gamePk)))];
  const playerIds = [...new Set(events.map((event) => String(event.playerId)).filter(Boolean))];

  if (gamePks.length === 0 || playerIds.length === 0) {
    return [];
  }

  const { data: legs, error } = await admin
    .from("pick_legs")
    .select("id,pick_id,leg_index,event_id,player_id,market,selection,status")
    .eq("status", "pending")
    .in("event_id", gamePks)
    .in("player_id", playerIds);

  if (error) {
    console.warn("[liveHrParlay] preview query failed", error.message);
    return [];
  }

  const matches: LiveHrLegMatch[] = [];

  for (const event of events) {
    for (const leg of legs ?? []) {
      const sameGame = String(leg.event_id ?? "") === String(event.gamePk);
      const samePlayer = String(leg.player_id ?? "") === String(event.playerId);
      if (!sameGame || !samePlayer) continue;
      if (!isAnytimeHrMarket(leg.market, leg.selection)) continue;

      matches.push({ event, leg });
    }
  }

  return matches;
}
