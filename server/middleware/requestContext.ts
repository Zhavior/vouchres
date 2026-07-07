import { randomUUID } from "node:crypto";
import type { Request, Response, NextFunction } from "express";

export type RequestWithContext = Request & {
  requestId?: string;
};

export function requestContext(req: RequestWithContext, res: Response, next: NextFunction) {
  const inbound = req.headers["x-request-id"];
  const requestId =
    typeof inbound === "string" && inbound.trim().length > 0
      ? inbound.trim().slice(0, 128)
      : randomUUID();

  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);
  next();
}

