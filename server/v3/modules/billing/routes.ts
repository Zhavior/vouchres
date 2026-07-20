import { Router } from "express";
import type { Response } from "express";
import type { AuthedRequest } from "../../../middleware/auth";
import type { RequestWithContext } from "../../../middleware/requestContext";
import { requireAuth } from "../../../middleware/auth";
import { asyncHandler } from "../../../lib/asyncHandler";
import { webhookLimiter } from "../../../middleware/rateLimit";
import { validate } from "../../../middleware/validation";
import {
  BillingCheckoutSchema,
  sendV3BillingCheckoutResponse,
  sendV3BillingPortalResponse,
  sendV3BillingStatusResponse,
  sendV3BillingWebhookResponse,
} from "./handlers";

export const v3BillingRoutes = Router();

v3BillingRoutes.post(
  "/checkout",
  requireAuth,
  validate({ body: BillingCheckoutSchema }),
  asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) =>
    sendV3BillingCheckoutResponse(req, res, { includeVersion: true })),
);

v3BillingRoutes.post(
  "/portal",
  requireAuth,
  asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) =>
    sendV3BillingPortalResponse(req, res, { includeVersion: true })),
);

v3BillingRoutes.get(
  "/status",
  requireAuth,
  asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) =>
    sendV3BillingStatusResponse(req, res, { includeVersion: true })),
);

v3BillingRoutes.get(
  "/subscription",
  requireAuth,
  asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) =>
    sendV3BillingStatusResponse(req, res, { includeVersion: true })),
);

v3BillingRoutes.post(
  "/webhook",
  webhookLimiter,
  asyncHandler(async (req: AuthedRequest, res: Response) =>
    sendV3BillingWebhookResponse(req, res, { includeVersion: true })),
);
