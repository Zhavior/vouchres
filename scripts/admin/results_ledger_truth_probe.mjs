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
  .select("id,status,event_id,market,selection,settled_units,graded_at,learning_note,created_at,updated_at")
  .order("updated_at", { ascending: false })
  .limit(20);

if (pickError) throw pickError;

const pickIds = [...new Set((picks ?? []).map((p) => p.id).filter(Boolean))];

let legs = [];
if (pickIds.length) {
  const { data, error } = await supabase
    .from("pick_legs")
    .select("id,pick_id,leg_index,status,event_id,game_id,player_id,market,selection,market_code,stat_target,comparator,event_key,graded_at")
    .in("pick_id", pickIds)
    .order("leg_index", { ascending: true });

  if (error) throw error;
  legs = data ?? [];
}

const legsByPick = new Map();
for (const leg of legs) {
  const list = legsByPick.get(leg.pick_id) ?? [];
  list.push(leg);
  legsByPick.set(leg.pick_id, list);
}

const rows = (picks ?? []).map((pick) => ({
  pick: {
    id: pick.id,
    status: pick.status,
    event_id: pick.event_id,
    market: pick.market,
    selection: pick.selection,
    settled_units: pick.settled_units,
    graded_at: pick.graded_at,
    updated_at: pick.updated_at,
    learning_note: pick.learning_note,
  },
  legs: legsByPick.get(pick.id) ?? [],
}));

console.log(JSON.stringify({
  checkedAt: new Date().toISOString(),
  pickCount: rows.length,
  rows,
}, null, 2));
