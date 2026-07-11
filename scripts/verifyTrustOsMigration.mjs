#!/usr/bin/env node
/**
 * Verify TrustOS migrations (0017–0020) against Supabase using service role.
 * Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local
 *
 *   node --env-file=.env.local scripts/verifyTrustOsMigration.mjs
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("[verify:trustos-db] Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env.");
  console.error("Add them to .env.local, then run:");
  console.error("  node --env-file=.env.local scripts/verifyTrustOsMigration.mjs");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function tableOk(name) {
  const { error } = await supabase.from(name).select("*", { head: true, count: "exact" });
  if (!error) return { ok: true };
  if (error.code === "42P01" || error.code === "PGRST205") {
    return { ok: false, reason: "table missing" };
  }
  return { ok: false, reason: error.message };
}

async function pickColumnOk(column) {
  const { error } = await supabase.from("picks").select(column).limit(1);
  if (!error) return { ok: true };
  if (error.code === "42703" || error.message?.includes(column)) {
    return { ok: false, reason: "column missing" };
  }
  return { ok: false, reason: error.message };
}

const checks = [
  { id: "0017 pick_audit_log", run: () => tableOk("pick_audit_log") },
  { id: "0018 picks.locked_at", run: () => pickColumnOk("locked_at") },
  { id: "0019 picks.proof_hash", run: () => pickColumnOk("proof_hash") },
  { id: "0019 subscriber_channel_messages", run: () => tableOk("subscriber_channel_messages") },
  { id: "0020 picks.ots_proof", run: () => pickColumnOk("ots_proof") },
  { id: "0020 picks.ots_stamped_at", run: () => pickColumnOk("ots_stamped_at") },
  { id: "0025 picks.lock_reason", run: () => pickColumnOk("lock_reason") },
];

let failed = 0;

console.log(`[verify:trustos-db] target ${url}\n`);

for (const check of checks) {
  const result = await check.run();
  if (result.ok) {
    console.log(`PASS · ${check.id}`);
  } else {
    failed += 1;
    console.log(`FAIL · ${check.id} · ${result.reason}`);
  }
}

if (failed > 0) {
  console.error(`\n[verify:trustos-db] ${failed} check(s) failed — run: npm run migrate:trustos`);
  process.exit(1);
}

console.log("\n[verify:trustos-db] all TrustOS migrations present");
