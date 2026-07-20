import { Router } from "express";
import type { Response } from "express";
import { validate } from "../middleware/validation";
import { asyncHandler } from "../lib/asyncHandler";
import { apiOkFlat } from "../lib/apiResponse";
import { requireAuth, type AuthedRequest } from "../middleware/auth";
import type { RequestWithContext } from "../middleware/requestContext";
import {
  CreatorBusinessUpdateSchema,
  CreatorBusinessProductUpdateSchema,
  getCreatorBusinessForProfile,
  updateCreatorBusinessForProfile,
  updateCreatorBusinessProductForProfile,
} from "../services/business/creatorBusinessService";

export const creatorBusinessRoutes = Router();

creatorBusinessRoutes.get(
  "/creator-business/me",
  requireAuth,
  asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) => {
    const business = await getCreatorBusinessForProfile(req.user!.id);
    return res.json(apiOkFlat(req, { business }));
  }),
);

creatorBusinessRoutes.put(
  "/creator-business/me",
  requireAuth,
  validate({ body: CreatorBusinessUpdateSchema }),
  asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) => {
    const business = await updateCreatorBusinessForProfile(req.user!.id, req.body as never);
    return res.json(apiOkFlat(req, { business }));
  }),
);

creatorBusinessRoutes.put(
  "/creator-business/me/products/:code",
  requireAuth,
  validate({ body: CreatorBusinessProductUpdateSchema }),
  asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) => {
    const body = req.body as Record<string, unknown>;
    const business = await updateCreatorBusinessProductForProfile(req.user!.id, {
      ...body,
      code: req.params.code,
    } as never);
    return res.json(apiOkFlat(req, { business }));
  }),
);
