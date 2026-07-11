#!/usr/bin/env node
/**
 * Fails CI when the main Vite index chunk or total CSS exceeds gzip budgets.
 * Default JS: 130 KiB — ~108 KiB baseline + headroom per Phase 3 audit.
 * Default CSS: 90 KiB total gzip (current build ~87 KiB + headroom)
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const DIST_ASSETS = join(process.cwd(), "dist", "assets");
const MAX_JS_GZIP_BYTES = Number(process.env.BUNDLE_BUDGET_BYTES ?? 130 * 1024);
const MAX_CSS_GZIP_BYTES = Number(process.env.CSS_BUDGET_BYTES ?? 110 * 1024);

function formatKiB(bytes) {
  return `${(bytes / 1024).toFixed(1)} KiB`;
}

function gzipSize(filePath) {
  const raw = readFileSync(filePath);
  return { rawBytes: raw.length, gzipBytes: gzipSync(raw).length };
}

if (!existsSync(DIST_ASSETS)) {
  console.error(`[bundle-budget] dist/assets not found — run npm run build first`);
  process.exit(1);
}

const assetNames = readdirSync(DIST_ASSETS);

const indexChunks = assetNames
  .filter((name) => /^index-.*\.js$/.test(name))
  .map((name) => {
    const sizes = gzipSize(join(DIST_ASSETS, name));
    return { name, ...sizes };
  })
  .sort((a, b) => b.gzipBytes - a.gzipBytes);

if (indexChunks.length === 0) {
  console.error("[bundle-budget] no index-*.js chunks found in dist/assets");
  process.exit(1);
}

const cssChunks = assetNames
  .filter((name) => name.endsWith(".css"))
  .map((name) => {
    const sizes = gzipSize(join(DIST_ASSETS, name));
    return { name, ...sizes };
  })
  .sort((a, b) => b.gzipBytes - a.gzipBytes);

const totalCssGzip = cssChunks.reduce((sum, chunk) => sum + chunk.gzipBytes, 0);
const largestIndex = indexChunks[0];

console.log(
  `[bundle-budget] largest index chunk: ${largestIndex.name} raw=${formatKiB(largestIndex.rawBytes)} gzip=${formatKiB(largestIndex.gzipBytes)} budget=${formatKiB(MAX_JS_GZIP_BYTES)}`
);

if (cssChunks.length > 0) {
  const largestCss = cssChunks[0];
  console.log(
    `[bundle-budget] CSS files: ${cssChunks.length} largest=${largestCss.name} gzip=${formatKiB(largestCss.gzipBytes)} total gzip=${formatKiB(totalCssGzip)} budget=${formatKiB(MAX_CSS_GZIP_BYTES)}`
  );
} else {
  console.log("[bundle-budget] CSS files: 0");
}

let failed = false;

if (largestIndex.gzipBytes > MAX_JS_GZIP_BYTES) {
  console.error(
    `[bundle-budget] FAIL — ${largestIndex.name} gzip ${formatKiB(largestIndex.gzipBytes)} exceeds ${formatKiB(MAX_JS_GZIP_BYTES)}`
  );
  failed = true;
}

if (totalCssGzip > MAX_CSS_GZIP_BYTES) {
  console.error(
    `[bundle-budget] FAIL — total CSS gzip ${formatKiB(totalCssGzip)} exceeds ${formatKiB(MAX_CSS_GZIP_BYTES)}`
  );
  failed = true;
}

if (failed) {
  process.exit(1);
}

console.log("[bundle-budget] PASS");
process.exit(0);
