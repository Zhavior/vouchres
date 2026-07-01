import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

type RouteCheck = {
  path: string;
  expressSource: string;
  vercelFile: string;
  requiresAuth: boolean;
  expectedUnauthStatus: number;
  expectedKeys: string[];
  warningsExpected?: boolean;
};

const root = process.cwd();
dotenv.config({ path: path.join(root, ".env") });
dotenv.config({ path: path.join(root, ".env.local"), override: true });
const baseUrl = (process.env.VOUCH_EDGE_API_BASE_URL || process.env.VERCEL_API_BASE_URL || "").replace(/\/$/, "");
const token = process.env.VOUCH_EDGE_TEST_ACCESS_TOKEN || "";

const routes: RouteCheck[] = [
  { path: "/api/health", expressSource: "server/routes/index.ts", vercelFile: "api/health.ts", requiresAuth: false, expectedUnauthStatus: 200, expectedKeys: ["ok", "checks", "warnings"], warningsExpected: true },
  { path: "/api/mlb/games/today", expressSource: "server/routes/mlbRoutes.ts", vercelFile: "api/mlb/games/today.ts", requiresAuth: false, expectedUnauthStatus: 200, expectedKeys: ["games", "warnings"], warningsExpected: true },
  { path: "/api/mlb/scores/today", expressSource: "server/routes/mlbMatchupRoutes.ts", vercelFile: "api/mlb/scores/today.ts", requiresAuth: false, expectedUnauthStatus: 200, expectedKeys: ["scores", "warnings"], warningsExpected: true },
  { path: "/api/mlb/lineup/today", expressSource: "server/routes/mlbRoutes.ts", vercelFile: "api/mlb/lineup/today.ts", requiresAuth: false, expectedUnauthStatus: 200, expectedKeys: ["games", "warnings"], warningsExpected: true },
  { path: "/api/mlb/matchup-matrix", expressSource: "server/routes/mlbMatchupRoutes.ts", vercelFile: "api/mlb/matchup-matrix.ts", requiresAuth: false, expectedUnauthStatus: 200, expectedKeys: ["rows", "warnings"], warningsExpected: true },
  { path: "/api/mlb/matchup-matrix/live", expressSource: "server/routes/mlbMatchupRoutes.ts", vercelFile: "api/mlb/matchup-matrix/live.ts", requiresAuth: false, expectedUnauthStatus: 200, expectedKeys: ["rows", "warnings"], warningsExpected: true },
  { path: "/api/feed/composer-options", expressSource: "server/routes/feedRoutes.ts", vercelFile: "api/feed/composer-options.ts", requiresAuth: false, expectedUnauthStatus: 200, expectedKeys: ["games", "markets", "warnings"], warningsExpected: true },
  { path: "/api/me/parlays", expressSource: "server/routes/parlayRoutes.ts", vercelFile: "api/me/parlays.ts", requiresAuth: true, expectedUnauthStatus: 401, expectedKeys: ["error", "warnings"], warningsExpected: true },
  { path: "/api/me/dashboard-summary", expressSource: "server/routes/parlayRoutes.ts", vercelFile: "api/me/dashboard-summary.ts", requiresAuth: true, expectedUnauthStatus: 401, expectedKeys: ["error", "warnings"], warningsExpected: true },
  { path: "/api/billing/subscription", expressSource: "server/routes/billingRoutes.ts", vercelFile: "api/billing/subscription.ts", requiresAuth: true, expectedUnauthStatus: 401, expectedKeys: ["error", "warnings"], warningsExpected: true },
  { path: "/api/billing/status", expressSource: "server/routes/billingRoutes.ts", vercelFile: "api/billing/status.ts", requiresAuth: true, expectedUnauthStatus: 401, expectedKeys: ["error", "warnings"], warningsExpected: true },
  { path: "/api/notifications", expressSource: "server/routes/notificationRoutes.ts", vercelFile: "api/notifications.ts", requiresAuth: true, expectedUnauthStatus: 401, expectedKeys: ["notifications", "unreadCount", "warnings"], warningsExpected: true },
  { path: "/api/notifications/unread-count", expressSource: "server/routes/notificationRoutes.ts", vercelFile: "api/notifications/unread-count.ts", requiresAuth: true, expectedUnauthStatus: 401, expectedKeys: ["notifications", "unreadCount", "warnings"], warningsExpected: true },
  { path: "/api/results/ledger", expressSource: "server/routes/resultRoutes.ts", vercelFile: "api/results/ledger.ts", requiresAuth: true, expectedUnauthStatus: 401, expectedKeys: ["scope", "picks", "warnings"], warningsExpected: true },
];

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function exists(relativePath: string): boolean {
  return fs.existsSync(path.join(root, relativePath));
}

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

function routePathInSource(routePath: string, source: string): boolean {
  const localPath = routePath.replace(/^\/api/, "") || "/";
  const billingRouterPath = routePath.startsWith("/api/billing/")
    ? routePath.replace(/^\/api\/billing/, "") || "/"
    : null;
  return (
    source.includes(routePath) ||
    source.includes(`"${localPath}"`) ||
    source.includes(`'${localPath}'`) ||
    (billingRouterPath
      ? source.includes(`"${billingRouterPath}"`) || source.includes(`'${billingRouterPath}'`)
      : false)
  );
}

function handlerPathFor(route: RouteCheck): string {
  return `../${route.vercelFile}`;
}

