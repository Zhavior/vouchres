import type { RequestHandler } from "express";

/**
 * Every path that must receive the RAW request body instead of parsed JSON.
 *
 * SINGLE SOURCE OF TRUTH — mount this in every app factory. There are two
 * (`createApiApp` in server/api/bootstrap.ts, which production uses on both
 * Render and Vercel, and `createV3App` in server/v3/app.ts, used by dev:v3),
 * and they previously kept separate hand-written lists. They drifted:
 * `/api/v3/billing/webhook` was mounted in createV3App only, so on production
 * that route received an express.json()-parsed object and
 * `stripe.webhooks.constructEvent` rejected every delivery with
 * "Webhook payload must be provided as a string or a Buffer" — a permanent 400.
 *
 * It failed closed rather than open, so it was never a forgery bypass. The
 * damage was the other direction: point the Stripe Dashboard at that URL and
 * `checkout.session.completed` never grants a tier (paying customers get
 * nothing) while `charge.refunded` / `customer.subscription.deleted` never
 * revoke (refunded users keep access).
 *
 * Adding a webhook route without adding it here reintroduces exactly that bug.
 */
export const STRIPE_WEBHOOK_RAW_PATHS = [
  "/api/billing/webhook",
  "/api/stripe/webhook",
  "/api/v3/billing/webhook",
] as const;

/**
 * Stripe webhooks require the RAW request body — express.json() would consume
 * and parse it, breaking signature verification.
 *
 * Mount this on /api/billing/webhook BEFORE the global express.json() middleware.
 *
 * In server.ts:
 *
 *   import { webhookRawBody } from "./server/middleware/webhookRaw";
 *   app.post("/api/billing/webhook", webhookRawBody, billingRoutes);  // OR
 *   app.use("/api/billing/webhook", webhookRawBody, billingRouter);
 *
 * Alternative: register express.raw() only on this path:
 *
 *   app.post(
 *     "/api/billing/webhook",
 *     express.raw({ type: "application/json", limit: "1mb" }),
 *     billingRoutes
 *   );
 *
 * Either works. The express.raw approach is simpler — use that if you don't
 * want this file.
 */
export const webhookRawBody: RequestHandler = (req, _res, next) => {
  // The express.raw middleware populates req.body as a Buffer.
  // If body was already parsed as JSON, we can't recover — so the global
  // express.json must NOT touch this path.
  if (Buffer.isBuffer(req.body)) {
    // Good — raw body intact
    next();
  } else if (typeof req.body === "string") {
    // Also fine
    next();
  } else {
    // Body was already parsed as JSON — signature verification will fail
    console.error("[webhook] body was already JSON-parsed before reaching handler");
    next(new Error("webhook_body_already_parsed"));
  }
};
