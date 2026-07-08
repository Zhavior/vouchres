import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(url, key);

const { data: picks, error: pickError } = await supabase
  .from("picks")
  .select("id,status,event_id,market,selection,game_date,created_at,updated_at,graded_at")
  .eq("status", "pending")
  .order("updated_at", { ascending: false })
  .limit(50);

if (pickError) throw pickError;

const pickIds = [...new Set((picks ?? []).map((p) => p.id).filter(Boolean))];

let legs = [];
if (pickIds.length) {
  const { data, error } = await supabase
    .from("pick_legs")
    .select("id,pick_id,leg_index,status,event_id,game_id,player_id,market_code,event_key,game_date,graded_at")
    .in("pick_id", pickIds)
    .order("leg_index", { ascending: true });

  if (error) throw error;
  legs = data ?? [];
}

const byPick = new Map();
for (const leg of legs) {
  const list = byPick.get(leg.pick_id) ?? [];
  list.push(leg);
  byPick.set(leg.pick_id, list);
}

console.log(JSON.stringify({
  checkedAt: new Date().toISOString(),
  pendingPickCount: picks?.length ?? 0,
  rows: (picks ?? []).map((pick) => ({
    pick,
    legs: byPick.get(pick.id) ?? [],
    gameDateRisk: !pick.game_date || (byPick.get(pick.id) ?? []).some((leg) => !leg.game_date),
  })),
}, null, 2));
