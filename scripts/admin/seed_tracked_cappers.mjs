/**
 * Register the handles the Results desk grades.
 *
 * Usage:
 *   node scripts/admin/seed_tracked_cappers.mjs <handle>:<label> [<handle>:<label> ...]
 *
 * Example:
 *   node scripts/admin/seed_tracked_cappers.mjs someone:SOME another:OTHER
 *
 * Handles are supplied by the operator — this script never invents one. Running
 * it again with the same handle updates the label rather than adding a duplicate.
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Pass at least one <handle>:<label> pair.");
  process.exit(1);
}

const rows = args.map((arg, index) => {
  const [handle, label] = arg.split(":");
  if (!handle || !label) {
    console.error(`Malformed argument "${arg}" — expected <handle>:<label>.`);
    process.exit(1);
  }
  return {
    handle: handle.trim().toLowerCase().replace(/^@/, ""),
    display_name: label.trim().toUpperCase(),
    sort_order: index,
    active: true,
  };
});

const supabase = createClient(url, key);
const { data, error } = await supabase
  .from("tracked_cappers")
  .upsert(rows, { onConflict: "handle" })
  .select("id, handle, display_name, sort_order");

if (error) {
  console.error("Seed failed:", error.message);
  process.exit(1);
}

for (const row of data) {
  console.log(`${row.sort_order}  ${row.display_name.padEnd(8)} @${row.handle}  ${row.id}`);
}
