import Stripe from "stripe";
import { getSupabaseAdmin } from "../../middleware/auth";
import {
  DATABASE_TIER_BY_CANONICAL,
  getStripePriceId,
  type DatabaseTier,
  type PaidCanonicalTier,
  type BillingInterval,
} from "./tierConfig";

/**
 * Stripe service — manages customers, checkout sessions, and syncs
 * subscription state to public.profiles and public.subscriptions.
 *
 * The Stripe dashboard is the source of truth. We mirror state to Postgres
 * via webhooks so the server can do fast synchronous entitlement checks
 * without calling Stripe on every request.
 */

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2024-12-18.acacia" as any,
  typescript: true,
});

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

function assertStripeConfigured() {
  if (!isStripeConfigured()) {
    throw new Error("stripe_secret_key_not_configured");
  }
}

/**
 * Price IDs per tier. Configure in Stripe dashboard, then paste IDs here
 * (or load from env). These are product/price IDs, not plan IDs.
 */
export interface StripePriceConfig {
  tier: PaidCanonicalTier;
  databaseTier: Exclude<DatabaseTier, "free">;
  interval: BillingInterval;
  priceId: string;
}

const PAID_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);
const SAFE_DOWNGRADE_STATUSES = new Set([
  "past_due",
  "unpaid",
  "canceled",
  "incomplete",
  "incomplete_expired",
  "paused",
]);

export function getStripePriceConfigs(): StripePriceConfig[] {
  const configs: StripePriceConfig[] = [];
  for (const tier of ["pro", "creator"] as const) {
    for (const interval of ["monthly", "yearly"] as const) {
      const priceId = getStripePriceId(tier, interval);
      if (priceId) {
        configs.push({
          tier,
          databaseTier: DATABASE_TIER_BY_CANONICAL[tier] as Exclude<DatabaseTier, "free">,
          interval,
          priceId,
        });
      }
    }
  }
  return configs;
}

export function stripePriceConfigByPriceId(priceId: string): StripePriceConfig | null {
  return getStripePriceConfigs().find((config) => config.priceId === priceId) ?? null;
}

/**
 * Create or reuse a Stripe customer for a profile.
 */
export async function ensureStripeCustomer(profileId: string, email: string) {
  assertStripeConfigured();
  const supabaseAdmin = await getSupabaseAdmin();
  // Check if profile already has a stripe_customer_id
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", profileId)
    .single();

  if (profile?.stripe_customer_id) {
    try {
      const existing = await stripe.customers.retrieve(profile.stripe_customer_id);
      if (!existing.deleted) return existing;
    } catch (err) {
      // Customer was deleted in Stripe dashboard — fall through to create
    }
  }

  const customer = await stripe.customers.create({
    email,
    metadata: { profile_id: profileId },
  });

  await supabaseAdmin
    .from("profiles")
    .update({ stripe_customer_id: customer.id })
    .eq("id", profileId);

  return customer;
}

/**
 * Create a Checkout Session for upgrading to a paid tier.
 * Use `mode: "subscription"` for recurring billing.
 */
export async function createCheckoutSession(opts: {
  profileId: string;
  email: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}) {
  assertStripeConfigured();
  const customer = (await ensureStripeCustomer(opts.profileId, opts.email)) as Stripe.Customer;

  return stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customer.id,
    line_items: [{ price: opts.priceId, quantity: 1 }],
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
    client_reference_id: opts.profileId,
    metadata: {
      profile_id: opts.profileId,
      target_tier: stripePriceConfigByPriceId(opts.priceId)?.tier ?? "unknown",
    },
    subscription_data: {
      metadata: {
        profile_id: opts.profileId,
        target_tier: stripePriceConfigByPriceId(opts.priceId)?.tier ?? "unknown",
      },
    },
    allow_promotion_codes: true,
  });
}

/**
 * Create a Billing Portal session — lets users manage their subscription
 * (upgrade, downgrade, cancel, update payment method).
 */
export async function createPortalSession(opts: {
  profileId: string;
  email?: string;
  returnUrl: string;
}) {
  assertStripeConfigured();
  const supabaseAdmin = await getSupabaseAdmin();
  const { data: profile, error: profileErr } = await supabaseAdmin
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", opts.profileId)
    .single();

  if (profileErr) {
    console.error("[stripe] profile lookup failed:", profileErr.message);
  }

  const customerId = profile?.stripe_customer_id
    ? profile.stripe_customer_id
    : ((await ensureStripeCustomer(opts.profileId, opts.email ?? "")) as Stripe.Customer).id;

  try {
    return await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: opts.returnUrl,
    });
  } catch (err: any) {
    // Detect the most common setup mistake: portal not configured in Stripe Dashboard.
    const msg: string = err?.message ?? "";
    if (
      err?.type === "StripeInvalidRequestError" &&
      (err?.code === "no_default_portal_configuration" ||
        msg.toLowerCase().includes("no default configuration") ||
        msg.toLowerCase().includes("no configuration was provided"))
    ) {
      const cfg = new Error("billing_portal_not_configured") as Error & { stripeRaw?: unknown };
      cfg.stripeRaw = err;
      throw cfg;
    }
    throw err;
  }
}

