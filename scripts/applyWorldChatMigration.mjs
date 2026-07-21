#!/usr/bin/env node
/**
 * Apply World Chat migrations via direct Postgres connection.
 *
 *   node --env-file=.env.local scripts/applyWorldChatMigration.mjs
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const supabaseMigrationsDir = join(__dirname, "..", "supabase", "migrations");
const durableSqlPath = join(supabaseMigrationsDir, "20260720013000_world_chat_durable.sql");
const realtimeSqlPath = join(supabaseMigrationsDir, "20260720052420_world_chat_realtime_live.sql");

const dbUrl =
  process.env.DATABASE_URL
  ?? process.env.SUPABASE_DB_URL
  ?? process.env.POSTGRES_URL;

if (!dbUrl) {
  console.error("[migrate:worldchat] Missing DATABASE_URL (direct Postgres URI).");
  console.error("Add to .env.local:");
  console.error('  DATABASE_URL="postgresql://postgres.[ref]:[password]@...supabase.com:6543/postgres"');
  process.exit(1);
}

let postgres;
try {
  postgres = (await import("postgres")).default;
} catch {
  console.error("[migrate:worldchat] Install postgres client: npm install --save-dev postgres");
  process.exit(1);
}

const durableSql = readFileSync(durableSqlPath, "utf8");
const realtimeSql = readFileSync(realtimeSqlPath, "utf8");

const sqlClient = postgres(dbUrl, { max: 1, ssl: "require" });

try {
  console.log("[migrate:worldchat] applying world_chat_durable.sql …");
  await sqlClient.unsafe(durableSql);
  
  console.log("[migrate:worldchat] applying world_chat_realtime_live.sql …");
  await sqlClient.unsafe(realtimeSql);

  console.log("[migrate:worldchat] done");
} catch (error) {
  console.error("[migrate:worldchat] failed:", error instanceof Error ? error.message : error);
  process.exit(1);
} finally {
  await sqlClient.end({ timeout: 5 });
}
