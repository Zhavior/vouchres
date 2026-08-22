import { Router } from "express";
import { mountParlaySupportRoutes } from "./mountParlaySupportRoutes";

/**
 * Non-lifecycle support routes retained at /api for compatibility with research
 * and stateless preview tools. Save/list/detail/trust lifecycle ownership is V3.
 */
export const parlayUserRoutes = mountParlaySupportRoutes(Router());
