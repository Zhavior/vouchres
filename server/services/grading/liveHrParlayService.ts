import { getSupabaseAdmin } from "../../middleware/auth";
import { getTodayHomeRuns, type HrEvent } from "../mlb/hrFeedService";

export interface LiveHrLegMatch {
  event: HrEvent;
  leg: {
    id?: string;
    pick_id: string;
    leg_index: number;
    game_id?: string | number | null;
    event_id: string | number | null;
    player_id: string | number | null;
    market_code?: string | null;
    market: string | null;
    selection: string | null;
    stat_target?: string | number | null;
    comparator?: string | null;
    event_key?: string | null;
    status: string | null;
  };
}

const CANONICAL_HR_MARKET_CODES = new Set([
  "HR",
  "HOME_RUN",
  "ANYTIME_HR",
  "BATTER_HR",
  "TO_HIT_A_HR",
  "PLAYER_HR",
]);

/** True only for anytime HR markets — rejects substring false positives like "threshold". */
export function isAnytimeHrMarket(
  market: string | null | undefined,
  selection: string | null | undefined,
  marketCode?: string | null | undefined
): boolean {
  const canonicalMarket = String(marketCode ?? "").trim().toUpperCase();
  if (canonicalMarket.length > 0) {
    return CANONICAL_HR_MARKET_CODES.has(canonicalMarket);
  }

  const haystack = `${market ?? ""} ${selection ?? ""}`.toLowerCase();
  if (/\bhome\s*runs?\b/.test(haystack) || /\bhomer(?:s|un)?\b/.test(haystack)) {
    return true;
  }
  // Word-boundary "hr" only — never bare includes("hr") (matches "threshold", "other", …).
  return /(^|[^a-z0-9])hr([^a-z0-9]|$)/.test(haystack);
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
    .select("id,pick_id,leg_index,game_id,event_id,player_id,market_code,market,selection,stat_target,comparator,event_key,status,game_date,picks(game_date,created_at)")
    .eq("status", "pending");

  if (legsError) {
    console.error("[liveHrParlay] pending legs query failed", legsError.message);
    throw legsError;
  }

  const candidateLegs = (pendingLegs ?? []).filter((leg: any) =>
    (leg?.game_id || leg?.event_id) &&
    leg?.player_id &&
    isAnytimeHrMarket(leg.market, leg.selection, leg.market_code)
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
    events.push(...(await getTodayHomeRuns(scanDate)).events);
  }

  if (events.length === 0) {
    return [];
  }

  const matches: LiveHrLegMatch[] = [];

  for (const event of events) {
    for (const leg of candidateLegs) {
      const sameGame = String(leg.game_id || leg.event_id || "") === String(event.gamePk);
      const samePlayer = String(leg.player_id ?? "") === String(event.playerId);
      if (!sameGame || !samePlayer) continue;

      matches.push({ event, leg });
    }
  }

  return matches;
}
