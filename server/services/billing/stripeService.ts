import Stripe from "stripe";
import { AppError } from "../../errors/AppError";
import { runWithDistributedLock } from "../../lib/distributedLock";
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

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  assertStripeConfigured();

  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!.trim(), {
      apiVersion: "2024-12-18.acacia" as any,
      typescript: true,
    });
  }

  return stripeClient;
}

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

  // Serialize customer ensure so portal/checkout races cannot create orphans.
  return runWithDistributedLock(
    `stripe-customer:${profileId}`,
    async () => {
      const supabaseAdmin = await getSupabaseAdmin();
      // Check if profile already has a stripe_customer_id
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("stripe_customer_id")
        .eq("id", profileId)
        .single();

      if (profile?.stripe_customer_id) {
        try {
          const existing = await getStripe().customers.retrieve(profile.stripe_customer_id);
          if (!existing.deleted) return existing;
        } catch {
          // Customer was deleted in Stripe dashboard — fall through to create
        }
      }

      const customer = await getStripe().customers.create({
        email,
        metadata: { profile_id: profileId },
      });

      await supabaseAdmin
        .from("profiles")
        .update({ stripe_customer_id: customer.id })
        .eq("id", profileId);

      return customer;
    },
    { ttlSeconds: 60, waitMs: 15_000 },
  );
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

  // Serialize checkout creation per profile so concurrent requests cannot
  // race past the active-subscription guard and open two Stripe sessions.
  return runWithDistributedLock(
    `checkout:${opts.profileId}`,
    async () => {
      // Guard against double-subscribing: a user with an already-active (or
      // trialing/past_due) subscription who starts a second checkout would end up
      // paying for two parallel subscriptions. Send them to the billing portal to
      // change plans instead.
      const supabaseAdmin = await getSupabaseAdmin();
      const { data: activeSub } = await supabaseAdmin
        .from("subscriptions")
        .select("stripe_subscription_id, status, tier")
        .eq("profile_id", opts.profileId)
        .in("status", ["active", "trialing", "past_due"])
        .maybeSingle();

      if (activeSub) {
        throw new AppError({
          status: 409,
          code: "conflict",
          message:
            "You already have an active subscription. Manage or change your plan from the billing portal instead of starting a new checkout.",
          expose: true,
          details: { reason: "already_subscribed", currentTier: activeSub.tier, status: activeSub.status },
        });
      }

      const customer = (await ensureStripeCustomer(opts.profileId, opts.email)) as Stripe.Customer;

      return getStripe().checkout.sessions.create({
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
    },
    { ttlSeconds: 60, waitMs: 15_000 },
  );
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
    return await getStripe().billingPortal.sessions.create({
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

export type StripeWebhookLedgerStatus = "queued" | "processing" | "processed" | "failed";

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
    status: "queued",
    payload: event,
    received_at: now,
  });

  if (!error) return { shouldProcess: true, duplicate: false, status: "queued" };

  if (error.code !== "23505") {
    console.warn("[stripe] webhook idempotency insert failed", error.message);
    throw error;
  }

  const { data, error: lookupError } = await supabaseAdmin
    .from("stripe_webhook_events")
    .select("status, received_at")
    .eq("id", event.id)
    .maybeSingle();
  if (lookupError) throw lookupError;

  if (data?.status === "failed") {
    const retry = await supabaseAdmin
      .from("stripe_webhook_events")
      .update({
        status: "queued",
        type: event.type,
        payload: event,
        last_error: null,
        received_at: now,
      })
      .eq("id", event.id)
      .eq("status", "failed");
    if (retry.error) throw retry.error;
    return { shouldProcess: true, duplicate: true, status: "queued" };
  }

  // Crash mid-handler can leave status=processing forever — reclaim after TTL.
  if (data?.status === "processing") {
    const staleMs = Number(process.env.STRIPE_WEBHOOK_STALE_MS ?? 15 * 60_000);
    const receivedAtMs = Date.parse(String(data.received_at ?? ""));
    const isStale = Number.isFinite(receivedAtMs) && Date.now() - receivedAtMs >= staleMs;
    if (isStale) {
      const cutoff = new Date(Date.now() - staleMs).toISOString();
      const retry = await supabaseAdmin
        .from("stripe_webhook_events")
        .update({ status: "processing", type: event.type, last_error: null, received_at: now })
        .eq("id", event.id)
        .eq("status", "processing")
        .lt("received_at", cutoff)
        .select("id");
      if (retry.error) throw retry.error;
      if (!retry.data?.length) {
        console.log(`[stripe] stale processing reclaim lost race event=${event.id}`);
        return { shouldProcess: false, duplicate: true, status: "processing" };
      }
      console.warn(`[stripe] reclaimed stale processing webhook event=${event.id}`);
      return { shouldProcess: true, duplicate: true, status: "processing" };
    }
  }

  console.log(`[stripe] duplicate webhook skipped event=${event.id} status=${data?.status ?? "unknown"}`);
  return { shouldProcess: false, duplicate: true, status: data?.status ?? "unknown" };
}

export async function finishStripeWebhookEvent(
  eventId: string,
  status: "processed" | "failed",
  errorMessage?: string,
): Promise<void> {
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

export interface QueuedStripeWebhookRow {
  id: string;
  type: string;
  payload: Stripe.Event | null;
  attempts: number;
}

/**
 * Claim a batch of queued Stripe webhook events for the entitlement worker.
 * Uses select-then-conditional-update (same pattern as notification_jobs).
 */
export async function claimQueuedStripeWebhookEvents(limit = 25): Promise<QueuedStripeWebhookRow[]> {
  const supabaseAdmin = await getSupabaseAdmin();
  const { data: rows, error: fetchError } = await supabaseAdmin
    .from("stripe_webhook_events")
    .select("id, type, payload, attempts")
    .eq("status", "queued")
    .order("received_at", { ascending: true })
    .limit(limit);

  if (fetchError) {
    if (String(fetchError.code ?? "") === "42P01" || String(fetchError.code ?? "") === "PGRST205") {
      return [];
    }
    console.warn("[stripe] claim queued fetch failed", fetchError.message);
    return [];
  }
  if (!rows || rows.length === 0) return [];

  const ids = rows.map((row) => row.id);
  const { data: claimed, error: claimError } = await supabaseAdmin
    .from("stripe_webhook_events")
    .update({ status: "processing" })
    .in("id", ids)
    .eq("status", "queued")
    .select("id, type, payload, attempts");

  if (claimError || !claimed || claimed.length === 0) return [];
  return claimed.map((row) => ({
    id: String(row.id),
    type: String(row.type),
    payload: (row.payload ?? null) as Stripe.Event | null,
    attempts: Number(row.attempts ?? 0),
  }));
}

export async function bumpStripeWebhookAttempts(eventId: string): Promise<void> {
  const supabaseAdmin = await getSupabaseAdmin();
  const { data } = await supabaseAdmin
    .from("stripe_webhook_events")
    .select("attempts")
    .eq("id", eventId)
    .maybeSingle();
  const next = Number(data?.attempts ?? 0) + 1;
  await supabaseAdmin.from("stripe_webhook_events").update({ attempts: next }).eq("id", eventId);
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
    throw new Error(`[stripe] subscription ${subscription.id} has no profile_id metadata`);
  }

  const priceId = subscription.items.data[0]?.price?.id;
  const tier = priceId ? tierFromPriceId(priceId) : null;
  if (!tier) {
    throw new Error(`[stripe] could not resolve tier for price ${priceId ?? "unknown"} on subscription ${subscription.id}`);
  }

  const status = subscription.status; // 'active' | 'trialing' | 'past_due' | 'canceled' | etc.
  const effective = effectiveTierForSubscriptionStatus(status, tier);

  // Upsert subscription row
  const { error: upsertError } = await supabaseAdmin.from("subscriptions").upsert(
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
  if (upsertError) throw upsertError;

  // Update profile tier
  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .update({
      tier: effective.tier,
      stripe_customer_id: subscription.customer as string,
      stripe_subscription_id: subscription.id,
    })
    .eq("id", profileId);
  if (profileError) throw profileError;

  // Tier changes must invalidate the 30s auth session cache immediately.
  const { bumpAuthUserEpoch } = await import("../../middleware/auth");
  await bumpAuthUserEpoch(profileId);

  console.log(
    `[stripe] synced subscription ${subscription.id} for profile ${profileId}: ${effective.tier} (${status})${effective.warning ? ` warning=${effective.warning}` : ""}`
  );
}

/**
 * Cancel all active Stripe subscriptions for a profile (account deletion schedule).
 * Also downgrades local tier so paid entitlements stop immediately.
 */
export async function cancelSubscriptionsForProfile(profileId: string): Promise<{
  canceled: number;
  warnings: string[];
}> {
  const warnings: string[] = [];
  if (!profileId) return { canceled: 0, warnings: ["missing_profile_id"] };

  const supabaseAdmin = await getSupabaseAdmin();
  const [{ data: subs }, { data: profile }] = await Promise.all([
    supabaseAdmin
      .from("subscriptions")
      .select("stripe_subscription_id, status")
      .eq("profile_id", profileId),
    supabaseAdmin
      .from("profiles")
      .select("stripe_subscription_id")
      .eq("id", profileId)
      .maybeSingle(),
  ]);

  const subscriptionIds = new Set<string>();
  for (const row of subs ?? []) {
    const id = String((row as { stripe_subscription_id?: string | null }).stripe_subscription_id ?? "").trim();
    if (id) subscriptionIds.add(id);
  }
  const profileSub = String(profile?.stripe_subscription_id ?? "").trim();
  if (profileSub) subscriptionIds.add(profileSub);

  let canceled = 0;
  if (subscriptionIds.size > 0 && isStripeConfigured()) {
    const stripe = getStripe();
    for (const subscriptionId of subscriptionIds) {
      try {
        await stripe.subscriptions.cancel(subscriptionId);
        canceled += 1;
      } catch (error: unknown) {
        const code =
          error && typeof error === "object" && "code" in error
            ? String((error as { code?: string }).code ?? "")
            : "";
        const statusCode =
          error && typeof error === "object" && "statusCode" in error
            ? Number((error as { statusCode?: number }).statusCode)
            : NaN;
        if (code === "resource_missing" || statusCode === 404) continue;
        warnings.push(`cancel_failed:${subscriptionId}`);
        console.warn("[stripe] cancel subscription failed", subscriptionId, error);
      }
    }
  } else if (subscriptionIds.size > 0) {
    warnings.push("stripe_not_configured");
  }

  // Do not mutate local entitlements when Stripe cancel was incomplete —
  // callers treat warnings as failure and can retry without a half-downgrade.
  if (warnings.length > 0) {
    return { canceled, warnings };
  }

  const { error: subErr } = await supabaseAdmin
    .from("subscriptions")
    .update({ status: "canceled", cancel_at_period_end: true })
    .eq("profile_id", profileId);
  if (subErr) warnings.push(`local_subscription_update_failed:${subErr.message}`);

  const { error: profileErr } = await supabaseAdmin
    .from("profiles")
    .update({ tier: "free", stripe_subscription_id: null })
    .eq("id", profileId);
  if (profileErr) warnings.push(`local_profile_downgrade_failed:${profileErr.message}`);

  if (warnings.length === 0) {
    const { bumpAuthUserEpoch } = await import("../../middleware/auth");
    await bumpAuthUserEpoch(profileId);
  }

  return { canceled, warnings };
}

/**
 * Permanently delete a Stripe customer during account teardown.
 * Treats already-missing customers as success so re-runs stay idempotent.
 */
export async function deleteStripeCustomer(customerId: string): Promise<void> {
  if (!customerId?.trim()) return;
  if (!isStripeConfigured()) {
    throw new Error("stripe_secret_key_not_configured");
  }

  try {
    await getStripe().customers.del(customerId);
  } catch (error: unknown) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String((error as { code?: string }).code ?? "")
        : "";
    const statusCode =
      error && typeof error === "object" && "statusCode" in error
        ? Number((error as { statusCode?: number }).statusCode)
        : NaN;
    if (code === "resource_missing" || statusCode === 404) return;
    throw error;
  }
}
