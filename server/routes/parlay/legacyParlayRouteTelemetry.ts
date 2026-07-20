import type { NextFunction, Response } from "express";
import { AppError } from "../../errors/AppError";
import type { RequestWithContext } from "../../middleware/requestContext";
import { recordLegacyRouteMetric } from "../../lib/observability/legacyRouteMetrics";
import { structuredLog } from "../../lib/structuredLog";

type LegacyParlayRouteLabel =
  | "legacy.parlay.list"
  | "legacy.parlay.detail"
  | "legacy.parlay.save"
  | "legacy.parlay.commit_trust"
  | "legacy.parlay.finalize_trust_lock";

function disabledLegacyCanonicalParlayRouteLabels(): Set<string> {
  const raw = process.env.DISABLE_LEGACY_CANONICAL_PARLAY_ROUTE_LABELS ?? "";
  return new Set(
    raw
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );
}

function legacyCanonicalParlayRouteDisabled(label: LegacyParlayRouteLabel): boolean {
  if (process.env.DISABLE_LEGACY_CANONICAL_PARLAY_ROUTES === "true") return true;
  return disabledLegacyCanonicalParlayRouteLabels().has(label);
}

export function markLegacyParlayRoute(label: LegacyParlayRouteLabel) {
  return (req: RequestWithContext, _res: Response, next: NextFunction) => {
    const sunsetDate = "Mon, 31 Aug 2026 00:00:00 GMT";
    _res.setHeader("Deprecation", "true");
    _res.setHeader("Sunset", sunsetDate);
    _res.setHeader("Link", '</api/v3>; rel="successor-version"');

    if (legacyCanonicalParlayRouteDisabled(label)) {
      return next(new AppError({
        status: 410,
        code: "gone",
        message: "Legacy canonical parlay routes are disabled. Use the V3 API path instead.",
        details: {
          label,
          canonicalTarget: "/api/v3",
          envFlags: [
            "DISABLE_LEGACY_CANONICAL_PARLAY_ROUTES",
            "DISABLE_LEGACY_CANONICAL_PARLAY_ROUTE_LABELS",
          ],
        },
      }));
    }

    recordLegacyRouteMetric({
      label,
      method: req.method,
      route: req.originalUrl.split("?")[0] || req.url,
      requestId: req.requestId,
    });

    structuredLog({
      level: "warn",
      event: "legacy_route_used",
      requestId: req.requestId,
      method: req.method,
      route: req.originalUrl || req.url,
      message: "Legacy canonical parlay route used; migrate callers to V3.",
      details: {
        area: "parlays",
        label,
        canonicalTarget: "/api/v3",
        sunsetAt: sunsetDate,
      },
    });
    next();
  };
}
