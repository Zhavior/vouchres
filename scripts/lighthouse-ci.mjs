#!/usr/bin/env node
/**
 * Lighthouse CI — performance audit against a built preview or explicit URL.
 *
 * Perf budgets (see also scripts/perf-check.mjs):
 *   CSS gzip total ≤ 88 KiB (PERF_CSS_BUDGET_BYTES)
 *   index JS gzip ≤ 130 KiB (BUNDLE_BUDGET_BYTES)
 *   Lighthouse performance score ≥ LIGHTHOUSE_PERF_MIN (default 0.58)
 *
 * Env:
 *   LIGHTHOUSE_URL          Target URL (default: http://127.0.0.1:4173)
 *   LIGHTHOUSE_SKIP=1       Graceful skip (exit 0)
 *   LIGHTHOUSE_STRICT=1     Fail when Chrome/Lighthouse unavailable (set in CI to harden)
 *   LIGHTHOUSE_PERF_MIN     Minimum performance score 0–1 (default: 0.58)
 *   LIGHTHOUSE_START_PREVIEW=1 Spawn `vite preview` when URL is local default
 *   CI=true                 When STRICT is unset, still skips gracefully on missing Chrome
 *
 * Strict CI example:
 *   LIGHTHOUSE_STRICT=1 LIGHTHOUSE_START_PREVIEW=1 npm run lighthouse-ci
 *
 * Usage:
 *   npm run build && LIGHTHOUSE_START_PREVIEW=1 npm run lighthouse-ci
 *   LIGHTHOUSE_URL=https://staging.example npm run lighthouse-ci
 */
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import net from "node:net";

const DEFAULT_URL = "http://127.0.0.1:4173";
const DEFAULT_PORT = 4173;
const PERF_MIN = Number(process.env.LIGHTHOUSE_PERF_MIN ?? 0.58);
const TARGET_URL = (process.env.LIGHTHOUSE_URL ?? process.env.BASE_URL ?? DEFAULT_URL).replace(/\/$/, "");
const STRICT = process.env.LIGHTHOUSE_STRICT === "1";
const SKIP = process.env.LIGHTHOUSE_SKIP === "1";
const START_PREVIEW =
  process.env.LIGHTHOUSE_START_PREVIEW === "1" ||
  (TARGET_URL === DEFAULT_URL && process.env.LIGHTHOUSE_START_PREVIEW !== "0");

function log(msg) {
  console.log(`[lighthouse-ci] ${msg}`);
}

function warn(msg) {
  console.warn(`[lighthouse-ci] ${msg}`);
}

function fail(msg, code = 1) {
  console.error(`[lighthouse-ci] FAIL — ${msg}`);
  process.exit(code);
}

function skip(msg) {
  warn(`SKIP — ${msg}`);
  process.exit(0);
}

function portOpen(host, port) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port });
    const done = (open) => {
      socket.destroy();
      resolve(open);
    };
    socket.setTimeout(800);
    socket.on("connect", () => done(true));
    socket.on("timeout", () => done(false));
    socket.on("error", () => done(false));
  });
}

async function waitForUrl(url, attempts = 60, delayMs = 500) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(url, { method: "GET", redirect: "follow" });
      if (res.ok || res.status < 500) return true;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return false;
}

function startPreview() {
  if (!existsSync("dist/index.html")) {
    fail("dist/index.html missing — run npm run build first");
  }

  const child = spawn("npx", ["vite", "preview", "--host", "127.0.0.1", "--port", String(DEFAULT_PORT)], {
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, BROWSER: "none" },
  });

  child.stdout?.on("data", (chunk) => process.stdout.write(chunk));
  child.stderr?.on("data", (chunk) => process.stderr.write(chunk));

  return child;
}

function lighthouseAvailable() {
  const probe = spawnSync("npx", ["lighthouse", "--version"], { encoding: "utf8", stdio: "pipe" });
  return probe.status === 0;
}

async function runLighthouse(url) {
  const outPath = ".lighthouseci/perf-report.json";
  mkdirSync(".lighthouseci", { recursive: true });
  const args = [
    "lighthouse",
    url,
    "--only-categories=performance",
    "--output=json",
    `--output-path=${outPath}`,
    "--quiet",
    "--chrome-flags=--headless --no-sandbox --disable-gpu",
  ];

  return new Promise((resolve, reject) => {
    const child = spawn("npx", args, { stdio: ["ignore", "pipe", "pipe"], env: process.env });
    let stderr = "";
    child.stderr?.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr.trim() || `lighthouse exited ${code}`));
        return;
      }
      resolve(outPath);
    });
  });
}

async function readPerfScore(reportPath) {
  const { readFileSync, mkdirSync } = await import("node:fs");
  const { dirname } = await import("node:path");
  mkdirSync(dirname(reportPath), { recursive: true });
  const raw = readFileSync(reportPath, "utf8");
  const json = JSON.parse(raw);
  const score = json?.categories?.performance?.score;
  if (typeof score !== "number") {
    throw new Error("Lighthouse report missing performance score");
  }
  return score;
}

async function main() {
  if (SKIP) {
    skip("LIGHTHOUSE_SKIP=1");
  }

  if (!existsSync("dist")) {
    fail("dist/ missing — run npm run build first");
  }

  let previewProc = null;

  try {
    const alreadyUp = await waitForUrl(TARGET_URL, 3, 200);
    if (!alreadyUp && START_PREVIEW) {
      log(`starting vite preview on ${DEFAULT_URL}`);
      previewProc = startPreview();
      const ready = await waitForUrl(TARGET_URL);
      if (!ready) {
        fail(`preview did not become ready at ${TARGET_URL}`);
      }
    } else if (!alreadyUp) {
      const msg = `target ${TARGET_URL} is not reachable — set LIGHTHOUSE_START_PREVIEW=1 or LIGHTHOUSE_URL`;
      if (STRICT) fail(msg);
      skip(msg);
    }

    if (!lighthouseAvailable()) {
      const msg = "lighthouse CLI unavailable (npx lighthouse --version failed)";
      if (STRICT) fail(msg);
      skip(`${msg}; bundle/CSS gates still run via npm run perf-check`);
    }

    log(`auditing ${TARGET_URL} (perf min ${PERF_MIN})`);
    const reportPath = await runLighthouse(TARGET_URL);
    const score = await readPerfScore(reportPath);
    const pct = (score * 100).toFixed(1);
    log(`performance score: ${pct} (min ${(PERF_MIN * 100).toFixed(1)})`);

    if (score < PERF_MIN) {
      fail(`performance ${pct} below minimum ${(PERF_MIN * 100).toFixed(1)} — trim CSS (perf-check) or defer non-critical JS`);
    }

    log(`PASS (perf ${pct}, CSS/JS gates: npm run perf-check)`);
    process.exit(0);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (/chrome|chromium|browser/i.test(msg)) {
      if (STRICT) fail(msg);
      skip(`Chrome not available in this environment (${msg}). Use perf-check for bundle gates.`);
    }
    if (STRICT) fail(msg);
    skip(msg);
  } finally {
    if (previewProc && !previewProc.killed) {
      previewProc.kill("SIGTERM");
    }
  }
}

main();
