#!/usr/bin/env node
/**
 * Fails CI when the main Vite index chunk exceeds a gzip budget.
 * Default 130 KiB — ~108 KiB baseline + headroom per Phase 3 audit.
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const DIST_ASSETS = join(process.cwd(), "dist", "assets");
const MAX_GZIP_BYTES = Number(process.env.BUNDLE_BUDGET_BYTES ?? 130 * 1024);

function formatKiB(bytes) {
  return `${(bytes / 1024).toFixed(1)} KiB`;
}

if (!existsSync(DIST_ASSETS)) {
  console.error(`[bundle-budget] dist/assets not found — run npm run build first`);
  process.exit(1);
}

const indexChunks = readdirSync(DIST_ASSETS)
  .filter((name) => /^index-.*\.js$/.test(name))
  .map((name) => {
    const raw = readFileSync(join(DIST_ASSETS, name));
    const gzip = gzipSync(raw);
    return { name, rawBytes: raw.length, gzipBytes: gzip.length };
  })
  .sort((a, b) => b.gzipBytes - a.gzipBytes);

if (indexChunks.length === 0) {
  console.error("[bundle-budget] no index-*.js chunks found in dist/assets");
  process.exit(1);
}

const largest = indexChunks[0];
console.log(
  `[bundle-budget] largest index chunk: ${largest.name} raw=${formatKiB(largest.rawBytes)} gzip=${formatKiB(largest.gzipBytes)} budget=${formatKiB(MAX_GZIP_BYTES)}`
);

if (largest.gzipBytes > MAX_GZIP_BYTES) {
  console.error(
    `[bundle-budget] FAIL — ${largest.name} gzip ${formatKiB(largest.gzipBytes)} exceeds ${formatKiB(MAX_GZIP_BYTES)}`
  );
  process.exit(1);
}

console.log("[bundle-budget] PASS");
process.exit(0);
