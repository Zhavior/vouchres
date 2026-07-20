import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { createV3App } from "../server/v3/app";

const root = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

function includesAll(source: string, snippets: string[], label: string): void {
  for (const snippet of snippets) {
    assert(source.includes(snippet), `${label} missing: ${snippet}`);
  }
}

async function listen(server: http.Server): Promise<number> {
  return await new Promise((resolve, reject) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Failed to resolve ephemeral port."));
        return;
      }
      resolve(address.port);
    });
    server.on("error", reject);
  });
}

async function fetchJson(baseUrl: string, routePath: string, init?: RequestInit) {
  const response = await fetch(`${baseUrl}${routePath}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const text = await response.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error(`${routePath} returned non-JSON content-type: ${contentType || "missing"}`);
  }

  return { response, body };
}

async function runtimeChecks() {
  const app = createV3App();
  const server = http.createServer(app);
  const port = await listen(server);
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const checks: Array<{ name: string; ok: boolean; detail: string }> = [];

    const health = await fetchJson(baseUrl, "/api/v3/system/health");
    const healthBody = health.body as { ok?: boolean; service?: string; status?: string } | null;
    checks.push({
      name: "v3 system health",
      ok:
        health.response.status === 200
        && healthBody?.ok === true
        && healthBody?.service === "vouchres-backend-v3",
      detail: `status ${health.response.status}`,
    });

    const protectedRoutes = [
      "/api/v3/system/self-heal",
      "/api/v3/grading/ledger",
      "/api/v3/billing/status",
      "/api/v3/me/parlays",
    ];

    for (const routePath of protectedRoutes) {
      const result = await fetchJson(baseUrl, routePath);
      checks.push({
        name: `${routePath} auth gate`,
        ok: result.response.status === 401,
        detail: `status ${result.response.status}`,
      });
    }

    const failed = checks.filter((check) => !check.ok);
    for (const check of checks) {
      console.log(`${check.ok ? "PASS" : "FAIL"} · ${check.name} · ${check.detail}`);
    }

    if (failed.length > 0) {
      throw new Error(`V3 runtime smoke failed (${failed.length}/${checks.length})`);
    }
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }
}

async function main() {
  const v3Routes = read("server/v3/routes/index.ts");
  const v3App = read("server/v3/app.ts");
  const v3System = read("server/v3/modules/system/routes.ts");
  const v3Grading = read("server/v3/modules/grading/routes.ts");
  const v3Trust = read("server/v3/modules/trust/routes.ts");
  const v3Billing = read("server/v3/modules/billing/routes.ts");
  const v3Parlays = read("server/v3/modules/parlays/routes.ts");
  const v3ParlaySupport = read("server/v3/modules/parlays/supportRoutes.ts");
  const sharedParlaySupport = read("server/routes/parlay/mountParlaySupportRoutes.ts");

  includesAll(v3Routes, [
    'app.use("/api/v3/system", v3SystemRoutes);',
    'app.use("/api/v3/trust", v3TrustRoutes);',
    'app.use("/api/v3/grading", v3GradingRoutes);',
    'app.use("/api/v3/billing", v3BillingRoutes);',
    'app.use("/api/v3", v3ParlayRoutes);',
  ], "V3 route mount table");

  includesAll(v3App, [
    'app.use("/api/v3/billing/webhook", express.raw({ type: "application/json", limit: "1mb" }));',
    'app.use(express.json({ limit: "256kb" }));',
  ], "V3 app middleware");

  includesAll(v3System, [
    '"/health"',
    '"/self-heal"',
    '"/self-heal/run"',
  ], "V3 system routes");

  includesAll(v3Grading, [
    '"/ledger"',
    '"/grade-due"',
    '"/repair-identity"',
    '"/live-hr-sync"',
  ], "V3 grading routes");

  includesAll(v3Trust, [
    '"/user/:userId"',
    '"/capper/:capperId"',
  ], "V3 trust routes");

  includesAll(v3Billing, [
    "export const v3BillingRoutes = Router();",
    "\"/checkout\"",
    "\"/portal\"",
    "\"/status\"",
    "\"/subscription\"",
    "\"/webhook\"",
  ], "V3 billing migration");

  includesAll(v3Parlays, [
    "v3ParlayRoutes.use(v3ParlaySupportRoutes);",
  ], "V3 parlay migration");

  includesAll(v3ParlaySupport, [
    "mountParlaySupportRoutes(Router())",
  ], "V3 parlay support routes");

  includesAll(sharedParlaySupport, [
    "\"/parlays/ai-generate\"",
    "\"/parlays/grade\"",
    "\"/me/dashboard-summary\"",
    "\"/me/ledger\"",
    "\"/parlays/:id/audit\"",
    "\"/parlays/:id/repair-identity\"",
    "\"/parlays/:id/tail\"",
  ], "Shared parlay support routes");

  await runtimeChecks();

  console.log(JSON.stringify({
    ok: true,
    mode: "v3_backend_smoke",
    checkedAt: new Date().toISOString(),
    verified: {
      v3HealthRoute: true,
      v3ProtectedRoutesFailClosed: true,
      v3BillingWebhookRawBodyMounted: true,
      v3SystemMounted: true,
      v3TrustMounted: true,
      v3GradingMounted: true,
      v3BillingMounted: true,
      v3ParlayOwnershipMounted: true,
    },
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
