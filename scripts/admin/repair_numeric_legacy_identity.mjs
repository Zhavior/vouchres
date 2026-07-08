import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const shouldExecute = process.argv.includes("--execute");
const supabase = createClient(url, key);

const isNumericMlbGameId = (value) =>
  typeof value === "string" && /^[0-9]{5,10}$/.test(value.trim());

const extractMetaPlayerId = (selection) => {
  if (typeof selection !== "string") return null;
  const match = selection.match(/\|\|meta:\s*\{\s*"p"\s*:\s*"(\d+)"\s*\}/);
  return match?.[1] ?? null;
};

const normalizeMarketCode = (market, selection) => {
  const text = `${market ?? ""} ${selection ?? ""}`.toLowerCase();
  if (text.includes("anytime hr") || text.includes("home run") || text.includes("homer")) {
    return "ANYTIME_HR";
  }
  return null;
};

const buildEventKey = ({ sport, gameId, playerId, marketCode, statTarget, comparator }) => {
  const comp = comparator === ">=" ? "GTE" : comparator === ">" ? "GT" : comparator === "=" ? "EQ" : "CMP";
  return `${sport}_${gameId}_TEAM_${playerId}_${marketCode}_${statTarget}_${comp}`;
};

const { data: legs, error } = await supabase
  .from("pick_legs")
  .select("id,pick_id,leg_index,status,event_id,game_id,player_id,market,selection,market_code,stat_target,comparator,event_key")
  .eq("status", "pending")
  .is("player_id", null)
  .limit(500);

if (error) throw error;

const candidates = (legs ?? [])
  .map((leg) => {
    const eventId = String(leg.event_id ?? "").trim();
    const playerId = extractMetaPlayerId(leg.selection);
    const marketCode = normalizeMarketCode(leg.market, leg.selection);

    if (!isNumericMlbGameId(eventId) || !playerId || !marketCode) {
      return {
        leg,
        repairable: false,
        reason: !isNumericMlbGameId(eventId)
          ? "event_id_not_numeric_mlb_game"
          : !playerId
            ? "missing_meta_player_id"
            : "unsupported_market",
      };
    }

    const statTarget = "1";
    const comparator = ">=";
    const gameId = eventId;
    const sport = "MLB";
    const eventKey = buildEventKey({
      sport,
      gameId,
      playerId,
      marketCode,
      statTarget,
      comparator,
    });

    return {
      leg,
      repairable: true,
      patch: {
        sport,
        game_id: gameId,
        player_id: Number(playerId),
        market_code: marketCode,
        stat_target: statTarget,
        comparator,
        event_key: eventKey,
        popularity_key: `${sport}_${playerId}_${marketCode}`,
        external_provider: "MLB_STATS_API",
      },
    };
  });

const repairable = candidates.filter((item) => item.repairable);
const skipped = candidates.filter((item) => !item.repairable);

console.log(JSON.stringify({
  mode: shouldExecute ? "execute" : "dry_run",
  scannedPendingMissingPlayerId: legs?.length ?? 0,
  repairableCount: repairable.length,
  skippedCount: skipped.length,
  repairable: repairable.map(({ leg, patch }) => ({
    id: leg.id,
    pick_id: leg.pick_id,
    leg_index: leg.leg_index,
    selection: leg.selection,
    event_id: leg.event_id,
    patch,
  })),
  skipped: skipped.map(({ leg, reason }) => ({
    id: leg.id,
    pick_id: leg.pick_id,
    leg_index: leg.leg_index,
    event_id: leg.event_id,
    selection: leg.selection,
    reason,
  })),
}, null, 2));

if (!shouldExecute || repairable.length === 0) {
  if (!shouldExecute) {
    console.log("Dry run only. Re-run with --execute to repair numeric legacy identity.");
  }
  process.exit(0);
}

const updated = [];
for (const { leg, patch } of repairable) {
  const { data, error: updateError } = await supabase
    .from("pick_legs")
    .update(patch)
    .eq("id", leg.id)
    .eq("status", "pending")
    .is("player_id", null)
    .select("id,pick_id,leg_index,status,event_id,game_id,player_id,market_code,stat_target,comparator,event_key,popularity_key,external_provider")
    .maybeSingle();

  if (updateError) {
    throw updateError;
  }

  updated.push(data);
}

console.log(JSON.stringify({
  mode: "updated",
  updatedCount: updated.filter(Boolean).length,
  updated,
}, null, 2));
