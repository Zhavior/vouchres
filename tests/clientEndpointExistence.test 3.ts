import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import express from "express";
import { describe, expect, it, vi } from "vitest";
import { registerApiRoutes } from "../server/routes";

/**
 * Guard: every /api path the client calls must exist on the server.
 *
 * This exists because the opposite went unnoticed for a long time. The client
 * called `/api/nba/edge-board/today`, `/api/nba/lineup/today`,
 * `/api/social/v3/feed/outbox` and `/api/social/v3/presence` — none of which
 * were ever mounted. Two of those were fire-and-forget writes swallowed with
 * `.catch(() => {})`, so posts and presence silently never persisted while the
 * UI rendered success.
 *
 * Types cannot catch this: the paths are strings. So compare the strings the
 * client ships against the routes Express actually registers.
 */

const SRC_DIR = join(__dirname, "..", "src");

/**
 * Known strings that are not request targets, or are deliberately unmounted.
 * Every entry needs a reason — this list is the escape hatch, so an unexplained
 * addition is the smell.
 */
const ALLOWED_UNMOUNTED = new Set<string>([
  // Prefix matchers, not endpoints: apiClient uses these to pick a longer
  // timeout for generation routes, and to sniff hr-board cache-control.
  "/api/ai",
  "/api/agents",
  "/api/judge",
  "/api/intelligence",
  "/api/mlb/hr-board",
  // Declared in the sport registry for NBA, which ships `enabled: false` and is
  // unreachable from the UI. The registry is the single source of truth for
  // sports, so the paths live there ahead of the routes existing.
  "/api/nba/edge-board/today",
  "/api/nba/lineup/today",
]);

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full, out);
    } else if (/\.(ts|tsx)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

/**
 * Collect `/api/...` literals from client source. Template placeholders become
 * `:param` so they line up with Express route patterns, and a trailing query
 * string or fragment is dropped.
 */
function collectClientApiPaths(): Map<string, string[]> {
  const found = new Map<string, string[]>();

  for (const file of walk(SRC_DIR)) {
    // Drop comments first: a commented-out call is not a call. profileStore
    // has `/api/v3/preferences` disabled behind a comment, for example.
    const text = readFileSync(file, "utf8")
      .split("\n")
      .filter((line) => {
        const t = line.trim();
        return !t.startsWith("//") && !t.startsWith("*") && !t.startsWith("/*");
      })
      .join("\n");
    // Match '/api/...' or `/api/...` inside quotes or backticks.
    const matches = text.matchAll(/['"`](\/api\/[^'"`\s]*)['"`]/g);
    for (const match of matches) {
      let path = match[1];
      path = path.split("?")[0].split("#")[0];
      // `${...}` -> :param
      path = path.replace(/\$\{[^}]*\}/g, ":param");
      // Drop a trailing slash (but keep the root).
      if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
      if (!path.startsWith("/api/")) continue;
      const rel = file.slice(SRC_DIR.length + 1);
      const seen = found.get(path) ?? [];
      if (!seen.includes(rel)) seen.push(rel);
      found.set(path, seen);
    }
  }

  return found;
}

/** Every path pattern Express has registered, normalised to `:param`. */
function collectServerRoutePatterns(): string[] {
  vi.stubEnv("CRON_SECRET", "test-cron-secret");
  const app = express();
  registerApiRoutes(app);

  const patterns: string[] = [];

  const visit = (stack: any[], prefix: string) => {
    for (const layer of stack ?? []) {
      if (layer.route?.path !== undefined) {
        const paths = Array.isArray(layer.route.path) ? layer.route.path : [layer.route.path];
        for (const p of paths) patterns.push(`${prefix}${p}`);
        continue;
      }
      if (layer.name === "router" && layer.handle?.stack) {
        visit(layer.handle.stack, prefix + mountPathOf(layer));
      }
    }
  };

  // Express encodes a router's mount path as a regexp; recover the literal
  // prefix from the layer when it is a plain string mount.
  const mountPathOf = (layer: any): string => {
    const source: string = layer.regexp?.source ?? "";
    if (source === "^\\/?(?=\\/|$)") return "";
    const literal = source
      .replace(/^\^/, "")
      .replace(/\\\/\?\(\?=\\\/\|\$\)$/, "")
      .replace(/\\\//g, "/")
      .replace(/\$$/, "");
    return /^[/\w.-]*$/.test(literal) ? literal : "";
  };

  visit((app as any)._router?.stack ?? (app as any).router?.stack, "");
  return patterns.map(normalisePattern);
}

function normalisePattern(pattern: string): string {
  return pattern
    .replace(/:[A-Za-z0-9_]+/g, ":param")
    .replace(/\/+/g, "/")
    .replace(/\/$/, "");
}

/** Does a concrete client path match any registered pattern? */
function isServed(clientPath: string, patterns: Set<string>): boolean {
  const normalised = normalisePattern(clientPath);
  if (patterns.has(normalised)) return true;

  // A client literal may sit where the server declares a parameter, e.g.
  // client '/api/mlb/hr-board/today' vs server '/api/mlb/hr-board/:date'.
  const clientSegments = normalised.split("/");
  for (const pattern of patterns) {
    const patternSegments = pattern.split("/");
    if (patternSegments.length !== clientSegments.length) continue;
    const ok = patternSegments.every(
      (seg, i) => seg === ":param" || seg === clientSegments[i],
    );
    if (ok) return true;
  }
  return false;
}

describe("client endpoint existence guard", () => {
  it("every /api path the client calls is registered on the server", () => {
    const clientPaths = collectClientApiPaths();
    const patterns = new Set(collectServerRoutePatterns());

    expect(patterns.size).toBeGreaterThan(50);

    const unmounted: string[] = [];
    for (const [path, files] of clientPaths) {
      if (ALLOWED_UNMOUNTED.has(path)) continue;
      if (!isServed(path, patterns)) {
        unmounted.push(`${path}  <- ${files.join(", ")}`);
      }
    }

    expect(
      unmounted,
      unmounted.length
        ? `Client calls ${unmounted.length} path(s) with no server route:\n  ${unmounted.join("\n  ")}`
        : undefined,
    ).toEqual([]);
  });
});
