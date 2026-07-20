import http from "node:http";

export type LegacyParlayCanaryConfig = {
  disabledLabel: "legacy.parlay.detail" | "legacy.parlay.list" | "legacy.parlay.save" | "legacy.parlay.commit_trust" | "legacy.parlay.finalize_trust_lock";
  legacyDisabledPath: string;
  legacyStillLivePath: string;
  v3UnaffectedPath: string;
  legacyDisabledMethod?: "GET" | "POST";
  legacyStillLiveMethod?: "GET" | "POST";
  v3UnaffectedMethod?: "GET" | "POST";
  expectedV3Status?: number;
  mode: string;
  successFlags: Record<string, boolean>;
};

async function loadLegacyApp() {
  process.env.VERCEL = "1";
  process.env.NODE_ENV = "development";
  const { createApp } = await import("../server");
  const httpServer = http.createServer();
  const app = await createApp(httpServer);
  return http.createServer(app);
}

async function loadV3App() {
  process.env.VERCEL = "1";
  process.env.NODE_ENV = "development";
  const { createV3App } = await import("../server/v3/app");
  return http.createServer(createV3App());
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

async function fetchJson(baseUrl: string, routePath: string, method: "GET" | "POST" = "GET") {
  const response = await fetch(`${baseUrl}${routePath}`, {
    method,
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

export async function runLegacyParlayCutoffCanary(config: LegacyParlayCanaryConfig): Promise<void> {
  process.env.DISABLE_LEGACY_CANONICAL_PARLAY_ROUTE_LABELS = config.disabledLabel;

  const legacyServer = await loadLegacyApp();
  const legacyPort = await listen(legacyServer);
  const legacyBaseUrl = `http://127.0.0.1:${legacyPort}`;

  const v3Server = await loadV3App();
  const v3Port = await listen(v3Server);
  const v3BaseUrl = `http://127.0.0.1:${v3Port}`;

  try {
    const legacyDisabled = await fetchJson(legacyBaseUrl, config.legacyDisabledPath, config.legacyDisabledMethod ?? "GET");
    const legacyStillLive = await fetchJson(legacyBaseUrl, config.legacyStillLivePath, config.legacyStillLiveMethod ?? "GET");
    const v3Unaffected = await fetchJson(v3BaseUrl, config.v3UnaffectedPath, config.v3UnaffectedMethod ?? "GET");

    const checks = [
      {
        name: `${config.disabledLabel} disabled`,
        ok: legacyDisabled.response.status === 410,
        detail: `status ${legacyDisabled.response.status}`,
      },
      {
        name: "other legacy route remains live",
        ok: legacyStillLive.response.status === 401,
        detail: `status ${legacyStillLive.response.status}`,
      },
      {
        name: "v3 route unaffected",
        ok: v3Unaffected.response.status === (config.expectedV3Status ?? 401),
        detail: `status ${v3Unaffected.response.status}`,
      },
    ];

    for (const check of checks) {
      console.log(`${check.ok ? "PASS" : "FAIL"} · ${check.name} · ${check.detail}`);
    }

    const failed = checks.filter((check) => !check.ok);
    if (failed.length > 0) {
      throw new Error(`${config.disabledLabel} cutoff canary failed (${failed.length}/${checks.length})`);
    }

    console.log(JSON.stringify({
      ok: true,
      mode: config.mode,
      checkedAt: new Date().toISOString(),
      verified: config.successFlags,
    }, null, 2));
  } finally {
    await new Promise<void>((resolve, reject) => {
      legacyServer.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
    await new Promise<void>((resolve, reject) => {
      v3Server.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }
}
