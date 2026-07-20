import type { Express } from "express";
import { v3BillingRoutes } from "../modules/billing/routes";
import { v3GradingRoutes } from "../modules/grading/routes";
import { v3ParlayRoutes } from "../modules/parlays/routes";
import { v3SystemRoutes } from "../modules/system/routes";
import { v3TrustRoutes } from "../modules/trust/routes";

export function registerV3Routes(app: Express): void {
  app.use("/api/v3/system", v3SystemRoutes);
  app.use("/api/v3/trust", v3TrustRoutes);
  app.use("/api/v3/grading", v3GradingRoutes);
  app.use("/api/v3/billing", v3BillingRoutes);
  app.use("/api/v3", v3ParlayRoutes);
}
