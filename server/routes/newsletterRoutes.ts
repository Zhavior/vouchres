import { Router } from "express";
import type { Response } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { apiOkFlat } from "../lib/apiResponse";
import { AppError } from "../errors/AppError";
import type { RequestWithContext } from "../middleware/requestContext";
import { generationLimiter } from "../middleware/rateLimit";
import { addSubscriber, broadcastBlogPost, getActiveSubscribers } from "../services/newsletter/newsletterService";

export const newsletterRoutes = Router();

/**
 * Public subscription endpoint.
 */
newsletterRoutes.post(
  "/newsletter/subscribe",
  generationLimiter,
  asyncHandler(async (req: RequestWithContext, res: Response) => {
    const { email } = req.body ?? {};

    if (!email || typeof email !== "string" || !email.includes("@")) {
      throw new AppError({
        status: 400,
        code: "invalid_email",
        message: "A valid email address is required to subscribe.",
      });
    }

    const result = await addSubscriber(email);

    return res.json(
      apiOkFlat(req, {
        subscribed: true,
        email: result.email,
        message: "Subscription confirmed. Welcome dispatch in flight.",
      })
    );
  })
);

/**
 * Broadcast an engineering log to all subscribers.
 */
newsletterRoutes.post(
  "/newsletter/broadcast",
  generationLimiter,
  asyncHandler(async (req: RequestWithContext, res: Response) => {
    const { slug } = req.body ?? {};

    if (!slug || typeof slug !== "string") {
      throw new AppError({
        status: 400,
        code: "invalid_slug",
        message: "A valid blog post slug is required to broadcast.",
      });
    }

    const result = await broadcastBlogPost(slug);

    return res.json(
      apiOkFlat(req, {
        broadcast: true,
        slug,
        sentCount: result.sentCount,
        message: `Transmission blasted to ${result.sentCount} subscriber nodes.`,
      })
    );
  })
);

/**
 * Subscriber count introspection.
 */
newsletterRoutes.get(
  "/newsletter/count",
  asyncHandler(async (req: RequestWithContext, res: Response) => {
    const subs = await getActiveSubscribers();
    return res.json(
      apiOkFlat(req, {
        count: subs.length,
      })
    );
  })
);
