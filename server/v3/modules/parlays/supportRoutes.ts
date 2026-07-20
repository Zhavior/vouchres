import { Router } from "express";
import { mountParlaySupportRoutes } from "../../../routes/parlay/mountParlaySupportRoutes";

/**
 * V3 support routes reuse the shared support mount so legacy and V3 stay in
 * lockstep while canonical lifecycle endpoints are migrated separately.
 */
export const v3ParlaySupportRoutes = mountParlaySupportRoutes(Router());
