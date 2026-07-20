import { Router } from "express";
import type { Response } from "express";
import type { AuthedRequest } from "../middleware/auth";
import type { RequestWithContext } from "../middleware/requestContext";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../lib/asyncHandler";
import { webhookLimiter } from "../middleware/rateLimit";
import { validate } from "../middleware/validation";
import {
  BillingCheckoutSchema,
  sendV3BillingCheckoutResponse,
  sendV3BillingPortalResponse,
  sendV3BillingStatusResponse,
  sendV3BillingWebhookResponse,
} from "../v3/modules/billing/handlers";

export const billingRoutes = Router();

type AuthedRequestWithContext = AuthedRequest & RequestWithContext;

billingRoutes.post(
  "/checkout",
  requireAuth,
  validate({ body: BillingCheckoutSchema }),
  asyncHandler(async (req: AuthedRequestWithContext, res: Response) =>
    sendV3BillingCheckoutResponse(req, res)),
);

billingRoutes.post(
  "/portal",
  requireAuth,
  asyncHandler(async (req: AuthedRequestWithContext, res: Response) =>
    sendV3BillingPortalResponse(req, res)),
);

billingRoutes.get(
  "/status",
  requireAuth,
  asyncHandler(async (req: AuthedRequestWithContext, res: Response) =>
    sendV3BillingStatusResponse(req, res)),
);

billingRoutes.get(
  "/subscription",
  requireAuth,
  asyncHandler(async (req: AuthedRequestWithContext, res: Response) =>
    sendV3BillingStatusResponse(req, res)),
);

billingRoutes.post(
  "/webhook",
  webhookLimiter,
  asyncHandler(async (req: AuthedRequest, res: Response) =>
    sendV3BillingWebhookResponse(req, res)),
);
