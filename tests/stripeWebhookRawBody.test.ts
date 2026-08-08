import express from "express";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { STRIPE_WEBHOOK_RAW_PATHS } from "../server/middleware/webhookRaw";

/**
 * Stripe signature verification needs the RAW request body. If express.json()
 * parses it first, `stripe.webhooks.constructEvent` rejects every delivery with
 * "Webhook payload must be provided as a string or a Buffer".
 *
 * That failure is invisible from the outside: a parsed body and a genuinely bad
 * signature both surface as `400 invalid_signature`, because the handler wraps
 * constructEvent in one try/catch. So asserting on the HTTP status proves
 * nothing — these tests assert on the body TYPE the handler actually receives.
 */

function appWithWebhookRawBody() {
  const app = express();
  // Same two lines, same order, as createApiApp and createV3App.
  app.use([...STRIPE_WEBHOOK_RAW_PATHS], express.raw({ type: "application/json", limit: "1mb" }));
  app.use(express.json({ limit: "256kb" }));

  // Express 4 wildcard syntax (this project pins express@4).
  app.post("*", (req, res) => {
    res.json({
      isBuffer: Buffer.isBuffer(req.body),
      raw: Buffer.isBuffer(req.body) ? req.body.toString("utf8") : null,
    });
  });
  return app;
}

async function postJson(app: express.Express, url: string, payload: string) {
  const server = app.listen(0);
  try {
    const { port } = server.address() as { port: number };
    const res = await fetch(`http://127.0.0.1:${port}${url}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: payload,
    });
    return (await res.json()) as { isBuffer: boolean; raw: string | null };
  } finally {
    server.close();
  }
}

describe("Stripe webhook raw body", () => {
  const payload = JSON.stringify({ id: "evt_test", type: "checkout.session.completed" });

  it.each([...STRIPE_WEBHOOK_RAW_PATHS])(
    "delivers an unparsed Buffer to %s",
    async (webhookPath) => {
      const body = await postJson(appWithWebhookRawBody(), webhookPath, payload);
      expect(body.isBuffer).toBe(true);
      // Byte-identical to what Stripe signed — any re-serialisation breaks HMAC.
      expect(body.raw).toBe(payload);
    },
  );

  it("still parses JSON on every other route", async () => {
    const body = await postJson(appWithWebhookRawBody(), "/api/parlays/save", payload);
    expect(body.isBuffer).toBe(false);
  });

  it("covers /api/v3/billing/webhook", () => {
    // Regression guard for the original defect: this path was mounted in
    // createV3App only, so production (createApiApp) JSON-parsed it and every
    // Stripe delivery 400'd forever — silently never granting or revoking tiers.
    expect(STRIPE_WEBHOOK_RAW_PATHS).toContain("/api/v3/billing/webhook");
  });

  it("covers every webhook route registered in the codebase", () => {
    // Derives the expected set from the routers rather than asserting a literal,
    // so adding a webhook route without listing it in STRIPE_WEBHOOK_RAW_PATHS
    // fails here instead of in production.
    const roots = ["server/routes", "server/v3/modules"];
    const mounts: Array<{ prefix: string; file: string }> = [
      { prefix: "/api/billing", file: "server/routes/billingRoutes.ts" },
      { prefix: "/api/v3/billing", file: "server/v3/modules/billing/routes.ts" },
    ];

    const found = new Set<string>();
    for (const { prefix, file } of mounts) {
      const src = readFileSync(path.join(process.cwd(), file), "utf8");
      for (const match of src.matchAll(/\.post\(\s*["'`](\/[^"'`]*webhook[^"'`]*)["'`]/g)) {
        found.add(`${prefix}${match[1]}`.replace(/\/$/, ""));
      }
    }

    // Sanity: the scan must actually find something, or this test is vacuous.
    expect(found.size).toBeGreaterThan(0);
    expect(roots.length).toBeGreaterThan(0);

    for (const routePath of found) {
      expect(
        STRIPE_WEBHOOK_RAW_PATHS,
        `${routePath} registers a Stripe webhook but is missing from STRIPE_WEBHOOK_RAW_PATHS, so express.json() will consume its body and signature verification will fail permanently`,
      ).toContain(routePath);
    }
  });

  it("lists no path that is not actually served", () => {
    // The alias /api/stripe/webhook is mounted in server/routes/index.ts.
    const indexSrc = readFileSync(path.join(process.cwd(), "server/routes/index.ts"), "utf8");
    const billingSrc = readFileSync(path.join(process.cwd(), "server/routes/billingRoutes.ts"), "utf8");
    const v3Src = readFileSync(path.join(process.cwd(), "server/v3/modules/billing/routes.ts"), "utf8");
    const all = `${indexSrc}\n${billingSrc}\n${v3Src}`;

    for (const routePath of STRIPE_WEBHOOK_RAW_PATHS) {
      const tail = routePath.replace(/^\/api\/(v3\/)?/, "");
      expect(all, `${routePath} is in STRIPE_WEBHOOK_RAW_PATHS but no router appears to serve it`)
        .toMatch(new RegExp(tail.split("/").pop() ?? "webhook"));
    }
  });
});
