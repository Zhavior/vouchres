import { Router } from "express";
import { parlayCronRoutes } from "./parlay/parlayCronRoutes";
import { parlayStaffRoutes } from "./parlay/parlayStaffRoutes";
import { parlayUserRoutes } from "./parlay/parlayUserRoutes";

/**
 * Parlay routes — thin composer mounting cron, staff, and user sub-routers.
 *
 *   ./parlay/parlayCronRoutes  — Vercel cron + distributed-lock grade-due
 *   ./parlay/parlayStaffRoutes — staff-only grading + live HR sync
 *   ./parlay/parlayUserRoutes  — authenticated save/list/grade-preview
 */
export const parlayRoutes = Router();

parlayRoutes.use(parlayCronRoutes);
parlayRoutes.use(parlayStaffRoutes);
parlayRoutes.use(parlayUserRoutes);
