import type { Express, Response } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { apiOkFlat } from "../lib/apiResponse";
import { AppError } from "../errors/AppError";
import { requireAuth } from "../middleware/auth";
import type { RequestWithContext } from "../middleware/requestContext";
import {
  getDailyMlbCentralBrain,
  listCentralBrainSports,
} from "../services/intelligence/centralBrain/centralBrainService";
import { CentralBrainDailyQuerySchema } from "../services/intelligence/centralBrain/schemas";

export function registerCentralBrainRoutes(app: Express): void {
  app.get("/api/intelligence/brain", requireAuth, (req: RequestWithContext, res: Response) =>
    res.json(apiOkFlat(req, { sports: listCentralBrainSports() })),
  );

  app.get("/api/intelligence/brain/mlb/daily", requireAuth, asyncHandler(async (req: RequestWithContext, res: Response) => {
    const parsedQuery = CentralBrainDailyQuerySchema.safeParse(req.query);
    if (!parsedQuery.success) {
      throw new AppError({
        status: 400,
        code: "validation_error",
        message: "date must use YYYY-MM-DD format.",
        details: parsedQuery.error.issues,
      });
    }

    const snapshot = await getDailyMlbCentralBrain(parsedQuery.data.date);
    return res.json(apiOkFlat(req, { snapshot }));
  }));
}
