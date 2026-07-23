import { Router, type Express, type Response } from "express";
import { AuthedRequest, requireAuth, optionalAuth } from "../middleware/auth";
import { asyncHandler } from "../lib/asyncHandler";
import { AppError } from "../errors/AppError";
import { apiOkFlat } from "../lib/apiResponse";
import type { RequestWithContext } from "../middleware/requestContext";
import { trustLedgerRepository } from "../repositories/trustLedgerRepository";
import { boundedInt } from "../lib/requestValidators";
import { sendV3CapperTrustResponse, sendV3UserTrustResponse } from "../v3/modules/trust/handlers";

/**
 * TrustOS Routes
 *
 *   GET /api/trust/user/:userId      — Legacy score+badge trust summary for a user
 *                                       (kept alive because src/api/vouchedgeApi.ts still
 *                                       calls this path — do not remove without updating
 *                                       the frontend client first)
 *   GET /api/trust/capper/:capperId  — Legacy score+badge trust summary + verified record
 *   GET /api/v3/trust/ledger/me      — Authenticated user's trust event history
 *   GET /api/v3/trust/ledger/user/:userId — Public trust event history for a specific user
 */
export const trustRoutes = Router();

type AuthedRequestWithContext = AuthedRequest & RequestWithContext;

trustRoutes.get(
  "/api/trust/user/:userId",
  asyncHandler(async (req: RequestWithContext, res: Response) => sendV3UserTrustResponse(req, res)),
);

trustRoutes.get(
  "/api/trust/capper/:capperId",
  asyncHandler(async (req: RequestWithContext, res: Response) => sendV3CapperTrustResponse(req, res)),
);

trustRoutes.get(
  "/api/v3/trust/ledger/me",
  requireAuth,
  asyncHandler(async (req: AuthedRequestWithContext, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError({ status: 401, code: "missing_token", message: "Authentication required." });
    }

    const limit = boundedInt(req.query.limit, "limit", 50, 1, 200);
    const events = await trustLedgerRepository.getEventsForUser(userId, limit);

    return res.json(
      apiOkFlat(req, {
        userId,
        count: events.length,
        events,
        meta: {
          system: "TrustOS",
          type: "canonical_event_ledger",
        },
      })
    );
  })
);

trustRoutes.get(
  "/api/v3/trust/ledger/user/:userId",
  optionalAuth,
  asyncHandler(async (req: RequestWithContext, res: Response) => {
    const userId = req.params.userId?.trim();
    if (!userId) {
      throw new AppError({ status: 400, code: "bad_request", message: "User ID is required." });
    }

    const limit = boundedInt(req.query.limit, "limit", 50, 1, 200);
    const rawEvents = await trustLedgerRepository.getEventsForUser(userId, limit);

    // Sanitize public ledger events (filter private metadata)
    const events = rawEvents.map((evt) => ({
      id: evt.id,
      user_id: evt.user_id,
      event_type: evt.event_type,
      pick_id: evt.pick_id,
      parlay_id: evt.parlay_id,
      trust_delta: evt.trust_delta,
      created_at: evt.created_at,
    }));

    return res.json(
      apiOkFlat(req, {
        userId,
        count: events.length,
        events,
        meta: {
          system: "TrustOS",
          type: "public_event_ledger",
        },
      })
    );
  })
);

export function registerTrustRoutes(app: Express): void {
  app.use(trustRoutes);
}
