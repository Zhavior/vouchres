import { readFileSync } from "node:fs";
import { join } from "node:path";
import express from "express";
import { describe, expect, it, vi } from "vitest";
import { registerApiRoutes } from "../server/routes";

/**
 * Guard: every mounted Stripe webhook path must receive a raw body.
 *
 * `constructEvent` verifies the signature against the exact bytes Stripe sent
 * (handlers.ts casts `req.body` to `string | Buffer`). If `express.json()` gets
 * there first, the body arrives parsed and verification fails for every event.
 *
 * This regressed silently: bootstrap.ts registers `express.raw` for
 * /api/billing/webhook and /api/stripe/webhook, while registerV3Routes mounts
 * /api/v3/billing/webhook on the same app. The raw-body registration covering
 * the v3 path lives only in server/v3/app.ts, which is never deployed —
 * createV3App is unreferenced outside its own module.
 *
 * Latent today because PAYMENTS_ENABLED defaults to !isFreeBetaActive() and the
 * free beta is on, so webhook processing is off. It would surface the moment
 * payments are enabled, as every webhook failing signature verification.
 */

function mountedWebhookPaths(): string[] {
  vi.stubEnv("CRON_SECRET", "test-cron-secret");
  const app = express();
  registerApiRoutes(app);

  const paths: string[] = [];
  const visit = (stack: any[], prefix: string) => {
    for (const layer of stack ?? []) {
      if (layer.route?.path !== undefined) {
        const routePaths = Array.isArray(layer.route.path) ? layer.route.path : [layer.route.path];
        for (const p of routePaths) paths.push(`${prefix}${p}`);
        continue;
      }
      if (layer.name === "router" && layer.handle?.stack) {
        const source: string = layer.regexp?.source ?? "";
        const literal =
          source === "^\\/?(?=\\/|$)"
            ? ""
            : source
                .replace(/^\^/, "")
                .replace(/\\\/\?\(\?=\\\/\|\$\)$/, "")
                .replace(/\\\//g, "/")
                .replace(/\$$/, "");
        visit(layer.handle.stack, prefix + (/^[/\w.-]*$/.test(literal) ? literal : ""));
      }
    }
  };
  visit((app as any)._router?.stack ?? (app as any).router?.stack, "");

  return paths
    .map((p) => p.replace(/\/+/g, "/").replace(/\/$/, ""))
    .filter((p) => p.endsWith("/webhook"));
}

/** Paths passed to express.raw in the deployed app factory. */
function rawBodyPaths(): string[] {
  const source = readFileSync(join(__dirname, "..", "server", "api", "bootstrap.ts"), "utf8");
  const block = source.slice(source.indexOf("express.raw") - 400, source.indexOf("express.raw") + 200);
  return [...block.matchAll(/["'](\/api\/[^"']*webhook)["']/g)].map((m) => m[1]);
}

describe("stripe webhook raw-body coverage", () => {
  it("every mounted webhook route is registered for a raw body", () => {
    const mounted = mountedWebhookPaths();
    const raw = new Set(rawBodyPaths());

    expect(mounted.length).toBeGreaterThan(0);

    const unprotected = mounted.filter((p) => !raw.has(p));
    expect(
      unprotected,
      unprotected.length
        ? `Webhook route(s) parsed as JSON before Stripe can verify the signature: ${unprotected.join(", ")}. ` +
          `Add them to the express.raw path list in server/api/bootstrap.ts.`
        : undefined,
    ).toEqual([]);
  });
});
