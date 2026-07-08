import { Router } from "express";
import type { Response } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { buildOpenApiDocument } from "../openapi/openapiRegistry";

export const openapiRoutes = Router();

openapiRoutes.get("/openapi.json", asyncHandler(async (_req, res: Response) => {
  const doc = buildOpenApiDocument();
  res.setHeader("Cache-Control", "public, max-age=300");
  return res.json(doc);
}));
