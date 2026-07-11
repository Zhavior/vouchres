#!/usr/bin/env node
/**
 * Code-side staging soak harness — hits critical endpoints and prints a pass/fail checklist.
 *
 * Manual steps still required before production ship:
 * 1. Stats API kill-switch (staging): block statsapi.mlb.com briefly (firewall, env override, or
 *    MLB_API_BASE_URL pointing at a dead host). Confirm these routes stay honest — never fake
 *    confirmed lineups or odds:
 *    - GET /api/mlb/lineup/today — 200 with last-good warnings in meta/warnings, or honest 503
 *    - GET /api/mlb/hr-board/today — 200 with meta.cache.strategy hr_board_last_good_snapshot
 *    - GET /api/mlb/hr-feed/today — 200 with last-known feed warning in warnings[]
 *    - GET /api/mlb/reports/daily — 200 with last-known daily report warning in warnings[]
 * 2. Multi-instance soak: run ≥2 app instances behind a load balancer with Upstash Redis enabled.
 *    Hit rate-limited routes from both instances; confirm shared Redis L2 last-good snapshots survive
 *    per-instance restarts (see productionProof.upstream_fallback_coverage in /api/health/backend).
 *
 * Usage:
 *   BASE_URL=http://127.0.0.1:3000 npm run staging-soak
 *   BASE_URL=https://staging.example npm run staging-soak -- --strict
 *   BASE_URL=http://127.0.0.1:3000 npm run staging-soak:strict
 *
 * Flags:
 *   --strict       Fail on HTTP 503 (default: accept honest upstream-unavailable envelopes)
 *   --local-only   Run only checks that do not require live MLB upstream (CI strict gate)
 *
 * CI note: staging-soak:strict uses --local-only --strict against the built server on 127.0.0.1.
 * Full --strict against a real staging host requires BASE_URL secret (e.g. GitHub Actions secret STAGING_BASE_URL).
 */
