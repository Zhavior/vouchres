import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireStaff } from "../../../middleware/auth";
import { validate } from "../../../middleware/validation";
import { asyncHandler } from "../../../lib/asyncHandler";
import { apiOkFlat } from "../../../lib/apiResponse";
import type { RequestWithContext } from "../../../middleware/requestContext";
import type { Response } from "express";
import {
  getLastSelfHealingLoopReport,
  runSelfHealingAction,
  runSelfHealingLoop,
  scanSelfHealingState,
} from "./selfHealingEngine";

export const v3SystemRoutes = Router();

const scanSchema = z.object({
  stalePendingHours: z.number().int().min(1).max(24 * 14).optional(),
  trustRefreshHours: z.number().int().min(1).max(24 * 14).optional(),
  trustRefreshLimit: z.number().int().min(1).max(200).optional(),
});

const loopSchema = z.object({
  dryRun: z.boolean().optional(),
  maxActions: z.number().int().min(1).max(10).optional(),
});

const actionSchema = z.object({
  dryRun: z.boolean().optional(),
});

v3SystemRoutes.get(
  "/health",
  asyncHandler(async (req: RequestWithContext, res: Response) => {
    try {
      const scan = await scanSelfHealingState();
      return res.json(apiOkFlat(req, {
        service: "vouchres-backend-v3",
        status: scan.healthy ? "ok" : "degraded",
        generatedAt: scan.generatedAt,
        issueCount: scan.checks.filter((check) => check.status === "drift_detected").length,
      }));
    } catch (error) {
      return res.json(apiOkFlat(req, {
        service: "vouchres-backend-v3",
        status: "degraded",
        generatedAt: new Date().toISOString(),
        issueCount: null,
        warnings: [
          error instanceof Error
            ? `self-healing scan unavailable: ${error.message}`
            : "self-healing scan unavailable",
        ],
      }));
    }
  }),
);

v3SystemRoutes.get(
  "/self-heal",
  requireAuth,
  requireStaff,
  asyncHandler(async (req: RequestWithContext, res: Response) => {
    const scan = await scanSelfHealingState();
    return res.json(apiOkFlat(req, {
      scan,
      lastLoop: getLastSelfHealingLoopReport(),
    }));
  }),
);

v3SystemRoutes.post(
  "/self-heal/scan",
  requireAuth,
  requireStaff,
  validate({ body: scanSchema }),
  asyncHandler(async (req: RequestWithContext, res: Response) => {
    const scan = await scanSelfHealingState(req.body ?? {});
    return res.json(apiOkFlat(req, { scan }));
  }),
);

v3SystemRoutes.post(
  "/self-heal/run",
  requireAuth,
  requireStaff,
  validate({ body: loopSchema }),
  asyncHandler(async (req: RequestWithContext, res: Response) => {
    const report = await runSelfHealingLoop(req.body ?? {});
    return res.json(apiOkFlat(req, { report }));
  }),
);

v3SystemRoutes.post(
  "/self-heal/actions/:actionId",
  requireAuth,
  requireStaff,
  validate({ body: actionSchema }),
  asyncHandler(async (req: RequestWithContext, res: Response) => {
    const report = await runSelfHealingAction(req.params.actionId as never, req.body ?? {});
    return res.json(apiOkFlat(req, { report }));
  }),
);
