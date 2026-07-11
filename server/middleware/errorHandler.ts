import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError, isAppError } from "../errors/AppError";
import { buildApiErrorResponse } from "../lib/apiResponse";
import { captureException, isSentryEnabled } from "../lib/sentry";
import { sendOpsAlert } from "../lib/opsAlert";
import { structuredLog } from "../lib/structuredLog";
import type { RequestWithContext } from "./requestContext";

function statusFromUnknown(error: unknown): number {
  const status = Number((error as { status?: unknown; statusCode?: unknown })?.status ?? (error as { statusCode?: unknown })?.statusCode);
  return status >= 400 && status < 600 ? status : 500;
}

function normalizeError(error: unknown): AppError {
  if (isAppError(error)) return error;

  if (error instanceof ZodError) {
    return new AppError({
      status: 400,
      code: "validation_error",
      message: "Request validation failed.",
      details: error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  const status = statusFromUnknown(error);
  return new AppError({
    status,
    code: status === 404 ? "not_found" : status >= 500 ? "internal_server_error" : "bad_request",
    message: error instanceof Error ? error.message : "Request failed.",
    expose: status < 500,
    cause: error,
  });
}

export const apiErrorHandler: ErrorRequestHandler = (error, req: RequestWithContext, res, next) => {
  if (res.headersSent) return next(error);

  const normalized = normalizeError(error);
  const requestId = req.requestId ?? "unknown";
  const status = normalized.status >= 400 && normalized.status < 600 ? normalized.status : 500;
  const message = normalized.expose ? normalized.message : "Internal server error.";

  structuredLog({
    level: status >= 500 ? "error" : "warn",
    event: status >= 500 ? "error" : "warn",
    requestId,
    method: req.method,
    route: req.originalUrl,
    status,
    code: normalized.code,
    message: normalized.message,
    ...(normalized.details !== undefined ? { details: normalized.details } : {}),
  });

  if (status >= 500) {
    if (isSentryEnabled()) {
      captureException(normalized.cause ?? normalized, {
        requestId,
        method: req.method,
        path: req.originalUrl,
        code: normalized.code,
      });
    }
    void sendOpsAlert({
      severity: "critical",
      title: `API ${status}: ${normalized.code}`,
      detail: normalized.message,
      requestId,
      tags: { route: req.originalUrl, method: req.method ?? "?" },
    });
  }

  res.setHeader("x-request-id", requestId);

  return res.status(status).json(
    buildApiErrorResponse({
      code: normalized.code,
      message,
      requestId,
      details: normalized.details,
    }),
  );
};
