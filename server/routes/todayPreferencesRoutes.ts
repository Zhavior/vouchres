import { Router } from "express";
import type { Response } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { apiOkFlat } from "../lib/apiResponse";
import { requireAuth, type AuthedRequest } from "../middleware/auth";
import type { RequestWithContext } from "../middleware/requestContext";
import { validate } from "../middleware/validation";
import {
  TodayPreferencesPutSchema,
  getTodayPreferences,
  replaceTodayPreferences,
  type TodayPreferencesInput,
} from "../services/personalization/todayPreferencesService";

export const todayPreferencesRoutes = Router();

todayPreferencesRoutes.get(
  "/today/preferences",
  requireAuth,
  asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) => {
    const preferences = await getTodayPreferences(req.user!.id);
    return res.json(apiOkFlat(req, { preferences }));
  }),
);

todayPreferencesRoutes.put(
  "/today/preferences",
  requireAuth,
  validate({ body: TodayPreferencesPutSchema }),
  asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) => {
    const preferences = await replaceTodayPreferences(
      req.user!.id,
      req.body as TodayPreferencesInput,
    );
    return res.json(apiOkFlat(req, { preferences }));
  }),
);
