import http from "node:http";
import express from "express";
import { requestContext } from "../server/middleware/requestContext";
import { routeTiming } from "../server/middleware/routeTiming";
import { helmetMiddleware } from "../server/middleware/cors";
import { apiErrorHandler } from "../server/middleware/errorHandler";
import { apiNotFoundHandler } from "../server/middleware/apiNotFound";
import { registerTrustRoutes } from "../server/routes/trustRoutes";
import { v3TrustRoutes } from "../server/v3/modules/trust/routes";
import { getSupabaseAdmin } from "../server/middleware/auth";

type CompareResult = {
  name: string;
  ok: boolean;
  detail: string;
};

function buildLegacyTrustApp() {
  const app = express();
  app.set("trust proxy", 1);
  app.use(requestContext);
  app.use(routeTiming);
  app.use(helmetMiddleware);
  registerTrustRoutes(app);
  app.use("/api", apiNotFoundHandler);
  app.use(apiErrorHandler);
  return app;
}

function buildV3TrustApp() {
  const app = express();
  app.set("trust proxy", 1);
  app.use(requestContext);
  app.use(routeTiming);
  app.use(helmetMiddleware);
  app.use("/api/v3/trust", v3TrustRoutes);
  app.use("/api", apiNotFoundHandler);
  app.use(apiErrorHandler);
  return app;
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

async function fetchJson(baseUrl: string, routePath: string) {
  const response = await fetch(`${baseUrl}${routePath}`, {
    headers: { Accept: "application/json" },
  });
  const text = await response.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { response, body };
}

function stable(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stable);
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([key]) => key !== "meta" && key !== "version")
    .map(([key, nested]) => [key, stable(nested)] as const)
    .sort(([a], [b]) => a.localeCompare(b));

  return Object.fromEntries(entries);
}

function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(stable(a)) === JSON.stringify(stable(b));
}

async function discoverSubjects(): Promise<{ capperId: string | null; userId: string | null }> {
  const supabaseAdmin = await getSupabaseAdmin();

  const { data: capperRows, error: capperError } = await supabaseAdmin
    .from("trust_scores")
    .select("subject_id")
    .eq("subject_type", "capper")
    .limit(1);

  if (capperError) throw capperError;

  const { data: userRows, error: userError } = await supabaseAdmin
    .from("trust_scores")
    .select("subject_id")
    .eq("subject_type", "user")
    .limit(1);

  if (userError) throw userError;

  let userId = userRows?.[0]?.subject_id ? String(userRows[0].subject_id) : null;

  if (!userId) {
    const { data: pickUsers, error: pickUserError } = await supabaseAdmin
      .from("picks")
      .select("user_id")
      .not("user_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(1);

    if (pickUserError) throw pickUserError;
    userId = pickUsers?.[0]?.user_id ? String(pickUsers[0].user_id) : null;
  }

  return {
    capperId: capperRows?.[0]?.subject_id ? String(capperRows[0].subject_id) : null,
    userId,
  };
}

async function comparePair(input: {
  name: string;
  legacyBaseUrl: string;
  legacyPath: string;
  v3BaseUrl: string;
  v3Path: string;
}): Promise<CompareResult> {
  const [legacy, v3] = await Promise.all([
    fetchJson(input.legacyBaseUrl, input.legacyPath),
    fetchJson(input.v3BaseUrl, input.v3Path),
  ]);

  if (legacy.response.status !== v3.response.status) {
    return {
      name: input.name,
      ok: false,
      detail: `status mismatch legacy=${legacy.response.status} v3=${v3.response.status}`,
    };
  }

  const ok = deepEqual(legacy.body, v3.body);
  return {
    name: input.name,
    ok,
    detail: ok
      ? `matched status ${legacy.response.status}`
      : "body mismatch after normalization",
  };
}

async function main() {
  const checks: CompareResult[] = [];

  if (!process.env.SUPABASE_URL && !process.env.VITE_SUPABASE_URL) {
    console.log(JSON.stringify({
      ok: true,
      mode: "legacy_vs_v3_read_compare",
      runtimeCompared: false,
      warnings: [
        "SUPABASE_URL or VITE_SUPABASE_URL is missing; live compare skipped.",
        "Run again with backend Supabase env vars to compare real trust responses.",
      ],
    }, null, 2));
    return;
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log(JSON.stringify({
      ok: true,
      mode: "legacy_vs_v3_read_compare",
      runtimeCompared: false,
      warnings: [
        "SUPABASE_SERVICE_ROLE_KEY is missing; live compare skipped.",
        "Run again with backend Supabase env vars to compare real trust responses.",
      ],
    }, null, 2));
    return;
  }

  const { capperId, userId } = await discoverSubjects();
  if (!capperId && !userId) {
    throw new Error("No trust subjects found to compare.");
  }

  const legacyServer = http.createServer(buildLegacyTrustApp());
  const v3Server = http.createServer(buildV3TrustApp());
  const legacyPort = await listen(legacyServer);
  const v3Port = await listen(v3Server);
  const legacyBaseUrl = `http://127.0.0.1:${legacyPort}`;
  const v3BaseUrl = `http://127.0.0.1:${v3Port}`;

  try {
    if (capperId) {
      checks.push(await comparePair({
        name: "capper trust + verified record",
        legacyBaseUrl,
        legacyPath: `/api/trust/capper/${capperId}`,
        v3BaseUrl,
        v3Path: `/api/v3/trust/capper/${capperId}`,
      }));
    }

    if (userId) {
      checks.push(await comparePair({
        name: "user trust",
        legacyBaseUrl,
        legacyPath: `/api/trust/user/${userId}`,
        v3BaseUrl,
        v3Path: `/api/v3/trust/user/${userId}`,
      }));
    }
  } finally {
    await Promise.all([
      new Promise<void>((resolve, reject) => legacyServer.close((error) => (error ? reject(error) : resolve()))),
      new Promise<void>((resolve, reject) => v3Server.close((error) => (error ? reject(error) : resolve()))),
    ]);
  }

  for (const check of checks) {
    console.log(`${check.ok ? "PASS" : "FAIL"} · ${check.name} · ${check.detail}`);
  }

  const failed = checks.filter((check) => !check.ok);
  if (failed.length > 0) {
    throw new Error(`Legacy vs V3 read compare failed (${failed.length}/${checks.length})`);
  }

  console.log(JSON.stringify({
    ok: true,
    mode: "legacy_vs_v3_read_compare",
    runtimeCompared: true,
    checkedAt: new Date().toISOString(),
    compared: {
      capperId,
      userId,
      checks: checks.map((check) => check.name),
    },
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
