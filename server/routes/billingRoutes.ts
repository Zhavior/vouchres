import { Router } from "express";
import type { Response } from "express";
import Stripe from "stripe";
import { AuthedRequest, requireAuth, supabaseAdmin } from "../middleware/auth";
import { webhookLimiter } from "../middleware/rateLimit";
import { validate } from "../middleware/validation";
import { z } from "zod";
import {
  getStripe,
  createCheckoutSession,
  createPortalSession,
  beginStripeWebhookEvent,
  finishStripeWebhookEvent,
  isStripeConfigured,
  syncSubscription,
} from "../services/billing/stripeService";
import {
  getStripePriceId,
  getStripePriceMatrix,
  getTierEntitlements,
  normalizeSubscriptionTier,
  type BillingInterval,
  type PaidCanonicalTier,
} from "../services/billing/tierConfig";

export const billingRoutes = Router();

/**
 * Returns a validated, slash-stripped frontend origin for Stripe redirect URLs.
 * Preference order: FRONTEND_URL → CLIENT_URL → SITE_URL → PUBLIC_SITE_URL → APP_URL → localhost:3000
 * Rejects any value that doesn't start with http:// or https://.
 */
function getSafeFrontendOrigin(): string {
  const raw =
    process.env.FRONTEND_URL ||
    process.env.CLIENT_URL ||
    process.env.SITE_URL ||
    process.env.PUBLIC_SITE_URL ||
    process.env.APP_URL ||
    "http://localhost:3000";

  const stripped = raw.replace(/\/+$/, ""); // strip trailing slashes

  if (!stripped.startsWith("http://") && !stripped.startsWith("https://")) {
    console.warn(
      `[billing] getSafeFrontendOrigin: "${stripped}" is not a valid http(s) URL — falling back to http://localhost:3000`
    );
    return "http://localhost:3000";
  }

  console.log("[billing] safeFrontendOrigin:", stripped);
  return stripped;
}

/**
 * POST /api/billing/checkout
 * Start a Stripe Checkout session for upgrading to a paid tier.
 *
 * Body: { tier: 'pro' | 'creator', interval?: 'monthly' | 'yearly' }
 * Returns: { url: string }  (redirect the browser to this URL)
 */
const CheckoutSchema = z.object({
  tier: z.enum(["pro", "creator"]),
  interval: z.enum(["monthly", "yearly"]).default("monthly"),
});

function billingErrorMessage(err: unknown) {
  return err instanceof Error ? err.message : "billing_request_failed";
}

billingRoutes.post(
  "/checkout",
  requireAuth,
  validate({ body: CheckoutSchema }),
  async (req: AuthedRequest, res: Response) => {
    const { tier } = req.body as z.infer<typeof CheckoutSchema>;
    const normalized = normalizeSubscriptionTier(tier);
    const checkoutTier = normalized.tier as PaidCanonicalTier;
    const interval = (req.body as z.infer<typeof CheckoutSchema>).interval as BillingInterval;

    if (checkoutTier !== "pro" && checkoutTier !== "creator") {
      return res.status(400).json({
        error: "unsupported_billing_tier",
        message: "Checkout supports pro and creator subscriptions.",
        warnings: normalized.warnings,
      });
    }

    if (!isStripeConfigured()) {
      return res.status(503).json({
        error: "stripe_not_configured",
        message: "Stripe secret key is not configured on the server.",
      });
    }

    const priceId = getStripePriceId(checkoutTier, interval);

    if (!priceId) {
      return res.status(503).json({
        error: "stripe_price_not_configured",
        message: `Stripe price id is missing for ${checkoutTier} ${interval}.`,
        warnings: normalized.warnings,
      });
    }

    try {
      const safeOrigin = getSafeFrontendOrigin();
      const successUrl = new URL("/settings?checkout=success", safeOrigin).toString();
      const cancelUrl = new URL("/settings?checkout=cancelled", safeOrigin).toString();
      console.log("[billing] checkout successUrl:", successUrl);
      console.log("[billing] checkout cancelUrl:", cancelUrl);

      const session = await createCheckoutSession({
        profileId: req.user!.id,
        email: req.user!.email ?? "",
        priceId,
        successUrl,
        cancelUrl,
      });
      return res.json({ url: session.url, warnings: normalized.warnings });
    } catch (err) {
      console.error("[billing] checkout failed", err);
      return res.status(500).json({ error: "checkout_failed", message: billingErrorMessage(err) });
    }
  }
);

/**
 * POST /api/billing/portal
 * Return a Stripe Billing Portal URL for managing an existing subscription.
 */
billingRoutes.post("/portal", requireAuth, async (req: AuthedRequest, res: Response) => {
  if (!isStripeConfigured()) {
    return res.status(503).json({
      error: "stripe_not_configured",
      message: "Stripe secret key is not configured on the server.",
    });
  }

  try {
    const safeOrigin = getSafeFrontendOrigin();
    const returnUrl = new URL("/settings", safeOrigin).toString();
    console.log("[billing] portal returnUrl:", returnUrl);

    const session = await createPortalSession({
      profileId: req.user!.id,
      email: req.user!.email ?? "",
      returnUrl,
    });
    return res.json({ url: session.url });
  } catch (err: any) {
    console.error("[billing] portal failed", err);
    if (err?.message === "billing_portal_not_configured") {
      return res.status(503).json({
        error: "portal_not_configured",
        message:
          "The Stripe Billing Portal is not configured. " +
          "Go to dashboard.getStripe().com → Settings → Billing → Customer portal and activate it.",
      });
    }
    return res.status(400).json({ error: "billing_portal_failed", message: billingErrorMessage(err) });
  }
});

