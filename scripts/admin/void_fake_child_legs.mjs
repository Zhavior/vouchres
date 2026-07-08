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

const { data: legs, error: legError } = await supabase
  .from("pick_legs")
  .select("id,pick_id,event_id,game_id,status,graded_at,selection,market")
  .eq("status", "pending")
  .limit(1000);

if (legError) throw legError;

const fakePendingLegs = (legs ?? []).filter((leg) =>
  fakePattern(leg.event_id) || fakePattern(leg.game_id)
);

const pickIds = [...new Set(fakePendingLegs.map((leg) => leg.pick_id).filter(Boolean))];

let parentPicks = [];
if (pickIds.length) {
  const { data, error } = await supabase
    .from("picks")
    .select("id,status,event_id,market,selection")
    .in("id", pickIds);

  if (error) throw error;
  parentPicks = data ?? [];
}

const voidParentIds = new Set(
  parentPicks.filter((pick) => pick.status === "void").map((pick) => pick.id)
);

const targetLegIds = fakePendingLegs
  .filter((leg) => voidParentIds.has(leg.pick_id))
  .map((leg) => leg.id);

const shouldExecute = process.argv.includes("--execute");

console.log(JSON.stringify({
  mode: shouldExecute ? "execute_summary_before_update" : "dry_run_summary",
  execute: shouldExecute,
  fakePendingLegs: fakePendingLegs.length,
  parentPicks: parentPicks.length,
  targetChildLegsToVoid: targetLegIds.length,
  targetLegIds,
}, null, 2));

if (!shouldExecute) {
  console.log("Dry run only. Re-run with --execute to update matching child legs.");
  process.exit(0);
}

if (targetLegIds.length === 0) {
  process.exit(0);
}

const { data: updatedLegs, error: updateError } = await supabase
  .from("pick_legs")
  .update({
    status: "void",
    graded_at: new Date().toISOString(),
  })
  .in("id", targetLegIds)
  .select("id,pick_id,event_id,game_id,status,graded_at");

if (updateError) throw updateError;

console.log(JSON.stringify({
  mode: "updated",
  updatedCount: updatedLegs?.length ?? 0,
  updatedLegs,
}, null, 2));
