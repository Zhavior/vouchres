#!/usr/bin/env node
/**
 * Code-side staging soak harness — hits critical endpoints and prints a pass/fail checklist.
 *
 * Manual steps still required before production ship:
 * 1. On staging, briefly kill/block MLB Stats API and confirm /api/mlb/lineup/today and
 *    /api/mlb/hr-board/today return honest warnings (never fake confirmed lineups).
 * 2. Run this against a multi-instance load balancer to confirm shared Redis / cache behavior.
 *
 * Usage: BASE_URL=http://127.0.0.1:3000 npm run staging-soak
 */
const BASE_URL = (process.env.BASE_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");

const MIN_OPENAPI_PATHS = 25;

/** @type {{ id: string; path: string; validate: (ctx: { status: number; body: unknown }) => string | null }} */
const CHECKS = [
  {
    id: "health-backend",
    path: "/api/health/backend",
    validate({ status, body }) {
      if (status !== 200) return `expected HTTP 200, got ${status}`;
      const row = /** @type {Record<string, unknown>} */ (body);
      if (row.ok !== true) return "body.ok !== true";
      if (row.service !== "vouchedge-backend") return `unexpected service: ${row.service}`;
      if (!row.dependencies || typeof row.dependencies !== "object") return "missing dependencies";
      if (!row.api || typeof row.api !== "object") return "missing api metrics";
      return null;
    },
  },
  {
    id: "hr-board-today",
    path: "/api/mlb/hr-board/today",
    validate({ status, body }) {
      if (status !== 200) return `expected HTTP 200, got ${status}`;
      const row = /** @type {Record<string, unknown>} */ (body);
      if (!Array.isArray(row.candidates)) return "missing candidates[]";
      if (typeof row.date !== "string" || row.date.length < 8) return "missing date";
      if (typeof row.gameCount !== "number") return "missing gameCount";
      if (!Array.isArray(row.projectedCandidates)) return "missing projectedCandidates[]";
      return null;
    },
  },
  {
    id: "lineup-today",
    path: "/api/mlb/lineup/today",
    validate({ status, body }) {
      const row = /** @type {Record<string, unknown>} */ (body);
      if (status === 503) {
        const error = row.error;
        if (!error || typeof error !== "object") return "503 without error envelope";
        const code = /** @type {{ code?: string }} */ (error).code;
        if (code !== "external_service_error") {
          return `503 with unexpected error.code: ${code ?? "missing"}`;
        }
        return null;
      }
      if (status !== 200) return `expected HTTP 200 or honest 503, got ${status}`;
      if (typeof row.date !== "string" || row.date.length < 8) return "missing date";
      if (!Array.isArray(row.warnings)) return "missing warnings[]";
      if (!Array.isArray(row.games)) return "missing games[]";
      return null;
    },
  },
  {
    id: "hr-feed-today",
    path: "/api/mlb/hr-feed/today",
    validate({ status, body }) {
      if (status !== 200) return `expected HTTP 200, got ${status}`;
      const row = /** @type {Record<string, unknown>} */ (body);
      if (!Array.isArray(row.events)) return "missing events[]";
      if (!Array.isArray(row.warnings)) return "missing warnings[]";
      if (typeof row.count !== "number") return "missing count";
      return null;
    },
  },
  {
    id: "openapi-json",
    path: "/api/openapi.json",
    validate({ status, body }) {
      if (status !== 200) return `expected HTTP 200, got ${status}`;
      const row = /** @type {Record<string, unknown>} */ (body);
      if (typeof row.openapi !== "string" || !row.openapi.startsWith("3.")) {
        return "not OpenAPI 3.x";
      }
      const paths = row.paths;
      if (!paths || typeof paths !== "object") return "missing paths";
      const pathCount = Object.keys(paths).length;
      if (pathCount < MIN_OPENAPI_PATHS) {
        return `path count ${pathCount} < ${MIN_OPENAPI_PATHS}`;
      }
      return null;
    },
  },
];

/**
 * @param {string} path
 */
async function fetchJson(path) {
  const url = `${BASE_URL}${path}`;
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  const contentType = response.headers.get("content-type") ?? "";
  const text = await response.text();

  if (
    contentType.includes("text/html") ||
    text.trimStart().startsWith("<!doctype html") ||
    text.trimStart().startsWith("<html")
  ) {
    throw new Error(`${path} returned HTML instead of JSON`);
  }

  if (!contentType.includes("application/json")) {
    throw new Error(`${path} returned non-JSON content-type: ${contentType || "missing"}`);
  }

  let body;
  try {
    body = JSON.parse(text);
  } catch {
    throw new Error(`${path} returned invalid JSON`);
  }

  return { status: response.status, body };
}

function printResult(id, ok, detail) {
  const tag = ok ? "PASS" : "FAIL";
  console.log(`[${tag}] ${id}${detail ? ` — ${detail}` : ""}`);
}

async function main() {
  console.log(`[staging-soak] BASE_URL=${BASE_URL}`);
  let hardFailures = 0;

  for (const check of CHECKS) {
    try {
      const result = await fetchJson(check.path);
      const error = check.validate(result);
      if (error) {
        hardFailures += 1;
        printResult(check.id, false, error);
      } else {
        printResult(check.id, true, `${check.path} -> ${result.status}`);
      }
    } catch (error) {
      hardFailures += 1;
      const message = error instanceof Error ? error.message : String(error);
      printResult(check.id, false, message);
    }
  }

  if (hardFailures > 0) {
    console.error(`[staging-soak] ${hardFailures} hard failure(s)`);
    process.exit(1);
  }

  console.log("[staging-soak] all checks passed");
  process.exit(0);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
