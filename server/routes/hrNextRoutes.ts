import { Router } from "express";
import type { Response } from "express";
import { AuthedRequest, requireAuth, requireStaff } from "../middleware/auth";
import { asyncHandler } from "../lib/asyncHandler";
import { apiOkFlat } from "../lib/apiResponse";
import type { RequestWithContext } from "../middleware/requestContext";

export const hrNextRoutes = Router();

hrNextRoutes.get(
  "/",
  requireAuth,
  requireStaff,
  asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) => {
    return res.json(apiOkFlat(req, {
      message: "HRNext API is active"
    }));
  }),
);
