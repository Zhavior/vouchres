import type { RequestHandler } from "express";

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