const BASE_URL = (process.env.BASE_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const STRICT = process.argv.includes("--strict");
const LOCAL_ONLY = process.argv.includes("--local-only");

const MIN_OPENAPI_PATHS = 25;

const LAST_GOOD_STRATEGY_RE = /last_good/i;
const LAST_GOOD_WARNING_RE = /last[- ]?(known|good)/i;

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/**
 * @param {unknown} body
 */
function validateHonest503(body) {
  if (!isRecord(body)) return "503 without object body";
  const error = body.error;
  if (!isRecord(error)) return "503 without error envelope";
  if (error.code !== "external_service_error") {
    return `503 with unexpected error.code: ${String(error.code ?? "missing")}`;
  }
  return null;
}

/**
 * @param {unknown} meta
 */
function metaLooksLastGood(meta) {
  if (!isRecord(meta)) return false;
  const cache = meta.cache;
  if (isRecord(cache) && typeof cache.strategy === "string" && LAST_GOOD_STRATEGY_RE.test(cache.strategy)) {
    return true;
  }
  return hasLastGoodWarnings(meta.warnings);
}

function isSupabaseUnavailable(status, body) {
  if (status !== 500 && status !== 503) return false;
  const message = isRecord(body)
    ? String(
        (isRecord(body.error) ? body.error.message : undefined)
          ?? body.message
          ?? body.error
          ?? "",
      )
    : "";
  return message.includes("SUPABASE_URL") || message.includes("Supabase admin client");
}

/**
 * @param {unknown} warnings
 */
function hasLastGoodWarnings(warnings) {
  if (!Array.isArray(warnings)) return false;
  return warnings.some((warning) => typeof warning === "string" && LAST_GOOD_WARNING_RE.test(warning));
}

/**
 * @param {{ status: number; body: unknown; strict?: boolean; validate200: (body: Record<string, unknown>) => string | null; allow503?: boolean }} input
 */
function validateMlbRoute({ status, body, strict = STRICT, validate200, allow503 = true }) {
  if (status === 503) {
    if (strict) return "expected HTTP 200, got 503 (--strict)";
    if (!allow503) return "unexpected HTTP 503";
    return validateHonest503(body);
  }
  if (status !== 200) return `expected HTTP 200${allow503 && !strict ? " or honest 503" : ""}, got ${status}`;
  if (!isRecord(body)) return "expected JSON object body";
  return validate200(body);
}

/** @type {{ id: string; path: string; localOnly?: boolean; validate: (ctx: { status: number; body: unknown }) => string | null }} */
const CHECKS = [
  {
    id: "health-backend",
    path: "/api/health/backend",
    localOnly: true,
    validate({ status, body }) {
      if (status !== 200) return `expected HTTP 200, got ${status}`;
      const row = /** @type {Record<string, unknown>} */ (body);
      if (row.ok !== true) return "body.ok !== true";
      if (row.service !== "vouchedge-backend") return `unexpected service: ${row.service}`;
      if (!row.dependencies || typeof row.dependencies !== "object") return "missing dependencies";
      if (!row.api || typeof row.api !== "object") return "missing api metrics";
      const proof = row.productionProof;
      if (!isRecord(proof) || !Array.isArray(proof.soakPending)) return "missing productionProof.soakPending";
      const fallback = proof.soakPending.find(
        (item) => isRecord(item) && item.id === "upstream_fallback_coverage",
      );
      if (!isRecord(fallback)) return "missing upstream_fallback_coverage soak item";
      const detail = typeof fallback.detail === "string" ? fallback.detail : "";
      if (!detail.includes("Redis L2")) return "upstream_fallback_coverage missing Redis L2 note";
      return null;
    },
  },
  {
    id: "hr-board-today",
    path: "/api/mlb/hr-board/today",
    validate({ status, body }) {
      return validateMlbRoute({
        status,
        body,
        allow503: true,
        validate200(row) {
          if (!Array.isArray(row.candidates)) return "missing candidates[]";
          if (typeof row.date !== "string" || row.date.length < 8) return "missing date";
          if (typeof row.gameCount !== "number") return "missing gameCount";
          if (!Array.isArray(row.projectedCandidates)) return "missing projectedCandidates[]";
          const lastGood = metaLooksLastGood(row.meta);
          if (lastGood && !hasLastGoodWarnings(row.meta?.warnings ?? row.warnings)) {
            return "last-good meta without matching warnings";
          }
          return null;
        },
      });
    },
  },
  {
    id: "lineup-today",
    path: "/api/mlb/lineup/today",
    validate({ status, body }) {
      return validateMlbRoute({
        status,
        body,
        allow503: true,
        validate200(row) {
          if (typeof row.date !== "string" || row.date.length < 8) return "missing date";
          if (!Array.isArray(row.warnings)) return "missing warnings[]";
          if (!Array.isArray(row.games)) return "missing games[]";
          const lastGood =
            row.source === "mlb_statsapi_lineups_last_good" || metaLooksLastGood(row.meta);
          if (lastGood && !hasLastGoodWarnings(row.warnings) && !hasLastGoodWarnings(row.meta?.warnings)) {
            return "last-good lineup without honest warnings";
          }
          return null;
        },
      });
    },
  },
  {
    id: "hr-feed-today",
    path: "/api/mlb/hr-feed/today",
    validate({ status, body }) {
      return validateMlbRoute({
        status,
        body,
        allow503: true,
        validate200(row) {
          if (!Array.isArray(row.events)) return "missing events[]";
          if (!Array.isArray(row.warnings)) return "missing warnings[]";
          if (typeof row.count !== "number") return "missing count";
          if (hasLastGoodWarnings(row.warnings) && row.events.length === 0) {
            return "last-good HR feed should still include prior events[] when available";
          }
          return null;
        },
      });
    },
  },
  {
    id: "daily-report",
    path: "/api/mlb/reports/daily",
    validate({ status, body }) {
      return validateMlbRoute({
        status,
        body,
        allow503: true,
        validate200(row) {
          if (typeof row.date !== "string" || row.date.length < 8) return "missing date";
          if (typeof row.gameCount !== "number") return "missing gameCount";
          if (!Array.isArray(row.warnings)) return "missing warnings[]";
          if (typeof row.dataQuality !== "string") return "missing dataQuality";
          if (typeof row.generatedAt !== "string") return "missing generatedAt";
          if (hasLastGoodWarnings(row.warnings) && row.dataQuality === "full") {
            return "last-good daily report should not claim dataQuality=full";
          }
          return null;
        },
      });
    },
  },
  {
    id: "openapi-json",
    path: "/api/openapi.json",
    localOnly: true,
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
  {
    id: "auth-username-check",
    path: "/api/auth/username-check?username=soak_probe_user",
    localOnly: true,
    validate({ status, body }) {
      if (isSupabaseUnavailable(status, body)) return null;
      if (status !== 200) return `expected HTTP 200, got ${status}`;
      const row = /** @type {Record<string, unknown>} */ (body);
      if (row.ok !== true) return "body.ok !== true";
      if (typeof row.available !== "boolean") return "missing available boolean";
      return null;
    },
  },
  {
    id: "auth-handle-check",
    path: "/api/auth/handle-check?handle=soak_probe",
    localOnly: true,
    validate({ status, body }) {
      if (isSupabaseUnavailable(status, body)) return null;
      if (status !== 200) return `expected HTTP 200, got ${status}`;
      const row = /** @type {Record<string, unknown>} */ (body);
      if (row.ok !== true) return "body.ok !== true";
      if (typeof row.available !== "boolean") return "missing available boolean";
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

/**
 * @param {unknown} error
 */
function isUnreachableError(error) {
  if (!(error instanceof Error)) return false;
  const code = /** @type {{ code?: string; cause?: { code?: string } }} */ (error).code;
  const causeCode = /** @type {{ cause?: { code?: string } }} */ (error).cause?.code;
  return (
    code === "ECONNREFUSED" ||
    code === "ENOTFOUND" ||
    code === "EHOSTUNREACH" ||
    causeCode === "ECONNREFUSED" ||
    causeCode === "ENOTFOUND" ||
    error.message.includes("fetch failed")
  );
}

function printResult(id, ok, detail) {
  const tag = ok ? "PASS" : "FAIL";
  console.log(`[${tag}] ${id}${detail ? ` — ${detail}` : ""}`);
}

async function main() {
  const checks = LOCAL_ONLY ? CHECKS.filter((check) => check.localOnly) : CHECKS;
  console.log(
    `[staging-soak] BASE_URL=${BASE_URL}${STRICT ? " strict=1" : ""}${LOCAL_ONLY ? " local-only=1" : ""} checks=${checks.length}`,
  );

  let hardFailures = 0;
  let skipped = false;

  for (const check of checks) {
    try {
      const result = await fetchJson(check.path);
      const error = check.validate(result);
      if (error) {
        hardFailures += 1;
        printResult(check.id, false, error);
      } else {
        const row = isRecord(result.body) ? result.body : {};
        const degraded =
          result.status === 503 ||
          metaLooksLastGood(row.meta) ||
          hasLastGoodWarnings(row.warnings) ||
          row.source === "mlb_statsapi_lineups_last_good";
        const suffix = degraded ? " (degraded/last-good)" : "";
        const skippedSupabase =
          isSupabaseUnavailable(result.status, result.body) ? " (skipped: supabase not configured)" : "";
        printResult(check.id, true, `${check.path} -> ${result.status}${suffix}${skippedSupabase}`);
      }
    } catch (error) {
      if (!skipped && isUnreachableError(error)) {
        skipped = true;
        console.warn(
          `[staging-soak] server unreachable at ${BASE_URL} — skipping remaining checks (start with npm run dev)`,
        );
        break;
      }
      hardFailures += 1;
      const message = error instanceof Error ? error.message : String(error);
      printResult(check.id, false, message);
    }
  }

  if (skipped) {
    console.log("[staging-soak] skipped — backend not reachable");
    process.exit(0);
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
