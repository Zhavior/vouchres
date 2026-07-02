import { getSupabaseAdmin } from "../../middleware/auth";
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

function ymdFromValue(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (/^\\d{4}-\\d{2}-\\d{2}$/.test(raw)) return raw;

  const date = new Date(raw);
  if (!Number.isNaN(date.getTime())) {
    return date.toISOString().slice(0, 10);
  }

  return new Date().toISOString().slice(0, 10);
}

export async function previewLiveHrParlayMatches(date?: string): Promise<LiveHrLegMatch[]> {
  const admin = await getSupabaseAdmin();

  const { data: pendingLegs, error: legsError } = await admin
    .from("pick_legs")
    .select("id,pick_id,leg_index,event_id,player_id,market,selection,status,game_date,picks(game_date,created_at)")
    .eq("status", "pending");

  if (legsError) {
    console.warn("[liveHrParlay] pending legs query failed", legsError.message);
    return [];
  }

  const candidateLegs = (pendingLegs ?? []).filter((leg: any) =>
    leg?.event_id &&
    leg?.player_id &&
    isAnytimeHrMarket(leg.market, leg.selection)
  );

  if (candidateLegs.length === 0) {
    return [];
  }

  const dates = [
    ...new Set(
      candidateLegs.map((leg: any) =>
        date ||
        ymdFromValue(
          leg?.game_date ||
          leg?.picks?.game_date ||
          leg?.picks?.created_at
        )
      )
    ),
  ];

  const events: HrEvent[] = [];
  for (const scanDate of dates) {
    events.push(...await getTodayHomeRuns(scanDate));
  }

  if (events.length === 0) {
    return [];
  }

  const matches: LiveHrLegMatch[] = [];

  for (const event of events) {
    for (const leg of candidateLegs) {
      const sameGame = String(leg.event_id ?? "") === String(event.gamePk);
      const samePlayer = String(leg.player_id ?? "") === String(event.playerId);
      if (!sameGame || !samePlayer) continue;

      matches.push({ event, leg });
    }
  }

  return matches;
}
