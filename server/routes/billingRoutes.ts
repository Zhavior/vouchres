import { Router } from "express";
import type { Response } from "express";
import Stripe from "stripe";
import { z } from "zod";
import { AppError } from "../errors/AppError";
import { asyncHandler } from "../lib/asyncHandler";
import { AuthedRequest, requireAuth, supabaseAdmin } from "../middleware/auth";
import { apiOkFlat } from "../lib/apiResponse";
import { structuredLog } from "../lib/structuredLog";
import { sendOpsAlert } from "../lib/opsAlert";
import type { RequestWithContext } from "../middleware/requestContext";
import { webhookLimiter } from "../middleware/rateLimit";
import { validate } from "../middleware/validation";
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

type AuthedRequestWithContext = AuthedRequest & RequestWithContext;

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

  const stripped = raw.replace(/\/+$/, "");

  if (!stripped.startsWith("http://") && !stripped.startsWith("https://")) {
    console.warn(
      `[billing] getSafeFrontendOrigin: "${stripped}" is not a valid http(s) URL — falling back to http://localhost:3000`
    );
    return "http://localhost:3000";
  }

  structuredLog({
    level: "info",
    event: "billing.safe_frontend_origin",
    message: stripped,
  });
  return stripped;
}

const CheckoutSchema = z.object({
  tier: z.enum(["pro", "creator"]),
  interval: z.enum(["monthly", "yearly"]).default("monthly"),
});

function assertStripeConfigured() {
  if (!isStripeConfigured()) {
    throw new AppError({
      status: 503,
      code: "external_service_error",
      message: "Stripe secret key is not configured on the server.",
      details: { reason: "stripe_not_configured" },
      expose: true,
    });
  }
}

billingRoutes.post(
  "/checkout",
  requireAuth,
  validate({ body: CheckoutSchema }),
  asyncHandler(async (req: AuthedRequestWithContext, res: Response) => {
    const { tier, interval } = req.body as z.infer<typeof CheckoutSchema>;
    const normalized = normalizeSubscriptionTier(tier);
    const checkoutTier = normalized.tier as PaidCanonicalTier;
    const billingInterval = interval as BillingInterval;

    if (checkoutTier !== "pro" && checkoutTier !== "creator") {
      throw new AppError({
        status: 400,
        code: "bad_request",
        message: "Checkout supports pro and creator subscriptions.",
        details: { reason: "unsupported_billing_tier", warnings: normalized.warnings },
      });
    }

    assertStripeConfigured();

    const priceId = getStripePriceId(checkoutTier, billingInterval);
    if (!priceId) {
      throw new AppError({
        status: 503,
        code: "external_service_error",
        message: `Stripe price id is missing for ${checkoutTier} ${billingInterval}.`,
        details: { reason: "stripe_price_not_configured", warnings: normalized.warnings },
        expose: true,
      });
    }

    const safeOrigin = getSafeFrontendOrigin();
    const successUrl = new URL("/settings?checkout=success", safeOrigin).toString();
    const cancelUrl = new URL("/settings?checkout=cancelled", safeOrigin).toString();

    const session = await createCheckoutSession({
      profileId: req.user!.id,
      email: req.user!.email ?? "",
      priceId,
      successUrl,
      cancelUrl,
    }).catch((err) => {
      console.error("[billing] checkout failed", err);
      throw new AppError({
        status: 500,
        code: "internal_server_error",
        message: err instanceof Error ? err.message : "checkout_failed",
        cause: err,
      });
    });

    return res.json(apiOkFlat(req, { url: session.url, warnings: normalized.warnings }));
  }),
);

billingRoutes.post(
  "/portal",
  requireAuth,
  asyncHandler(async (req: AuthedRequestWithContext, res: Response) => {
    assertStripeConfigured();

    const safeOrigin = getSafeFrontendOrigin();
    const returnUrl = new URL("/settings", safeOrigin).toString();

    const session = await createPortalSession({
      profileId: req.user!.id,
      email: req.user!.email ?? "",
      returnUrl,
    }).catch((err: unknown) => {
      console.error("[billing] portal failed", err);
      if (err instanceof Error && err.message === "billing_portal_not_configured") {
        throw new AppError({
          status: 503,
          code: "external_service_error",
          message:
            "The Stripe Billing Portal is not configured. " +
            "Go to dashboard.stripe.com → Settings → Billing → Customer portal and activate it.",
          details: { reason: "portal_not_configured" },
          expose: true,
        });
      }
      throw new AppError({
        status: 400,
        code: "bad_request",
        message: err instanceof Error ? err.message : "billing_portal_failed",
        cause: err,
      });
    });

    return res.json(apiOkFlat(req, { url: session.url }));
  }),
);

const billingStatusHandler = asyncHandler(async (req: AuthedRequestWithContext, res: Response) => {
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
    throw new AppError({
      status: 500,
      code: "internal_server_error",
      message: "Billing status unavailable.",
      details: { reason: "billing_status_failed", code: error.code },
      cause: error,
    });
  }

  const profileTier = req.user!.profile.tier;
  const entitlements = getTierEntitlements(profileTier);
  const normalized = normalizeSubscriptionTier(profileTier);

  return res.json(apiOkFlat(req, {
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
  }));
});

