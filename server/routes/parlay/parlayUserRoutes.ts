import { Router } from "express";
import { requireAuth, requireLegalConfirmed } from "../../middleware/auth";
import { validate } from "../../middleware/validation";
import {
  getParlayHandler,
  listMyParlaysHandler,
  commitParlayTrustHandler,
  finalizeParlayTrustLockHandler,
  saveMeParlayHandler,
} from "../../controllers/parlayController";
import {
  ListParlaysQuerySchema,
  ParlayIdParamsSchema,
  SaveMeParlaySchema,
} from "../../validators/parlaySchemas";
import { mountParlaySupportRoutes } from "./mountParlaySupportRoutes";
import { markLegacyParlayRoute } from "./legacyParlayRouteTelemetry";

/** User-facing parlay routes — canonical lifecycle plus shared support flows. */
export const parlayUserRoutes = mountParlaySupportRoutes(Router());

parlayUserRoutes.get(
  "/parlays/:id",
  markLegacyParlayRoute("legacy.parlay.detail"),
  requireAuth,
  validate({ params: ParlayIdParamsSchema }),
  getParlayHandler,
);

parlayUserRoutes.get(
  "/me/parlays",
  markLegacyParlayRoute("legacy.parlay.list"),
  requireAuth,
  validate({ query: ListParlaysQuerySchema }),
  listMyParlaysHandler,
);

parlayUserRoutes.post(
  "/parlays/save",
  markLegacyParlayRoute("legacy.parlay.save"),
  requireAuth,
  requireLegalConfirmed,
  validate({ body: SaveMeParlaySchema }),
  saveMeParlayHandler,
);

parlayUserRoutes.post(
  "/parlays/:id/commit-trust",
  markLegacyParlayRoute("legacy.parlay.commit_trust"),
  requireAuth,
  validate({ params: ParlayIdParamsSchema }),
  commitParlayTrustHandler,
);

parlayUserRoutes.post(
  "/parlays/:id/finalize-trust-lock",
  markLegacyParlayRoute("legacy.parlay.finalize_trust_lock"),
  requireAuth,
  validate({ params: ParlayIdParamsSchema }),
  finalizeParlayTrustLockHandler,
);
