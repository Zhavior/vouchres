import fs from "node:fs";
import path from "node:path";

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

function main() {
  const handlers = read("server/v3/modules/billing/handlers.ts");
  const v3Routes = read("server/v3/modules/billing/routes.ts");
  const legacyRoutes = read("server/routes/billingRoutes.ts");
  const app = read("server/v3/app.ts");

  includesAll(handlers, [
    "export const BillingCheckoutSchema",
    "export async function sendV3BillingCheckoutResponse",
    "export async function sendV3BillingPortalResponse",
    "export async function sendV3BillingStatusResponse",
    "export async function sendV3BillingWebhookResponse",
    "event: \"stripe.payment_failed\"",
    "event: \"stripe.access_revoked\"",
  ], "billing shared handlers");

  includesAll(v3Routes, [
    "export const v3BillingRoutes = Router();",
    "\"/checkout\"",
    "\"/portal\"",
    "\"/status\"",
    "\"/subscription\"",
    "\"/webhook\"",
    "sendV3BillingCheckoutResponse(req, res, { includeVersion: true })",
    "sendV3BillingPortalResponse(req, res, { includeVersion: true })",
    "sendV3BillingStatusResponse(req, res, { includeVersion: true })",
    "sendV3BillingWebhookResponse(req, res, { includeVersion: true })",
  ], "v3 billing routes");

  includesAll(legacyRoutes, [
    "sendV3BillingCheckoutResponse(req, res)",
    "sendV3BillingPortalResponse(req, res)",
    "sendV3BillingStatusResponse(req, res)",
    "sendV3BillingWebhookResponse(req, res)",
  ], "legacy billing cutover");

  includesAll(app, [
    "app.use(\"/api/v3/billing/webhook\", express.raw({ type: \"application/json\", limit: \"1mb\" }));",
  ], "v3 webhook raw-body mount");

  console.log(JSON.stringify({
    ok: true,
    mode: "billing_cutover_static_verify",
    checkedAt: new Date().toISOString(),
    verified: {
      sharedBillingHandlersExist: true,
      v3BillingRoutesMountedExplicitly: true,
      legacyBillingUsesSharedHandlers: true,
      v3WebhookRawBodyStillMounted: true,
    },
  }, null, 2));
}

main();