/**
 * GET /api/billing/status
 * Returns the user's current subscription state.
 */
async function billingStatusHandler(req: AuthedRequest, res: Response) {
  const { data: sub, error } = await supabaseAdmin
    .from("subscriptions")
    .select(
      "tier, status, current_period_start, current_period_end, cancel_at_period_end, stripe_price_id"
    )
    .eq("profile_id", req.user!.id)
    .order("current_period_end", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[billing] status lookup failed", error);
    return res.status(500).json({ error: "billing_status_failed" });
  }

  const profileTier = req.user!.profile.tier;
  const entitlements = getTierEntitlements(profileTier);
  const normalized = normalizeSubscriptionTier(profileTier);

  return res.json({
    tier: entitlements.tier,
    legacyTier: normalized.sourceTier !== entitlements.tier ? normalized.sourceTier : null,
    monthlyCustomizationPoints: entitlements.monthlyCustomizationPoints,
    canUseProGraphs: entitlements.canUseProGraphs,
    canUseTeamMatchupLab: entitlements.canUseTeamMatchupLab,
    canUsePlayerEdgeLab: entitlements.canUsePlayerEdgeLab,
    canAccessNotifications: entitlements.canAccessNotifications,
    status: sub?.status ?? (profileTier === "free" ? "free" : "active"),
    currentPeriodStart: sub?.current_period_start ?? null,
    currentPeriodEnd: sub?.current_period_end ?? null,
    cancelAtPeriodEnd: sub?.cancel_at_period_end ?? false,
    subscription: sub ?? null,
    prices: getStripePriceMatrix(),
    warnings: entitlements.warnings,
  });
}

billingRoutes.get("/status", requireAuth, billingStatusHandler);
billingRoutes.get("/subscription", requireAuth, billingStatusHandler);

/**
 * POST /api/billing/webhook
 * Stripe webhook receiver. Verifies signature, dispatches events to syncSubscription.
 *
 * NOTE: This endpoint uses the RAW body — must be registered BEFORE express.json()
 * middleware in server.ts, OR use express.raw({type: 'application/json'}) on this route.
 * See server/middleware/webhookRaw.ts for the body parser config.
 */
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "";

billingRoutes.post(
  "/webhook",
  webhookLimiter,
  // Stripe requires the raw body — see note below
  async (req: AuthedRequest, res: Response) => {
    if (!isStripeConfigured()) {
      return res.status(503).send("stripe not configured");
    }

    if (!WEBHOOK_SECRET) {
      console.error("[stripe] webhook secret is not configured");
      return res.status(503).send("webhook secret not configured");
    }

    const signature = req.headers["stripe-signature"];
    if (!signature) {
      return res.status(400).send("missing signature");
    }

    let event: Stripe.Event;
    try {
      // req.body must be the raw Buffer (or raw string) here
      // See implementation note in server/middleware/webhookRaw.ts
      event = getStripe().webhooks.constructEvent(
        req.body as unknown as string | Buffer,
        signature,
        WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("[stripe] webhook signature verification failed", err);
      return res.status(400).send("invalid signature");
    }

    try {
      const idempotency = await beginStripeWebhookEvent(event);
      if (!idempotency.shouldProcess) {
        return res.json({
          received: true,
          duplicate: true,
          status: idempotency.status,
        });
      }

      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          const subscriptionId =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription?.id;
          if (subscriptionId) {
            const sub = await getStripe().subscriptions.retrieve(subscriptionId);
            await syncSubscription(sub);
          }
          break;
        }
        case "customer.subscription.created":
        case "customer.subscription.updated": {
          const sub = event.data.object as Stripe.Subscription;
          await syncSubscription(sub);
          break;
        }
        case "customer.subscription.deleted": {
          const sub = event.data.object as Stripe.Subscription;
          await syncSubscription(sub);
          // Mark subscription as canceled, downgrade profile to free. Keep this
          // fallback for legacy rows if Stripe omits price data on delete events.
          await supabaseAdmin
            .from("subscriptions")
            .update({ status: "canceled" })
            .eq("stripe_subscription_id", sub.id);
          await supabaseAdmin
            .from("profiles")
            .update({ tier: "free", stripe_subscription_id: null })
            .eq("stripe_subscription_id", sub.id);
          break;
        }
        case "invoice.payment_failed": {
          const invoice = event.data.object as Stripe.Invoice;
          const subId = (invoice as any).subscription as string;
          if (subId) {
            // Fetch and re-sync — this will downgrade to free if status is unpaid
            const sub = await getStripe().subscriptions.retrieve(subId);
            await syncSubscription(sub);
          }
          break;
        }
        default:
          // Unhandled event types — log for visibility, don't fail
          console.log(`[stripe] unhandled event: ${event.type}`);
      }

      await finishStripeWebhookEvent(event.id, "processed");
      return res.json({ received: true });
    } catch (err: any) {
      await finishStripeWebhookEvent(event.id, "failed", err?.message ?? "webhook_handler_failed");
      console.error("[stripe] webhook handler error", err);
      return res.status(500).json({ error: "webhook_handler_failed" });
    }
  }
);
