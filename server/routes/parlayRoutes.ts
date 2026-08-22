import { Router } from "express";
import { parlayCronRoutes } from "./parlay/parlayCronRoutes";
import { parlayUserRoutes } from "./parlay/parlayUserRoutes";
import { parlayLiveRoutes } from "./parlay/parlayLiveRoutes";

/**
 * Parlay routes — thin composer mounting cron, staff, and user sub-routers.
 *
 *   ./parlay/parlayCronRoutes  — Vercel cron + distributed-lock grade-due
 *   ./parlay/parlayUserRoutes  — non-lifecycle support and grade preview
 *
 * Canonical user and staff lifecycle routes live exclusively under /api/v3.
 */
export const parlayRoutes = Router();

parlayRoutes.use(parlayLiveRoutes);
parlayRoutes.use(parlayCronRoutes);
parlayRoutes.use(parlayUserRoutes);
