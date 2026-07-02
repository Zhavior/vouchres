import { createClient } from "@supabase/supabase-js";

const shouldExecute = process.argv.includes("--execute");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const MLB_API = "https://statsapi.mlb.com/api";

const cleanName = (value = "") =>
  String(value)
    .replace(/\|\|meta:.*$/i, "")
    .replace(/\b(anytime|over|under|hrs?|hr|hits?|rbis?|runs?|strikeouts?|ks?)\b/gi, "")
    .replace(/\b\d+(\.\d+)?\b/g, "")
    .replace(/[+|]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const inferMarket = (selection = "") => {
  const s = String(selection).toLowerCase();

  if (/\bhr\b|\bhrs\b|home run|homer/.test(s)) {
    return { market_code: "ANYTIME_HR", stat_target: 1, comparator: ">=" };
  }

  if (/\bhits?\b/.test(s)) {
    const match = s.match(/over\s+(\d+(?:\.\d+)?)\s+hits?/i);
    const line = match ? Number(match[1]) : 0.5;
    return { market_code: "PLAYER_HITS", stat_target: Math.floor(line + 0.5), comparator: ">=" };
  }

  return null;
};

const fetchBoxscorePlayers = async (gamePk) => {
  const res = await fetch(`${MLB_API}/v1/game/${gamePk}/boxscore`, {
    headers: { "User-Agent": "VouchEdge/1.0 legacy repair execute" },
  });

  if (!res.ok) throw new Error(`boxscore fetch ${gamePk} ${res.status}`);

  const boxscore = await res.json();
  const teams = [boxscore?.teams?.home, boxscore?.teams?.away].filter(Boolean);
  const players = [];

  for (const team of teams) {
    const teamId = team?.team?.id ?? null;

    for (const player of Object.values(team?.players ?? {})) {
      const person = player?.person ?? {};
      if (!person?.id || !person?.fullName) continue;

      players.push({
        player_id: Number(person.id),
        team_id: teamId,
        fullName: person.fullName,
        clean: cleanName(person.fullName),
      });
    }
  }

  return players;
};

const { data: picks, error } = await supabase
  .from("picks")
  .select(`
    id,status,event_id,selection,market,game_date,created_at,learning_note,
    pick_legs(
      id,pick_id,leg_index,status,event_id,selection,market,game_id,player_id,team_id,
      market_code,stat_target,comparator,event_key,popularity_key,external_provider,game_date
    )
  `)
  .eq("status", "push")
  .not("game_date", "is", null)
  .limit(100);

if (error) throw error;

const boxscoreCache = new Map();
const repairPlans = [];
const skipped = [];

for (const pick of picks ?? []) {
  const legs = pick.pick_legs ?? [];
  const legPlans = [];

  for (const leg of legs) {
    const gamePk = String(leg.event_id || leg.game_id || pick.event_id || "");
    const market = inferMarket(leg.selection || leg.market || pick.market || pick.selection);
    const wantedName = cleanName(leg.selection || "");

    let matched = null;
    let candidates = [];

    if (/^\d+$/.test(gamePk)) {
      if (!boxscoreCache.has(gamePk)) {
        boxscoreCache.set(gamePk, await fetchBoxscorePlayers(gamePk));
      }

      const players = boxscoreCache.get(gamePk);
      candidates = players.filter((p) =>
        wantedName &&
        (wantedName.includes(p.clean) || p.clean.includes(wantedName))
      );

      if (candidates.length === 1) matched = candidates[0];
    }

    const existingComplete =
      leg.game_id &&
      leg.player_id &&
      leg.market_code &&
      leg.stat_target &&
      leg.comparator &&
      leg.event_key;

    const repairable =
      existingComplete ||
      (Boolean(gamePk && /^\d+$/.test(gamePk)) &&
        Boolean(market) &&
        Boolean(matched?.player_id));

    if (!repairable) {
      legPlans.push({
        leg_id: leg.id,
        repairable: false,
        reason: !market ? "market_not_inferred" : candidates.length > 1 ? "ambiguous_player_match" : "no_exact_player_match",
        selection: leg.selection,
        candidates,
      });
      continue;
    }

    const playerId = Number(leg.player_id || matched.player_id);
    const teamId = leg.team_id || matched?.team_id || null;
    const marketCode = leg.market_code || market.market_code;
    const statTarget = leg.stat_target || market.stat_target;
    const comparator = leg.comparator || market.comparator;
    const gameId = String(leg.game_id || gamePk);
    const comparatorKey = comparator === ">=" ? "GTE" : comparator === "<=" ? "LTE" : String(comparator).replace(/\W/g, "");

    legPlans.push({
      leg_id: leg.id,
      repairable: true,
      patch: {
        sport: "MLB",
        game_id: gameId,
        team_id: teamId,
        player_id: playerId,
        market_code: marketCode,
        stat_target: statTarget,
        comparator,
        event_key: leg.event_key || `MLB_${gameId}_${playerId}_${marketCode}_${statTarget}_${comparatorKey}`,
        popularity_key: leg.popularity_key || `MLB_${playerId}_${marketCode}_${statTarget}_${comparatorKey}`,
        external_provider: leg.external_provider || "MLB_STATS_API",
        game_date: leg.game_date || pick.game_date,
        status: "pending",
        graded_at: null,
      },
      selection: leg.selection,
      player_name: matched?.fullName ?? null,
    });
  }

  const allRepairable = legPlans.length > 0 && legPlans.every((plan) => plan.repairable);

  if (allRepairable) {
    repairPlans.push({
      pick_id: pick.id,
      pickPatch: {
        status: "pending",
        graded_at: null,
        learning_note: null,
        game_date: pick.game_date,
      },
      legs: legPlans,
    });
  } else {
    skipped.push({
      pick_id: pick.id,
      selection: pick.selection,
      reason: "not_all_legs_repairable",
      legs: legPlans,
    });
  }
}

console.log(JSON.stringify({
  mode: shouldExecute ? "execute" : "dry_run",
  repairablePickCount: repairPlans.length,
  skippedPickCount: skipped.length,
  repairPlans,
  skipped,
}, null, 2));

if (!shouldExecute) {
  console.log("Dry run only. Re-run with --execute to repair and reopen only fully repairable PUSH parlays.");
  process.exit(0);
}

const updatedPicks = [];
const updatedLegs = [];

for (const plan of repairPlans) {
  for (const legPlan of plan.legs) {
    const { data: updatedLeg, error: legError } = await supabase
      .from("pick_legs")
      .update(legPlan.patch)
      .eq("id", legPlan.leg_id)
      .eq("status", "push")
      .select("id,pick_id,status,game_id,player_id,market_code,stat_target,comparator,event_key,game_date")
      .maybeSingle();

    if (legError) throw legError;
    updatedLegs.push(updatedLeg);
  }

  const { data: updatedPick, error: pickError } = await supabase
    .from("picks")
    .update(plan.pickPatch)
    .eq("id", plan.pick_id)
    .eq("status", "push")
    .select("id,status,event_id,selection,game_date,graded_at,learning_note")
    .maybeSingle();

  if (pickError) throw pickError;
  updatedPicks.push(updatedPick);
}

console.log(JSON.stringify({
  mode: "updated",
  updatedPickCount: updatedPicks.filter(Boolean).length,
  updatedLegCount: updatedLegs.filter(Boolean).length,
  updatedPicks,
  updatedLegs,
}, null, 2));