/**
 * Map a Stripe Price ID to a tier.
 */
export function tierFromPriceId(priceId: string): Exclude<DatabaseTier, "free"> | null {
  return stripePriceConfigByPriceId(priceId)?.databaseTier ?? null;
}

export function effectiveTierForSubscriptionStatus(
  status: string,
  paidTier: Exclude<DatabaseTier, "free">
): { tier: DatabaseTier; warning: string | null } {
  if (PAID_SUBSCRIPTION_STATUSES.has(status)) {
    return { tier: paidTier, warning: null };
  }
  if (SAFE_DOWNGRADE_STATUSES.has(status)) {
    return { tier: "free", warning: `subscription status ${status} does not grant paid entitlements` };
  }
  return { tier: "free", warning: `unknown subscription status ${status}; defaulted entitlements to free` };
}

export async function beginStripeWebhookEvent(event: Stripe.Event): Promise<{
  shouldProcess: boolean;
  duplicate: boolean;
  status?: string;
}> {
  const supabaseAdmin = await getSupabaseAdmin();
  const now = new Date().toISOString();
  const { error } = await supabaseAdmin.from("stripe_webhook_events").insert({
    id: event.id,
    type: event.type,
    status: "processing",
    received_at: now,
  });

  if (!error) return { shouldProcess: true, duplicate: false, status: "processing" };

  if (error.code !== "23505") {
    console.warn("[stripe] webhook idempotency insert failed", error.message);
    throw error;
  }

  const { data, error: lookupError } = await supabaseAdmin
    .from("stripe_webhook_events")
    .select("status")
    .eq("id", event.id)
    .maybeSingle();
  if (lookupError) throw lookupError;

  if (data?.status === "failed") {
    const retry = await supabaseAdmin
      .from("stripe_webhook_events")
      .update({ status: "processing", type: event.type, last_error: null, received_at: now })
      .eq("id", event.id)
      .eq("status", "failed");
    if (retry.error) throw retry.error;
    return { shouldProcess: true, duplicate: true, status: "processing" };
  }

  console.log(`[stripe] duplicate webhook skipped event=${event.id} status=${data?.status ?? "unknown"}`);
  return { shouldProcess: false, duplicate: true, status: data?.status ?? "unknown" };
}

export async function finishStripeWebhookEvent(eventId: string, status: "processed" | "failed", errorMessage?: string): Promise<void> {
  const supabaseAdmin = await getSupabaseAdmin();
  const { error } = await supabaseAdmin
    .from("stripe_webhook_events")
    .update({
      status,
      processed_at: status === "processed" ? new Date().toISOString() : null,
      last_error: errorMessage ?? null,
    })
    .eq("id", eventId);
  if (error) {
    console.warn(`[stripe] webhook event finalization failed event=${eventId}`, error.message);
  }
}

/**
 * Sync subscription state to Postgres.
 * Called from the webhook handler on every subscription event.
 */
export async function syncSubscription(subscription: Stripe.Subscription) {
  assertStripeConfigured();
  const supabaseAdmin = await getSupabaseAdmin();
  let profileId = subscription.metadata.profile_id;
  if (!profileId) {
    const { data: existing } = await supabaseAdmin
      .from("subscriptions")
      .select("profile_id")
      .eq("stripe_subscription_id", subscription.id)
      .maybeSingle();
    profileId = existing?.profile_id ?? "";
  }

  if (!profileId) {
    console.error("[stripe] subscription has no profile_id metadata", subscription.id);
    return;
  }

  const priceId = subscription.items.data[0]?.price?.id;
  const tier = priceId ? tierFromPriceId(priceId) : null;
  if (!tier) {
    console.error("[stripe] could not resolve tier for price", priceId);
    return;
  }

  const status = subscription.status; // 'active' | 'trialing' | 'past_due' | 'canceled' | etc.
  const effective = effectiveTierForSubscriptionStatus(status, tier);

  // Upsert subscription row
  await supabaseAdmin.from("subscriptions").upsert(
    {
      profile_id: profileId,
      stripe_customer_id: subscription.customer as string,
      stripe_subscription_id: subscription.id,
      stripe_price_id: priceId,
      tier,
      status,
      current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
      current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
      cancel_at_period_end: (subscription as any).cancel_at_period_end,
    },
    { onConflict: "stripe_subscription_id" }
  );

  // Update profile tier
  await supabaseAdmin
    .from("profiles")
    .update({
      tier: effective.tier,
      stripe_customer_id: subscription.customer as string,
      stripe_subscription_id: subscription.id,
    })
    .eq("id", profileId);

  console.log(
    `[stripe] synced subscription ${subscription.id} for profile ${profileId}: ${effective.tier} (${status})${effective.warning ? ` warning=${effective.warning}` : ""}`
  );
}
