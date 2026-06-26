import Stripe from "stripe";
import { supabaseAdmin } from "../../middleware/auth";

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

/**
 * Price IDs per tier. Configure in Stripe dashboard, then paste IDs here
 * (or load from env). These are product/price IDs, not plan IDs.
 */
export const STRIPE_PRICES: Record<string, { tier: "gold" | "seller_pro"; priceId: string }> = {
  [process.env.STRIPE_PRICE_GOLD ?? "price_gold_monthly"]: {
    tier: "gold",
    priceId: process.env.STRIPE_PRICE_GOLD ?? "price_gold_monthly",
  },
  [process.env.STRIPE_PRICE_SELLER_PRO ?? "price_seller_pro_monthly"]: {
    tier: "seller_pro",
    priceId: process.env.STRIPE_PRICE_SELLER_PRO ?? "price_seller_pro_monthly",
  },
};

/**
 * Create or reuse a Stripe customer for a profile.
 */
export async function ensureStripeCustomer(profileId: string, email: string) {
  // Check if profile already has a stripe_customer_id
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", profileId)
    .single();

  if (profile?.stripe_customer_id) {
    try {
      return await stripe.customers.retrieve(profile.stripe_customer_id);
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
  const customer = (await ensureStripeCustomer(opts.profileId, opts.email)) as Stripe.Customer;

  return stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customer.id,
    line_items: [{ price: opts.priceId, quantity: 1 }],
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
    metadata: {
      profile_id: opts.profileId,
      target_tier: STRIPE_PRICES[opts.priceId]?.tier ?? "unknown",
    },
    subscription_data: {
      metadata: {
        profile_id: opts.profileId,
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
  returnUrl: string;
}) {
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", opts.profileId)
    .single();

  if (!profile?.stripe_customer_id) {
    throw new Error("No Stripe customer found for this profile");
  }

  return stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: opts.returnUrl,
  });
}

/**
 * Map a Stripe Price ID to a tier.
 */
export function tierFromPriceId(priceId: string): "gold" | "seller_pro" | null {
  return STRIPE_PRICES[priceId]?.tier ?? null;
}

/**
 * Sync subscription state to Postgres.
 * Called from the webhook handler on every subscription event.
 */
export async function syncSubscription(subscription: Stripe.Subscription) {
  const profileId = subscription.metadata.profile_id;
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

  const status = subscription.status; // 'active' | 'past_due' | 'canceled' | etc.
  // Treat 'active' and 'trialing' as entitled; everything else downgrades to free
  const effectiveTier: "free" | "gold" | "seller_pro" =
    status === "active" || status === "trialing" ? tier : "free";

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
      tier: effectiveTier,
      stripe_customer_id: subscription.customer as string,
      stripe_subscription_id: subscription.id,
    })
    .eq("id", profileId);

  console.log(
    `[stripe] synced subscription ${subscription.id} for profile ${profileId}: ${effectiveTier} (${status})`
  );
}
