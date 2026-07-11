#!/usr/bin/env node
/**
 * Apply TrustOS migrations (0017–0020) via direct Postgres connection.
 *
 * Service role key alone cannot run DDL — you need the database connection URI:
 * Supabase → Project Settings → Database → Connection string → URI
 * Add to .env.local as DATABASE_URL (or SUPABASE_DB_URL).
 *
 *   node --env-file=.env.local scripts/applyTrustOsMigration.mjs
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sqlPath = join(__dirname, "trustos-production.sql");

const dbUrl =
  process.env.DATABASE_URL
  ?? process.env.SUPABASE_DB_URL
  ?? process.env.POSTGRES_URL;

if (!dbUrl) {
  console.error("[migrate:trustos] Missing DATABASE_URL (direct Postgres URI).");
  console.error("");
  console.error("Supabase → Project Settings → Database → Connection string → URI");
  console.error("Add to .env.local:");
  console.error('  DATABASE_URL="postgresql://postgres.[ref]:[password]@...supabase.com:6543/postgres"');
  console.error("");
  console.error("Or paste scripts/trustos-production.sql in SQL Editor:");
  console.error("  https://supabase.com/dashboard/project/vuphtbnclefwovfoqyth/sql/new");
  process.exit(1);
}

let postgres;
try {
  postgres = (await import("postgres")).default;
} catch {
  console.error("[migrate:trustos] Install postgres client: npm install --save-dev postgres");
  process.exit(1);
}

const sql = readFileSync(sqlPath, "utf8");
const sqlClient = postgres(dbUrl, { max: 1, ssl: "require" });

console.log("[migrate:trustos] applying scripts/trustos-production.sql …");

try {
  await sqlClient.unsafe(sql);
  console.log("[migrate:trustos] done");
} catch (error) {
  console.error("[migrate:trustos] failed:", error instanceof Error ? error.message : error);
  process.exit(1);
} finally {
  await sqlClient.end({ timeout: 5 });
}
