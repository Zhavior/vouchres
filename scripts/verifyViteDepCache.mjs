#!/usr/bin/env node
/**
 * Vite dep-cache integrity preflight.
 *
 * Vite pre-bundles dependencies into node_modules/.vite/deps and serves them
 * with `Cache-Control: immutable`, keyed on a browserHash. Those bundles import
 * shared `chunk-XXXXXXXX.js` siblings by name.
 *
 * If a re-optimize is interrupted (dev server killed mid-write, two servers
 * racing the same directory), the directory can be left internally
 * inconsistent: a dep bundle still importing a chunk that no longer exists.
 * The dev server keeps serving that bundle happily, the browser 404s on the
 * chunk, and every route importing it dies with:
 *
 *   Failed to fetch dynamically imported module: .../SomePage.tsx
 *
 * The error names the route, never the missing chunk, so it reads like an
 * application bug. Reloading cannot fix it — the corruption is on disk.
 *
 * This runs before `npm run dev` and wipes the cache when it finds a dangling
 * reference. Cost of a false positive is one re-optimize (a few seconds).
 */

import { existsSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";

const VITE_CACHE = join(process.cwd(), "node_modules", ".vite");
const DEPS_DIR = join(VITE_CACHE, "deps");

/** Matches `from "./chunk-ABC123.js"` / `import "./chunk-ABC123.js"`. */
const CHUNK_REF_RE = /["'`]\.\/(chunk-[A-Z0-9]+\.js)["'`]/gi;

function findDanglingChunkRefs() {
  if (!existsSync(DEPS_DIR)) return [];

  const present = new Set(readdirSync(DEPS_DIR));
  const dangling = [];

  for (const file of present) {
    if (!file.endsWith(".js")) continue;

    let source;
    try {
      source = readFileSync(join(DEPS_DIR, file), "utf8");
    } catch {
      continue; // Unreadable mid-write; the wipe below covers it anyway.
    }

    for (const match of source.matchAll(CHUNK_REF_RE)) {
      const referenced = match[1];
      if (!present.has(referenced)) {
        dangling.push({ from: file, missing: referenced });
      }
    }
  }

  return dangling;
}

function main() {
  const dangling = findDanglingChunkRefs();
  if (dangling.length === 0) return;

  const shown = dangling.slice(0, 5);
  console.warn(
    `[vite-dep-cache] Corrupt dependency cache — ${dangling.length} dangling chunk reference${
      dangling.length === 1 ? "" : "s"
    }:`,
  );
  for (const { from, missing } of shown) {
    console.warn(`[vite-dep-cache]   ${from} -> ${missing} (missing)`);
  }
  if (dangling.length > shown.length) {
    console.warn(`[vite-dep-cache]   ...and ${dangling.length - shown.length} more`);
  }

  for (const dir of [VITE_CACHE, `${VITE_CACHE}-temp`, `${VITE_CACHE} 2`]) {
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch (error) {
      console.warn(`[vite-dep-cache] Could not remove ${dir}: ${error.message}`);
    }
  }

  console.warn(
    "[vite-dep-cache] Cache cleared. Vite will re-optimize on boot — hard-reload any open tab.",
  );
}

main();
