import { createClient } from "@supabase/supabase-js";

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
    headers: { "User-Agent": "VouchEdge/1.0 legacy repair probe" },
  });

  if (!res.ok) throw new Error(`boxscore fetch ${gamePk} ${res.status}`);

  const boxscore = await res.json();
  const teams = [boxscore?.teams?.home, boxscore?.teams?.away].filter(Boolean);
  const players = [];

  for (const team of teams) {
    for (const player of Object.values(team?.players ?? {})) {
      const person = player?.person ?? {};
      if (!person?.id || !person?.fullName) continue;
      players.push({
        player_id: Number(person.id),
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
      id,pick_id,leg_index,status,event_id,selection,market,game_id,player_id,
      market_code,stat_target,comparator,event_key,game_date
    )
  `)
  .in("status", ["push"])
  .not("game_date", "is", null)
  .limit(100);

if (error) throw error;

const boxscoreCache = new Map();
const results = [];

for (const pick of picks ?? []) {
  const legs = pick.pick_legs ?? [];
  const legResults = [];

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
      candidates = players
        .filter((p) => wantedName && (wantedName.includes(p.clean) || p.clean.includes(wantedName)))
        .slice(0, 5);

      if (candidates.length === 1) {
        matched = candidates[0];
      }
    }

    const repairable =
      Boolean(gamePk && /^\d+$/.test(gamePk)) &&
      Boolean(market) &&
      Boolean(matched?.player_id);

    legResults.push({
      leg_id: leg.id,
      leg_index: leg.leg_index,
      selection: leg.selection,
      existing: {
        game_id: leg.game_id,
        player_id: leg.player_id,
        market_code: leg.market_code,
        stat_target: leg.stat_target,
        comparator: leg.comparator,
        event_key: leg.event_key,
      },
      inferred: {
        game_id: gamePk,
        player_id: matched?.player_id ?? null,
        player_name: matched?.fullName ?? null,
        market,
        event_key: repairable
          ? `MLB_${gamePk}_${matched.player_id}_${market.market_code}_${market.stat_target}_${market.comparator === ">=" ? "GTE" : "LTE"}`
          : null,
      },
      repairable,
      candidates,
    });
  }

  results.push({
    pick_id: pick.id,
    status: pick.status,
    event_id: pick.event_id,
    game_date: pick.game_date,
    selection: pick.selection,
    all_legs_repairable: legResults.length > 0 && legResults.every((leg) => leg.repairable || leg.existing.player_id),
    legs: legResults,
  });
}

console.log(JSON.stringify({
  scannedPushedPicks: results.length,
  fullyRepairablePicks: results.filter((r) => r.all_legs_repairable).length,
  partiallyRepairablePicks: results.filter((r) => !r.all_legs_repairable && r.legs.some((l) => l.repairable)).length,
  results,
}, null, 2));
