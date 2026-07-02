import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { data, error } = await supabase
  .from("pick_legs")
  .select("id,pick_id,leg_index,game_id,event_id,player_id,market,selection,market_code,stat_target,comparator,status")
  .or("event_key.is.null,market_code.is.null,stat_target.is.null,comparator.is.null")
  .limit(40);

if (error) {
  console.error(error);
  process.exit(1);
}

console.log(JSON.stringify(data, null, 2));
