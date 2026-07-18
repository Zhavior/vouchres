import { randomUUID } from "node:crypto";
import type { Request, Response, NextFunction } from "express";

export type RequestWithContext = Request & {
  requestId?: string;
};

/** Reject log-poisoning / control-char inbound ids; fall back to a server UUID. */
const SAFE_REQUEST_ID = /^[A-Za-z0-9._-]{8,128}$/;

export function requestContext(req: RequestWithContext, res: Response, next: NextFunction) {
  const inbound = req.headers["x-request-id"];
  const candidate = typeof inbound === "string" ? inbound.trim().slice(0, 128) : "";
  const requestId = SAFE_REQUEST_ID.test(candidate) ? candidate : randomUUID();

  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);
  next();
}

