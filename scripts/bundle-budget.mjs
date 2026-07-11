#!/usr/bin/env node
/**
 * Fails CI when the main Vite index chunk or initial-route CSS exceeds gzip budgets.
 * Default JS: 130 KiB — ~108 KiB baseline + headroom per Phase 3 audit.
 * Default CSS: 90 KiB total gzip (current build ~87 KiB + headroom)
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const DIST_ASSETS = join(process.cwd(), "dist", "assets");
const VITE_MANIFEST = join(process.cwd(), "dist", "vite-manifest.json");
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

if (!existsSync(VITE_MANIFEST)) {
  console.error("[bundle-budget] dist/vite-manifest.json not found — run npm run build first");
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
const manifest = JSON.parse(readFileSync(VITE_MANIFEST, "utf8"));
const entry = Object.values(manifest).find((chunk) => chunk.isEntry && chunk.src === "index.html");

if (!entry) {
  console.error("[bundle-budget] index.html entry not found in Vite manifest");
  process.exit(1);
}

const BOOT_ENTRY_NAMES = [
  "AuthenticatedApp",
  "VouchEdgeTerminalPage",
];

function collectInitialCss(chunk, files, visitedChunks) {
  if (visitedChunks.has(chunk.file)) return;
  visitedChunks.add(chunk.file);
  for (const cssFile of chunk.css ?? []) files.add(cssFile);
  for (const importedFile of chunk.imports ?? []) {
    const importedChunk = manifest[importedFile];
    if (importedChunk) collectInitialCss(importedChunk, files, visitedChunks);
  }
}

const entryCssFiles = new Set();
collectInitialCss(entry, entryCssFiles, new Set());
const bootCssPaths = BOOT_ENTRY_NAMES.map((name) => {
  const chunk = Object.values(manifest).find((candidate) => candidate.name === name && candidate.isDynamicEntry);
  const files = new Set(entryCssFiles);
  if (!chunk) {
    // Not a dynamic entry: eagerly bundled into the index entry (e.g.
    // VouchEdgeTerminalPage after the no-lazy-landing rule), so its CSS is
    // already in entryCssFiles.
    return {
      name: `${name} (eager)`,
      gzipBytes: [...files].reduce(
        (sum, file) => sum + gzipSize(join(process.cwd(), "dist", file)).gzipBytes,
        0,
      ),
    };
  }
  collectInitialCss(chunk, files, new Set());
  const gzipBytes = [...files].reduce(
    (sum, file) => sum + gzipSize(join(process.cwd(), "dist", file)).gzipBytes,
    0,
  );
  return { name, gzipBytes };
});
const largestBootCss = bootCssPaths.sort((a, b) => b.gzipBytes - a.gzipBytes)[0];

console.log(
  `[bundle-budget] largest index chunk: ${largestIndex.name} raw=${formatKiB(largestIndex.rawBytes)} gzip=${formatKiB(largestIndex.gzipBytes)} budget=${formatKiB(MAX_JS_GZIP_BYTES)}`
);

if (cssChunks.length > 0) {
  const largestCss = cssChunks[0];
  console.log(
    `[bundle-budget] CSS files: ${cssChunks.length} largest=${largestCss.name} gzip=${formatKiB(largestCss.gzipBytes)} largest boot path=${largestBootCss.name} ${formatKiB(largestBootCss.gzipBytes)} budget=${formatKiB(MAX_CSS_GZIP_BYTES)} total route CSS=${formatKiB(totalCssGzip)}`
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

if (largestBootCss.gzipBytes > MAX_CSS_GZIP_BYTES) {
  console.error(
    `[bundle-budget] FAIL — ${largestBootCss.name} initial CSS ${formatKiB(largestBootCss.gzipBytes)} exceeds ${formatKiB(MAX_CSS_GZIP_BYTES)}`
  );
  failed = true;
}

if (failed) {
  process.exit(1);
}

console.log("[bundle-budget] PASS");
process.exit(0);
