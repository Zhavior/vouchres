import fs from "node:fs";
import path from "node:path";
import {
  getStripePriceMatrix,
  getTierCustomizationPoints,
  isActiveTier,
} from "../server/services/billing/tierConfig";

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

const server = read("server.ts");
const billingRoutes = read("server/routes/billingRoutes.ts");
const stripeService = read("server/services/billing/stripeService.ts");
const tierConfig = read("server/services/billing/tierConfig.ts");
const migration = read("supabase/migrations/0011_stripe_webhook_events.sql");

process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "sk_test_verify_billing_hardening";
const { effectiveTierForSubscriptionStatus, getStripePriceConfigs } = await import(
  "../server/services/billing/stripeService"
);

includesAll(server, [
  "app.use(\"/api/billing/webhook\", express.raw({ type: \"application/json\", limit: \"1mb\" }))",
  "app.use(express.json())",
], "raw body webhook mount");
assert(
  server.indexOf("express.raw({ type: \"application/json\"") < server.indexOf("app.use(express.json())"),
  "Stripe webhook raw body middleware must be mounted before express.json"
);

includesAll(billingRoutes, [
  "const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? \"\"",
  "stripe.webhooks.constructEvent",
  "beginStripeWebhookEvent(event)",
  "finishStripeWebhookEvent(event.id, \"processed\")",
  "finishStripeWebhookEvent(event.id, \"failed\"",
  "duplicate: true",
  "billingRoutes.get(\"/subscription\", requireAuth, billingStatusHandler)",
  ".eq(\"profile_id\", req.user!.id)",
  "tier: z.enum([\"pro\", \"creator\"])",
], "billing route hardening");

includesAll(stripeService, [
  "getStripePriceConfigs",
  "beginStripeWebhookEvent",
  "stripe_webhook_events",
  "status === \"failed\"",
  "duplicate webhook skipped",
  "effectiveTierForSubscriptionStatus",
  "PAID_SUBSCRIPTION_STATUSES",
  "SAFE_DOWNGRADE_STATUSES",
], "stripe service hardening");

includesAll(migration, [
  "create table if not exists public.stripe_webhook_events",
  "id text primary key",
  "status text not null default 'processing'",
  "check (status in ('processing', 'processed', 'failed'))",
  "alter table public.stripe_webhook_events enable row level security",
  "No client policies",
], "stripe webhook event migration");

includesAll(tierConfig, [
  "free",
  "pro",
  "creator",
  "STRIPE_${tier.toUpperCase()}_${interval.toUpperCase()}_PRICE_ID",
  "STRIPE_PRO_MONTHLY_PRICE_ID",
  "STRIPE_PRO_YEARLY_PRICE_ID",
  "STRIPE_CREATOR_MONTHLY_PRICE_ID",
  "STRIPE_CREATOR_YEARLY_PRICE_ID",
], "tier and price config");

assert(isActiveTier("free"), "free must be an active tier");
assert(isActiveTier("pro"), "pro must be an active tier");
assert(isActiveTier("creator"), "creator must be an active tier");
assert(!isActiveTier("elite"), "elite must not be an active tier");
assert(getTierCustomizationPoints("elite") === 0, "elite must not grant points");

assert(effectiveTierForSubscriptionStatus("active", "gold").tier === "gold", "active should grant paid tier");
assert(effectiveTierForSubscriptionStatus("trialing", "seller_pro").tier === "seller_pro", "trialing should grant paid tier");
for (const status of ["past_due", "unpaid", "canceled", "incomplete", "incomplete_expired", "paused"]) {
  const out = effectiveTierForSubscriptionStatus(status, "gold");
  assert(out.tier === "free", `${status} should downgrade to free`);
  assert(out.warning, `${status} should return a warning`);
}
const unknown = effectiveTierForSubscriptionStatus("mystery_status", "seller_pro");
assert(unknown.tier === "free" && unknown.warning, "unknown statuses should safely downgrade with warning");

const envNames = [
  "STRIPE_PRO_MONTHLY_PRICE_ID",
  "STRIPE_PRO_YEARLY_PRICE_ID",
  "STRIPE_CREATOR_MONTHLY_PRICE_ID",
  "STRIPE_CREATOR_YEARLY_PRICE_ID",
];
for (const envName of envNames) process.env[envName] = `price_verify_${envName.toLowerCase()}`;
const matrix = getStripePriceMatrix();
assert(matrix.pro.monthly === process.env.STRIPE_PRO_MONTHLY_PRICE_ID, "pro monthly env mapping failed");
assert(matrix.pro.yearly === process.env.STRIPE_PRO_YEARLY_PRICE_ID, "pro yearly env mapping failed");
assert(matrix.creator.monthly === process.env.STRIPE_CREATOR_MONTHLY_PRICE_ID, "creator monthly env mapping failed");
assert(matrix.creator.yearly === process.env.STRIPE_CREATOR_YEARLY_PRICE_ID, "creator yearly env mapping failed");
const configs = getStripePriceConfigs();
assert(configs.length === 4, "expected four supported Stripe price configs");
assert(configs.every((config) => config.tier === "pro" || config.tier === "creator"), "unsupported Stripe tier config found");

console.log(
  JSON.stringify(
    {
      ok: true,
      checks: {
        rawBodyBeforeJson: true,
        webhookSecretSignatureVerification: true,
        processedEventLedger: true,
        duplicateWebhookIdempotency: true,
        supportedTiers: ["free", "pro", "creator"],
        stripePriceEnvMapping: envNames,
        safeStatusDowngrade: true,
        subscriptionScopedByAuthenticatedUser: true,
      },
      warnings: [
        "Verification is source-level and unit-level; apply migration 0011_stripe_webhook_events.sql before production webhook traffic.",
      ],
    },
    null,
    2
  )
);
