import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in this terminal.");
  process.exit(1);
}

const supabase = createClient(url, key);

async function countByStatus(table) {
  const { data, error } = await supabase.from(table).select("status");
  if (error) throw error;

  return (data ?? []).reduce((acc, row) => {
    const status = String(row.status ?? "NULL");
    acc[status] = (acc[status] ?? 0) + 1;
    return acc;
  }, {});
}

async function recentPicks() {
  const { data, error } = await supabase
    .from("picks")
    .select("id,event_id,market,selection,status,graded_at,created_at,updated_at,explanation")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) throw error;
  return data;
}

async function recentPickLegs() {
  const { data, error } = await supabase
    .from("pick_legs")
    .select("id,pick_id,leg_index,sport,game_id,event_id,team_id,player_id,market,selection,market_code,stat_target,comparator,event_key,popularity_key,status,graded_at")
    .order("leg_index", { ascending: true })
    .limit(30);

  if (error) throw error;
  return data;
}

console.log("picks status counts:", await countByStatus("picks"));
console.log("pick_legs status counts:", await countByStatus("pick_legs"));
console.log("recent picks:", JSON.stringify(await recentPicks(), null, 2));
console.log("sample pick_legs:", JSON.stringify(await recentPickLegs(), null, 2));