billingRoutes.get("/status", requireAuth, billingStatusHandler);
billingRoutes.get("/subscription", requireAuth, billingStatusHandler);

billingRoutes.post(
  "/webhook",
  webhookLimiter,
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    if (!isStripeConfigured()) {
      throw new AppError({
        status: 503,
        code: "external_service_error",
        message: "Stripe is not configured.",
        details: { reason: "stripe_not_configured" },
        expose: true,
      });
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";
    if (!webhookSecret) {
      console.error("[stripe] webhook secret is not configured");
      throw new AppError({
        status: 503,
        code: "external_service_error",
        message: "Webhook secret is not configured.",
        details: { reason: "webhook_secret_not_configured" },
        expose: true,
      });
    }

    const signature = req.headers["stripe-signature"];
    if (!signature) {
      throw new AppError({
        status: 400,
        code: "bad_request",
        message: "Missing Stripe signature header.",
        details: { reason: "missing_signature" },
      });
    }

    let event: Stripe.Event;
    try {
      event = getStripe().webhooks.constructEvent(
        req.body as unknown as string | Buffer,
        signature,
        webhookSecret,
      );
    } catch (err) {
      console.error("[stripe] webhook signature verification failed", err);
      throw new AppError({
        status: 400,
        code: "bad_request",
        message: "Invalid Stripe webhook signature.",
        details: { reason: "invalid_signature" },
        cause: err,
      });
    }

    const idempotency = await beginStripeWebhookEvent(event);
    if (!idempotency.shouldProcess) {
      return res.json({
        ok: true,
        received: true,
        duplicate: true,
        status: idempotency.status,
      });
    }

    try {
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
          const subId = (invoice as { subscription?: string | null }).subscription;
          // ALERT: a customer's renewal payment failed (dunning). syncSubscription
          // moves them to past_due (which downgrades access), but the owner needs
          // a loud, actionable signal — this is a business event, not routine.
          structuredLog({
            level: "error",
            event: "stripe.payment_failed",
            message: `Payment failed for customer ${invoice.customer} (invoice ${invoice.id})` +
              ` — subscription ${subId ?? "unknown"} moving to past_due.`,
          });
          void sendOpsAlert({
            severity: "warning",
            title: "Stripe payment failed",
            detail: `Customer ${invoice.customer}, invoice ${invoice.id}, sub ${subId ?? "unknown"}`,
            tags: { event: "stripe.payment_failed" },
          });
          if (subId) {
            const sub = await getStripe().subscriptions.retrieve(subId);
            await syncSubscription(sub);
          }
          break;
        }
        case "charge.refunded":
        case "charge.dispute.created": {
          // A refunded/charged-back customer must NOT keep paid access. Revoke
          // on a FULL refund or any dispute (partial refunds are left alone).
          const resolveCustomerId = (c: string | Stripe.Customer | Stripe.DeletedCustomer | null | undefined): string | null =>
            typeof c === "string" ? c : c?.id ?? null;

          let customerId: string | null = null;
          let isFullRefund = true; // a dispute always revokes; refunds check below

          if (event.type === "charge.refunded") {
            const charge = event.data.object as Stripe.Charge;
            isFullRefund = charge.amount_refunded >= charge.amount;
            customerId = resolveCustomerId(charge.customer);
          } else {
            // Stripe.Dispute has NO top-level customer field — resolve it via
            // the disputed charge (expanded object or a charge id we retrieve).
            const dispute = event.data.object as Stripe.Dispute;
            const chargeRef = dispute.charge;
            if (typeof chargeRef === "string") {
              const charge = await getStripe().charges.retrieve(chargeRef);
              customerId = resolveCustomerId(charge.customer);
            } else {
              customerId = resolveCustomerId(chargeRef?.customer);
            }
          }

          if (customerId && isFullRefund) {
            structuredLog({
              level: "warn",
              event: "stripe.access_revoked",
              message: `${event.type} for customer ${customerId} — revoking paid access (tier -> free).`,
            });
            await supabaseAdmin
              .from("subscriptions")
              .update({ status: "canceled" })
              .eq("stripe_customer_id", customerId);
            await supabaseAdmin
              .from("profiles")
              .update({ tier: "free", stripe_subscription_id: null })
              .eq("stripe_customer_id", customerId);
          } else {
            structuredLog({
              level: "info",
              event: "stripe.refund_partial_or_no_customer",
              message: `${event.type} not revoked (fullRefund=${isFullRefund}, customer=${customerId ?? "none"}).`,
            });
          }
          break;
        }
        default:
          structuredLog({
            level: "info",
            event: "stripe.webhook.unhandled",
            message: event.type,
          });
      }

      await finishStripeWebhookEvent(event.id, "processed");
      return res.json({ ok: true, received: true });
    } catch (err: unknown) {
      await finishStripeWebhookEvent(
        event.id,
        "failed",
        err instanceof Error ? err.message : "webhook_handler_failed",
      );
      console.error("[stripe] webhook handler error", err);
      throw new AppError({
        status: 500,
        code: "internal_server_error",
        message: "Webhook handler failed.",
        details: { reason: "webhook_handler_failed" },
        cause: err,
      });
    }
  }),
);
