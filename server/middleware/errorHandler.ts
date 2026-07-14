import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError, isAppError } from "../errors/AppError";
import { buildApiErrorResponse } from "../lib/apiResponse";
import { captureException, isSentryEnabled } from "../lib/sentry";
import { structuredLog } from "../lib/structuredLog";
import type { RequestWithContext } from "./requestContext";

/** Curated 5xx codes that may return a safe, non-leaking operational message. */
const OPERATIONAL_5XX_CODES = new Set(["upstream_unavailable", "external_service_error"]);

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

function isOperationalServerError(error: AppError): boolean {
  return error.status >= 500 && OPERATIONAL_5XX_CODES.has(error.code);
}

export const apiErrorHandler: ErrorRequestHandler = (error, req: RequestWithContext, res, next) => {
  if (res.headersSent) return next(error);

  const normalized = normalizeError(error);
  const requestId = req.requestId ?? "unknown";
  const status = normalized.status >= 400 && normalized.status < 600 ? normalized.status : 500;
  const isServerError = status >= 500;
  const operational = isOperationalServerError(normalized);

  // True internal 5xx: opaque message, internal_server_error code, no details.
  // Operational 5xx (upstream unavailable): curated message + semantic code, still no details.
  const clientMessage = isServerError
    ? (operational && normalized.expose ? normalized.message : "Internal server error.")
    : (normalized.expose ? normalized.message : "Request failed.");
  const clientCode = isServerError
    ? (operational ? normalized.code : "internal_server_error")
    : normalized.code;
  const clientDetails = isServerError ? undefined : normalized.details;

  structuredLog({
    level: isServerError ? "error" : "warn",
    event: isServerError ? "error" : "warn",
    requestId,
    method: req.method,
    route: req.originalUrl,
    status,
    code: normalized.code,
    message: normalized.message,
    ...(normalized.details !== undefined ? { details: normalized.details } : {}),
  });

  if (isServerError && isSentryEnabled()) {
    captureException(normalized.cause ?? normalized, {
      requestId,
      method: req.method,
      path: req.originalUrl,
      code: normalized.code,
    });
  }

  res.setHeader("x-request-id", requestId);

  return res.status(status).json(
    buildApiErrorResponse({
      code: clientCode,
      message: clientMessage,
      requestId,
      details: clientDetails,
    }),
  );
};
