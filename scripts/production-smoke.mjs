#!/usr/bin/env node
/**
 * Production / staging post-deploy smoke — covers deploy checklist verification steps.
 *
 * Usage:
 *   BASE_URL=https://your-api.onrender.com npm run production-smoke
 *   BASE_URL=http://127.0.0.1:3010 npm run production-smoke -- --local
 *
 * Optional:
 *   CRON_SECRET          — verifies grade-due returns 200/ok with Bearer (else expects 401)
 *   STAFF_ACCESS_TOKEN   — verifies /api/health/backend envReady (else expects 401)
 *   FRONTEND_URL         — only used for CORS Origin header probe
 *
 * Exit 0 when all applicable checks pass.
 */
const BASE_URL = (process.env.BASE_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const LOCAL = process.argv.includes("--local");
const CRON_SECRET = process.env.CRON_SECRET?.trim() ?? "";
const STAFF_TOKEN = process.env.STAFF_ACCESS_TOKEN?.trim() ?? "";
const FRONTEND_URL = (process.env.FRONTEND_URL ?? "https://vouchedge.app").replace(/\/$/, "");

/**
 * @param {string} path
 * @param {{ method?: string, body?: unknown, headers?: Record<string, string> }} [opts]
 */
async function fetchJson(path, opts = {}) {
  const method = opts.method ?? "GET";
  const headers = {
    Accept: "application/json",
    ...(opts.body ? { "Content-Type": "application/json" } : {}),
    ...(opts.headers ?? {}),
  };
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { _raw: text.slice(0, 200) };
  }
  return { status: response.status, body, headers: response.headers };
}

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/** @type {Array<{ id: string; run: () => Promise<string | null> }>} */
const checks = [
  {
    id: "health-liveness",
    async run() {
      const { status, body } = await fetchJson("/api/health");
      if (status !== 200) return `expected 200, got ${status}`;
      if (!isRecord(body) || body.ok !== true) return "expected ok:true";
      return null;
    },
  },
  {
    id: "health-ready",
    async run() {
      const { status, body } = await fetchJson("/api/health/ready");
      if (status !== 200 && status !== 503) return `expected 200 or 503, got ${status}`;
      if (!isRecord(body)) return "expected JSON body";
      return null;
    },
  },
  {
    id: "health-backend-staff-gate",
    async run() {
      const { status, body } = await fetchJson("/api/health/backend");
      if (status !== 401) return `expected 401 without auth, got ${status}`;
      if (!isRecord(body) || body.ok !== false) return "expected ok:false";
      return null;
    },
  },
  {
    id: "parlay-grade-auth-gate",
    async run() {
      const { status, body } = await fetchJson("/api/parlays/grade", {
        method: "POST",
        body: { legs: [] },
      });
      if (status !== 401) return `expected 401, got ${status}`;
      if (!isRecord(body) || body.ok !== false) return "expected ok:false";
      const error = isRecord(body.error) ? body.error : null;
      if (error?.code !== "missing_token") return `expected missing_token, got ${String(error?.code)}`;
      return null;
    },
  },
  {
    id: "parlay-live-progress-auth-gate",
    async run() {
      const { status, body } = await fetchJson("/api/parlays/live-progress", {
        method: "POST",
        body: { legs: [{ gamePk: "777001", playerId: "592450" }] },
      });
      if (status !== 401) return `expected 401, got ${status}`;
      if (!isRecord(body) || body.ok !== false) return "expected ok:false";
      const error = isRecord(body.error) ? body.error : null;
      if (error?.code !== "missing_token") return `expected missing_token, got ${String(error?.code)}`;
      return null;
    },
  },
  {
    id: "cron-grade-due-unauthenticated",
    async run() {
      // Dev/local: when CRON_SECRET is unset, cron routes are intentionally open
      // (see server/lib/cronAuth.ts). Production always has CRON_SECRET → 401.
      if (LOCAL && !CRON_SECRET) {
        return "skipped: local cron is open when CRON_SECRET unset (prod requires it)";
      }
      const { status } = await fetchJson("/api/cron/parlays/grade-due");
      if (status !== 401 && status !== 403) return `expected 401/403 without secret, got ${status}`;
      return null;
    },
  },
  {
    id: "cron-grade-due-authenticated",
    async run() {
      if (!CRON_SECRET) return LOCAL ? null : "skipped: set CRON_SECRET to probe authenticated cron";
      const { status, body } = await fetchJson("/api/cron/parlays/grade-due", {
        headers: { Authorization: `Bearer ${CRON_SECRET}` },
      });
      // 200 = ran; 409/429 = lock/coalesce; both prove auth passed
      if (status === 401 || status === 403) return `cron secret rejected (${status})`;
      if (status >= 500) return `cron returned ${status}: ${JSON.stringify(body)?.slice(0, 120)}`;
      return null;
    },
  },
  {
    id: "staff-backend-env-ready",
    async run() {
      if (!STAFF_TOKEN) return LOCAL ? null : "skipped: set STAFF_ACCESS_TOKEN to probe productionProof.envReady";
      const { status, body } = await fetchJson("/api/health/backend", {
        headers: { Authorization: `Bearer ${STAFF_TOKEN}` },
      });
      if (status === 401 || status === 403) return `staff token rejected (${status})`;
      if (status !== 200) return `expected 200, got ${status}`;
      if (!isRecord(body)) return "expected JSON body";
      const proof = isRecord(body.productionProof) ? body.productionProof : null;
      if (!proof) return "missing productionProof";
      if (proof.envReady !== true) {
        const items = Array.isArray(proof.items) ? proof.items : [];
        const pending = items
          .filter((item) => isRecord(item) && item.ready !== true)
          .map((item) => (isRecord(item) ? String(item.id) : "?"))
          .join(", ");
        return `productionProof.envReady !== true (pending: ${pending || "unknown"})`;
      }
      return null;
    },
  },
  {
    id: "vercel-crons-empty-contract",
    async run() {
      // Local source check when running --local; skip remote (SPA doesn't expose vercel.json)
      if (!LOCAL) return null;
      const fs = await import("node:fs");
      const path = await import("node:path");
      const vercelPath = path.join(process.cwd(), "vercel.json");
      if (!fs.existsSync(vercelPath)) return "vercel.json missing";
      const vercel = JSON.parse(fs.readFileSync(vercelPath, "utf8"));
      if (!Array.isArray(vercel.crons) || vercel.crons.length !== 0) {
        return `vercel.json crons must be [] while Render owns cron (got ${JSON.stringify(vercel.crons)})`;
      }
      return null;
    },
  },
  {
    id: "cors-preflight-frontend",
    async run() {
      if (LOCAL) return null;
      const response = await fetch(`${BASE_URL}/api/health`, {
        method: "OPTIONS",
        headers: {
          Origin: FRONTEND_URL,
          "Access-Control-Request-Method": "GET",
        },
      });
      // Some hosts may not answer OPTIONS; treat 2xx/204/404 as non-fatal if ACAO present or skip
      const allowOrigin = response.headers.get("access-control-allow-origin");
      if (response.status >= 500) return `CORS preflight failed with ${response.status}`;
      if (allowOrigin && allowOrigin !== FRONTEND_URL && allowOrigin !== "*") {
        return `unexpected ACAO ${allowOrigin} for Origin ${FRONTEND_URL}`;
      }
      return null;
    },
  },
];

async function main() {
  console.log(`[production-smoke] BASE_URL=${BASE_URL} local=${LOCAL ? 1 : 0}`);
  let failed = 0;
  let skipped = 0;

  for (const check of checks) {
    try {
      const result = await check.run();
      if (result == null) {
        console.log(`[PASS] ${check.id}`);
      } else if (result.startsWith("skipped:")) {
        skipped += 1;
        console.log(`[SKIP] ${check.id} — ${result}`);
      } else {
        failed += 1;
        console.log(`[FAIL] ${check.id} — ${result}`);
      }
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      console.log(`[FAIL] ${check.id} — ${message}`);
    }
  }

  console.log(
    `[production-smoke] done — failed=${failed} skipped=${skipped} (set CRON_SECRET / STAFF_ACCESS_TOKEN to unskip)`,
  );
  if (failed > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
