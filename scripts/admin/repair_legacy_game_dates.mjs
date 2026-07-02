import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const shouldExecute = process.argv.includes("--execute");
const supabase = createClient(url, key);

const toDateOnly = (value) => {
  if (!value) return null;
  return new Date(value).toISOString().slice(0, 10);
};

const { data: picks, error: pickError } = await supabase
  .from("picks")
  .select("id,status,event_id,market,selection,game_date,created_at,updated_at")
  .eq("status", "pending")
  .is("game_date", null)
  .limit(100);

if (pickError) throw pickError;

const pickIds = [...new Set((picks ?? []).map((p) => p.id).filter(Boolean))];

let legs = [];
if (pickIds.length) {
  const { data, error } = await supabase
    .from("pick_legs")
    .select("id,pick_id,leg_index,status,event_id,game_id,player_id,market_code,event_key,game_date,graded_at")
    .in("pick_id", pickIds)
    .eq("status", "pending");

  if (error) throw error;
  legs = data ?? [];
}

const legsByPick = new Map();
for (const leg of legs) {
  const list = legsByPick.get(leg.pick_id) ?? [];
  list.push(leg);
  legsByPick.set(leg.pick_id, list);
}

const repairable = (picks ?? [])
  .map((pick) => {
    const pickLegs = legsByPick.get(pick.id) ?? [];
    const date = toDateOnly(pick.created_at);

    const hasCanonicalLegs = pickLegs.length > 0 && pickLegs.every((leg) =>
      leg.game_id &&
      leg.player_id &&
      leg.market_code &&
      leg.event_key
    );

    return {
      pick,
      legs: pickLegs,
      repairable: Boolean(date && hasCanonicalLegs),
      patch: {
        game_date: date,
      },
      reason: !date
        ? "missing_created_at"
        : !hasCanonicalLegs
          ? "missing_canonical_leg_identity"
          : "repairable",
    };
  });

const targets = repairable.filter((row) => row.repairable);
const skipped = repairable.filter((row) => !row.repairable);

console.log(JSON.stringify({
  mode: shouldExecute ? "execute" : "dry_run",
  scannedPendingNullGameDatePicks: picks?.length ?? 0,
  repairableCount: targets.length,
  skippedCount: skipped.length,
  targets: targets.map(({ pick, legs, patch }) => ({
    pick_id: pick.id,
    event_id: pick.event_id,
    market: pick.market,
    selection: pick.selection,
    created_at: pick.created_at,
    patch,
    legIds: legs.map((leg) => leg.id),
  })),
  skipped: skipped.map(({ pick, reason }) => ({
    pick_id: pick.id,
    event_id: pick.event_id,
    reason,
  })),
}, null, 2));

if (!shouldExecute || targets.length === 0) {
  if (!shouldExecute) {
    console.log("Dry run only. Re-run with --execute to repair game_date on legacy parlays.");
  }
  process.exit(0);
}

const updatedPicks = [];
const updatedLegs = [];

for (const { pick, legs, patch } of targets) {
  const { data: updatedPick, error: updatePickError } = await supabase
    .from("picks")
    .update(patch)
    .eq("id", pick.id)
    .eq("status", "pending")
    .is("game_date", null)
    .select("id,status,event_id,game_date,created_at,updated_at")
    .maybeSingle();

  if (updatePickError) throw updatePickError;
  updatedPicks.push(updatedPick);

  const legIds = legs.map((leg) => leg.id);
  if (legIds.length) {
    const { data: updatedLegRows, error: updateLegError } = await supabase
      .from("pick_legs")
      .update(patch)
      .in("id", legIds)
      .eq("status", "pending")
      .is("game_date", null)
      .select("id,pick_id,leg_index,status,event_id,game_id,player_id,market_code,event_key,game_date");

    if (updateLegError) throw updateLegError;
    updatedLegs.push(...(updatedLegRows ?? []));
  }
}

console.log(JSON.stringify({
  mode: "updated",
  updatedPickCount: updatedPicks.filter(Boolean).length,
  updatedLegCount: updatedLegs.length,
  updatedPicks,
  updatedLegs,
}, null, 2));
