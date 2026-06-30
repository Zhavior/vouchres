import { Router } from "express";
import type { Response } from "express";
import Stripe from "stripe";
import { AuthedRequest, requireAuth } from "../middleware/auth";
import { webhookLimiter } from "../middleware/rateLimit";
import { validate } from "../middleware/validation";
import { z } from "zod";
import {
  stripe,
  STRIPE_PRICES,
  createCheckoutSession,
  createPortalSession,
  syncSubscription,
} from "../services/billing/stripeService";

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
 * Body: { tier: 'gold' | 'seller_pro' }
 * Returns: { url: string }  (redirect the browser to this URL)
 */
const CheckoutSchema = z.object({
  tier: z.enum(["gold", "seller_pro"]),
});

billingRoutes.post(
  "/checkout",
  requireAuth,
  validate({ body: CheckoutSchema }),
  async (req: AuthedRequest, res: Response) => {
    const { tier } = req.body as z.infer<typeof CheckoutSchema>;
    const priceId =
      tier === "gold"
        ? process.env.STRIPE_PRICE_GOLD
        : process.env.STRIPE_PRICE_SELLER_PRO;

    if (!priceId) {
      return res.status(500).json({ error: "stripe_price_not_configured" });
    }

    try {
      const safeOrigin = getSafeFrontendOrigin();
      const successUrl = new URL("/premium?checkout=success", safeOrigin).toString();
      const cancelUrl = new URL("/premium?checkout=cancelled", safeOrigin).toString();
      console.log("[billing] checkout successUrl:", successUrl);
      console.log("[billing] checkout cancelUrl:", cancelUrl);

      const session = await createCheckoutSession({
        profileId: req.user!.id,
        email: req.user!.email ?? "",
        priceId,
        successUrl,
        cancelUrl,
      });
      return res.json({ url: session.url });
    } catch (err) {
      console.error("[billing] checkout failed", err);
      return res.status(500).json({ error: "checkout_failed" });
    }
  }
);

/**
 * POST /api/billing/portal
 * Return a Stripe Billing Portal URL for managing an existing subscription.
 */
billingRoutes.post("/portal", requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const safeOrigin = getSafeFrontendOrigin();
    const returnUrl = new URL("/settings", safeOrigin).toString();
    console.log("[billing] portal returnUrl:", returnUrl);

    const session = await createPortalSession({
      profileId: req.user!.id,
      returnUrl,
    });
    return res.json({ url: session.url });
  } catch (err) {
    console.error("[billing] portal failed", err);
    return res.status(400).json({ error: "no_subscription" });
  }
});

/**
 * GET /api/billing/status
 * Returns the user's current subscription state.
 */
billingRoutes.get("/status", requireAuth, async (req: AuthedRequest, res: Response) => {
  const { data: sub } = await supabaseAdmin
    .from("subscriptions")
    .select(
      "tier, status, current_period_start, current_period_end, cancel_at_period_end, stripe_price_id"
    )
    .eq("profile_id", req.user!.id)
    .order("current_period_end", { ascending: false })
    .limit(1)
    .single();

  return res.json({
    tier: req.user!.profile.tier,
    subscription: sub ?? null,
    prices: {
      gold: process.env.STRIPE_PRICE_GOLD ?? null,
      seller_pro: process.env.STRIPE_PRICE_SELLER_PRO ?? null,
    },
  });
});

// Need to import supabaseAdmin here for the status endpoint above
import { supabaseAdmin } from "../middleware/auth";

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
    const signature = req.headers["stripe-signature"];
    if (!signature) {
      return res.status(400).send("missing signature");
    }

    let event: Stripe.Event;
    try {
      // req.body must be the raw Buffer (or raw string) here
      // See implementation note in server/middleware/webhookRaw.ts
      event = stripe.webhooks.constructEvent(
        req.body as unknown as string | Buffer,
        signature,
        WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("[stripe] webhook signature verification failed", err);
      return res.status(400).send("invalid signature");
    }

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          // Customer finished checkout — subscription will be created next
          // Handled by customer.subscription.created below
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
          // Mark subscription as canceled, downgrade profile to free
          await supabaseAdmin
            .from("subscriptions")
            .update({ status: "canceled" })
            .eq("stripe_subscription_id", sub.id);
          await supabaseAdmin
            .from("profiles")
            .update({ tier: "free", stripe_subscription_id: null })
            .eq("id", sub.metadata.profile_id);
          break;
        }
        case "invoice.payment_failed": {
          const invoice = event.data.object as Stripe.Invoice;
          const subId = (invoice as any).subscription as string;
          if (subId) {
            // Fetch and re-sync — this will downgrade to free if status is unpaid
            const sub = await stripe.subscriptions.retrieve(subId);
            await syncSubscription(sub);
          }
          break;
        }
        default:
          // Unhandled event types — log for visibility, don't fail
          console.log(`[stripe] unhandled event: ${event.type}`);
      }

      return res.json({ received: true });
    } catch (err) {
      console.error("[stripe] webhook handler error", err);
      return res.status(500).json({ error: "webhook_handler_failed" });
    }
  }
);