async function invokeDirect(route: RouteCheck, authToken?: string): Promise<{ status: number; body: any; contentType: string }> {
  const mod = await import(handlerPathFor(route));
  let status = 200;
  let body: any = undefined;
  const headers: Record<string, string> = {};
  if (authToken) headers.authorization = `Bearer ${authToken}`;
  const url = new URL(`https://local.test${route.path}`);
  const req: any = {
    method: "GET",
    query: Object.fromEntries(url.searchParams),
    headers,
    url: route.path,
  };
  const res: any = {
    status(n: number) {
      status = n;
      return this;
    },
    json(payload: any) {
      body = payload;
      return this;
    },
    send(payload: any) {
      body = payload;
      return this;
    },
    setHeader() {
      return this;
    },
  };
  await mod.default(req, res);
  return { status, body, contentType: "application/json" };
}

async function fetchRoute(route: RouteCheck, authToken?: string): Promise<{ status: number; body: any; contentType: string }> {
  if (!baseUrl) return invokeDirect(route, authToken);
  const headers: Record<string, string> = {};
  if (authToken) headers.authorization = `Bearer ${authToken}`;
  const response = await fetch(`${baseUrl}${route.path}`, { headers });
  const contentType = response.headers.get("content-type") ?? "";
  const text = await response.text();
  let body: any;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = text;
  }
  return { status: response.status, body, contentType };
}

function assertJsonResponse(route: RouteCheck, result: { status: number; body: any; contentType: string }) {
  assert(typeof result.body === "object" && result.body !== null && !Array.isArray(result.body), `${route.path} returned non-JSON or HTML response`);
  assert(!String(result.body).toLowerCase().includes("<html"), `${route.path} returned an HTML page`);
  for (const key of route.expectedKeys) {
    assert(Object.prototype.hasOwnProperty.call(result.body, key), `${route.path} missing response key ${key}`);
  }
  if (route.warningsExpected) {
    assert(Array.isArray(result.body.warnings), `${route.path} must include warnings array`);
  }
}

const missingProductionHandlers: string[] = [];
const missingExpressRoutes: string[] = [];
for (const route of routes) {
  if (!exists(route.vercelFile)) missingProductionHandlers.push(`${route.path} -> ${route.vercelFile}`);
  const source = read(route.expressSource);
  if (!routePathInSource(route.path, source)) missingExpressRoutes.push(`${route.path} -> ${route.expressSource}`);
}

const envChecks = {
  SUPABASE_URL: Boolean(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL),
  SUPABASE_ANON_KEY: Boolean(process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY),
  SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  STRIPE_SECRET_KEY: Boolean(process.env.STRIPE_SECRET_KEY),
  STRIPE_WEBHOOK_SECRET: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
  STRIPE_PRO_MONTHLY_PRICE_ID: Boolean(process.env.STRIPE_PRO_MONTHLY_PRICE_ID),
  STRIPE_PRO_YEARLY_PRICE_ID: Boolean(process.env.STRIPE_PRO_YEARLY_PRICE_ID),
  STRIPE_CREATOR_MONTHLY_PRICE_ID: Boolean(process.env.STRIPE_CREATOR_MONTHLY_PRICE_ID),
  STRIPE_CREATOR_YEARLY_PRICE_ID: Boolean(process.env.STRIPE_CREATOR_YEARLY_PRICE_ID),
};

assert(missingProductionHandlers.length === 0, `Missing production handlers:\n${missingProductionHandlers.join("\n")}`);

const unauthResults: Array<{ path: string; status: number }> = [];
for (const route of routes) {
  const result = await fetchRoute(route);
  unauthResults.push({ path: route.path, status: result.status });
  assert(result.status === route.expectedUnauthStatus, `${route.path} expected unauth ${route.expectedUnauthStatus}, got ${result.status}`);
  assertJsonResponse(route, result);
}

const authenticatedResults: Array<{ path: string; status: number; skipped?: boolean }> = [];
const authWarnings: string[] = [];
if (!token) {
  authWarnings.push("VOUCH_EDGE_TEST_ACCESS_TOKEN missing; authenticated production smoke checks skipped.");
} else {
  for (const route of routes.filter((item) => item.requiresAuth)) {
    const result = await fetchRoute(route, token);
    authenticatedResults.push({ path: route.path, status: result.status });
    assert(result.status === 200, `${route.path} expected authenticated 200, got ${result.status}`);
    assertJsonResponse({ ...route, expectedKeys: route.path === "/api/results/ledger" ? ["scope", "picks", "warnings"] : route.expectedKeys.filter((key) => key !== "error") }, result);
    if (route.path === "/api/results/ledger") {
      assert(result.body.scope === "current_user", "/api/results/ledger must be scoped to current_user");
    }
  }
}

const envWarnings = Object.entries(envChecks)
  .filter(([, ok]) => !ok)
  .map(([key]) => `${key} is not configured in this runtime.`);

console.log(
  JSON.stringify(
    {
      ok: true,
      mode: baseUrl ? "remote_base_url" : "direct_vercel_handlers",
      baseUrl: baseUrl || null,
      routeInventory: {
        checked: routes.length,
        missingProductionHandlers,
        missingExpressRoutes,
      },
      unauthenticated: unauthResults,
      authenticated: token ? authenticatedResults : [],
      envDiagnostics: envChecks,
      warnings: [...authWarnings, ...envWarnings],
    },
    null,
    2
  )
);
