import { Router } from "express";
import type { Response } from "express";
import type { AuthedRequest } from "../../../middleware/auth";
import type { RequestWithContext } from "../../../middleware/requestContext";
import { requireAuth } from "../../../middleware/auth";
import { validate } from "../../../middleware/validation";
import { asyncHandler } from "../../../lib/asyncHandler";
import { ListParlaysQuerySchema, ParlayIdParamsSchema, SaveMeParlaySchema } from "../../../validators/parlaySchemas";
import { sendV3ParlayDetailResponse, sendV3ParlayListResponse, sendV3ParlaySavePreviewResponse, sendV3ParlaySaveResponse, sendV3ParlayTrustCommitResponse, sendV3ParlayTrustFinalizeResponse } from "./handlers";
import { requireLegalConfirmed } from "../../../middleware/auth";
import { v3ParlaySupportRoutes } from "./supportRoutes";

/**
 * V3 parlay ownership routes now own the canonical lifecycle endpoints
 * directly. Remaining user support endpoints live in a narrower shared support
 * router so V3 no longer inherits the entire legacy user router surface.
 */
export const v3ParlayRoutes = Router();

v3ParlayRoutes.get(
  "/me/parlays",
  requireAuth,
  validate({ query: ListParlaysQuerySchema }),
  asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) =>
    sendV3ParlayListResponse(req, res, { includeVersion: true })),
);

v3ParlayRoutes.get(
  "/parlays/:id",
  requireAuth,
  validate({ params: ParlayIdParamsSchema }),
  asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) =>
    sendV3ParlayDetailResponse(req, res, { includeVersion: true })),
);

v3ParlayRoutes.post(
  "/parlays/save-preview",
  requireAuth,
  requireLegalConfirmed,
  validate({ body: SaveMeParlaySchema }),
  asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) =>
    sendV3ParlaySavePreviewResponse(req, res, { includeVersion: true })),
);

v3ParlayRoutes.post(
  "/parlays/save",
  requireAuth,
  requireLegalConfirmed,
  validate({ body: SaveMeParlaySchema }),
  asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) =>
    sendV3ParlaySaveResponse(req, res, { includeVersion: true })),
);

v3ParlayRoutes.post(
  "/parlays/:id/commit-trust",
  requireAuth,
  validate({ params: ParlayIdParamsSchema }),
  asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) =>
    sendV3ParlayTrustCommitResponse(req, res, { includeVersion: true })),
);

v3ParlayRoutes.post(
  "/parlays/:id/finalize-trust-lock",
  requireAuth,
  validate({ params: ParlayIdParamsSchema }),
  asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) =>
    sendV3ParlayTrustFinalizeResponse(req, res, { includeVersion: true })),
);

v3ParlayRoutes.use(v3ParlaySupportRoutes);
