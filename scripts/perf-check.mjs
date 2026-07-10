#!/usr/bin/env node
/**
 * Lightweight perf gate — extends bundle-budget with route-aware CSS ceilings.
 * Public landing CSS gzip: 24 KiB. Authenticated app CSS gzip: 88 KiB.
 * Lazy auth modal CSS gzip: 12 KiB. Total emitted CSS gzip: 120 KiB.
 * Default JS index chunk: 130 KiB.
 *
 * Manual Lighthouse (optional):
 *   npm run build && npm run preview
 *   npm run lighthouse-ci   # prints manual steps
 *   npx lighthouse http://localhost:4173 --only-categories=performance --quiet
 */
import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const DIST_ASSETS = join(process.cwd(), "dist", "assets");
const MAX_JS_GZIP_BYTES = Number(process.env.BUNDLE_BUDGET_BYTES ?? 130 * 1024);
const MAX_PUBLIC_CSS_GZIP_BYTES = Number(process.env.PERF_PUBLIC_CSS_BUDGET_BYTES ?? 24 * 1024);
const MAX_AUTH_CSS_GZIP_BYTES = Number(process.env.PERF_AUTH_CSS_BUDGET_BYTES ?? 88 * 1024);
const MAX_MODAL_CSS_GZIP_BYTES = Number(process.env.PERF_MODAL_CSS_BUDGET_BYTES ?? 12 * 1024);
const MAX_TOTAL_CSS_GZIP_BYTES = Number(process.env.PERF_CSS_BUDGET_BYTES ?? 120 * 1024);

function formatKiB(bytes) {
  return `${(bytes / 1024).toFixed(1)} KiB`;
}

function gzipSize(filePath) {
  const raw = readFileSync(filePath);
  return { rawBytes: raw.length, gzipBytes: gzipSync(raw).length };
}

if (!existsSync(DIST_ASSETS)) {
  console.error("[perf-check] dist/assets not found — run npm run build first");
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

const cssChunks = assetNames
  .filter((name) => name.endsWith(".css"))
  .map((name) => {
    const sizes = gzipSize(join(DIST_ASSETS, name));
    return { name, ...sizes };
  })
  .sort((a, b) => b.gzipBytes - a.gzipBytes);

if (indexChunks.length === 0) {
  console.error("[perf-check] no index-*.js chunks found");
  process.exit(1);
}

const totalCssGzip = cssChunks.reduce((sum, chunk) => sum + chunk.gzipBytes, 0);
const largestIndex = indexChunks[0];
const publicCss = cssChunks.find((chunk) => chunk.name.startsWith('VouchEdgeTerminalPage-'));
const authenticatedCss = cssChunks.find((chunk) => chunk.name.startsWith('AuthenticatedApp-'));
const modalCss = cssChunks.find((chunk) => chunk.name.startsWith('AuthModal-'));

console.log(
  `[perf-check] index gzip=${formatKiB(largestIndex.gzipBytes)} budget=${formatKiB(MAX_JS_GZIP_BYTES)}`
);
console.log(
  `[perf-check] public CSS gzip=${formatKiB(publicCss?.gzipBytes ?? 0)} budget=${formatKiB(MAX_PUBLIC_CSS_GZIP_BYTES)}`
);
console.log(
  `[perf-check] auth CSS gzip=${formatKiB(authenticatedCss?.gzipBytes ?? 0)} budget=${formatKiB(MAX_AUTH_CSS_GZIP_BYTES)}`
);
console.log(
  `[perf-check] modal CSS gzip=${formatKiB(modalCss?.gzipBytes ?? 0)} budget=${formatKiB(MAX_MODAL_CSS_GZIP_BYTES)}`
);
console.log(
  `[perf-check] emitted CSS gzip=${formatKiB(totalCssGzip)} budget=${formatKiB(MAX_TOTAL_CSS_GZIP_BYTES)}`
);

let failed = false;

if (largestIndex.gzipBytes > MAX_JS_GZIP_BYTES) {
  console.error(`[perf-check] FAIL — index JS exceeds budget`);
  failed = true;
}

if (!publicCss || publicCss.gzipBytes > MAX_PUBLIC_CSS_GZIP_BYTES) {
  console.error(`[perf-check] FAIL — public landing CSS exceeds budget or is missing`);
  failed = true;
}

if (!authenticatedCss || authenticatedCss.gzipBytes > MAX_AUTH_CSS_GZIP_BYTES) {
  console.error(`[perf-check] FAIL — authenticated CSS exceeds budget or is missing`);
  failed = true;
}

if (!modalCss || modalCss.gzipBytes > MAX_MODAL_CSS_GZIP_BYTES) {
  console.error(`[perf-check] FAIL — auth modal CSS exceeds budget or is missing`);
  failed = true;
}

if (totalCssGzip > MAX_TOTAL_CSS_GZIP_BYTES) {
  console.error(`[perf-check] FAIL — total emitted CSS exceeds budget`);
  failed = true;
}

if (failed) {
  process.exit(1);
}

const lhci = spawnSync("npx", ["lhci", "--version"], { encoding: "utf8", stdio: "pipe" });
if (lhci.status === 0) {
  console.log("[perf-check] lhci detected — run `npm run preview` then `npx lhci autorun` for full Lighthouse CI");
} else {
  console.log("[perf-check] lhci not installed — bundle/CSS gate only (install @lhci/cli for Lighthouse CI)");
}

console.log("[perf-check] PASS");
process.exit(0);
