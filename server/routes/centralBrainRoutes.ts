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
import { getBrainHrLedger, getBrainMlbPicksForDate, getBrainPitcherKLedger, getBrainStolenBaseLedger } from "../services/intelligence/centralBrain/brainLedgerService";
import { scanMlbSlate } from "../services/intelligence/centralBrain/brainScanService";
import { BRAIN_PRODUCT_IDENTITY } from "../services/intelligence/centralBrain/identity";
import { executeBrainOperations } from "../services/intelligence/centralBrain/brainOperationsService";
import { assertCronAuthorized } from "../lib/cronAuth";
import { evaluateBrainHrHistory } from "../services/intelligence/centralBrain/brainLearningService";
import { requireTier } from "../middleware/entitlements";
import { getBrainGeminiReviews } from "../services/intelligence/centralBrain/brainGeminiReviewService";

export function registerCentralBrainRoutes(app: Express): void {
  app.get("/api/intelligence/brain", requireAuth, requireTier("gold"), (req: RequestWithContext, res: Response) =>
    res.json(apiOkFlat(req, { identity: BRAIN_PRODUCT_IDENTITY, sports: listCentralBrainSports() })),
  );

  app.get("/api/intelligence/brain/mlb/daily", requireAuth, requireTier("gold"), asyncHandler(async (req: RequestWithContext, res: Response) => {
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

  app.get("/api/intelligence/brain/mlb/performance", requireAuth, requireTier("gold"), asyncHandler(async (req: RequestWithContext, res: Response) => {
    const parsedQuery = CentralBrainDailyQuerySchema.safeParse(req.query);
    if (!parsedQuery.success) {
      throw new AppError({ status: 400, code: "validation_error", message: "date must use YYYY-MM-DD format.", details: parsedQuery.error.issues });
    }
    const date = parsedQuery.data.date ?? new Date().toISOString().slice(0, 10);
    const [ledger, stolenBaseLedger, pitcherStrikeoutsLedger, modelRecords] = await Promise.all([getBrainHrLedger(), getBrainStolenBaseLedger(), getBrainPitcherKLedger(), evaluateBrainHrHistory()]);
    return res.json(apiOkFlat(req, { ...ledger, stolenBase: stolenBaseLedger, pitcherStrikeouts: pitcherStrikeoutsLedger, modelRecords }));
  }));

  app.get("/api/intelligence/brain/mlb/picks", requireAuth, requireTier("gold"), asyncHandler(async (req: RequestWithContext, res: Response) => {
    const parsedQuery = CentralBrainDailyQuerySchema.safeParse(req.query);
    if (!parsedQuery.success) {
      throw new AppError({ status: 400, code: "validation_error", message: "date must use YYYY-MM-DD format.", details: parsedQuery.error.issues });
    }
    const date = parsedQuery.data.date ?? new Date().toISOString().slice(0, 10);
    // Live server selection (or frozen ledger when present). Never depends on the HR board UI.
    const [bundle, aiReviews] = await Promise.all([
      getBrainMlbPicksForDate(date, 20),
      getBrainGeminiReviews(date),
    ]);
    return res.json(apiOkFlat(req, { ...bundle, aiReviews }));
  }));

  app.get("/api/intelligence/brain/mlb/scan", requireAuth, requireTier("gold"), asyncHandler(async (req: RequestWithContext, res: Response) => {
    const parsedQuery = CentralBrainDailyQuerySchema.safeParse(req.query);
    if (!parsedQuery.success) {
      throw new AppError({ status: 400, code: "validation_error", message: "date must use YYYY-MM-DD format.", details: parsedQuery.error.issues });
    }
    return res.json(apiOkFlat(req, { scan: await scanMlbSlate(parsedQuery.data.date) }));
  }));

  app.get("/api/cron/intelligence/brain/mlb", asyncHandler(async (req: RequestWithContext, res: Response) => {
    assertCronAuthorized(req);
    const parsedQuery = CentralBrainDailyQuerySchema.safeParse(req.query);
    if (!parsedQuery.success) {
      throw new AppError({ status: 400, code: "validation_error", message: "date must use YYYY-MM-DD format.", details: parsedQuery.error.issues });
    }
    return res.json(apiOkFlat(req, await executeBrainOperations(parsedQuery.data.date)));
  }));
}
