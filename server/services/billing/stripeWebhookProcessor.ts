import type Stripe from "stripe";
import { structuredLog } from "../../lib/structuredLog";
import { getSupabaseAdmin } from "../../middleware/auth";
import { getStripe, syncSubscription } from "./stripeService";

/**
 * Apply entitlement side-effects for a verified Stripe webhook event.
 * Invoked by the async entitlement worker (or optional inline mode).
 */
export async function processStripeWebhookEvent(event: Stripe.Event): Promise<void> {
  const supabaseAdmin = await getSupabaseAdmin();

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
      structuredLog({
        level: "error",
        event: "stripe.payment_failed",
        message:
          `Payment failed for customer ${invoice.customer} (invoice ${invoice.id})` +
          ` — subscription ${subId ?? "unknown"} moving to past_due.`,
      });
      if (subId) {
        const sub = await getStripe().subscriptions.retrieve(subId);
        await syncSubscription(sub);
      }
      break;
    }
    case "charge.refunded":
    case "charge.dispute.created": {
      const resolveCustomerId = (
        c: string | Stripe.Customer | Stripe.DeletedCustomer | null | undefined,
      ): string | null => (typeof c === "string" ? c : c?.id ?? null);

      let customerId: string | null = null;
      let isFullRefund = true;

      if (event.type === "charge.refunded") {
        const charge = event.data.object as Stripe.Charge;
        isFullRefund = charge.amount_refunded >= charge.amount;
        customerId = resolveCustomerId(charge.customer);
      } else {
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
}
