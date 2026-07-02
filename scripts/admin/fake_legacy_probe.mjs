import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(url, key);

const fakePattern = (v) =>
  typeof v === "string" && (v.startsWith("leg-") || v.startsWith("ai-leg-"));

const { data: legs, error } = await supabase
  .from("pick_legs")
  .select("id,pick_id,leg_index,event_id,game_id,status,graded_at,selection,market")
  .eq("status", "pending")
  .limit(1000);

if (error) throw error;

const fakePending = (legs ?? []).filter((leg) =>
  fakePattern(leg.event_id) || fakePattern(leg.game_id)
);

const pickIds = [...new Set(fakePending.map((leg) => leg.pick_id).filter(Boolean))];

let picks = [];
if (pickIds.length) {
  const pickRes = await supabase
    .from("picks")
    .select("id,event_id,status,market,selection,updated_at,explanation")
    .in("id", pickIds);

  if (pickRes.error) throw pickRes.error;
  picks = pickRes.data ?? [];
}

console.log(JSON.stringify({
  checkedAt: new Date().toISOString(),
  scannedPendingOrOpenLegs: legs?.length ?? 0,
  fakePendingCount: fakePending.length,
  fakePending,
  parentPicks: picks,
}, null, 2));
