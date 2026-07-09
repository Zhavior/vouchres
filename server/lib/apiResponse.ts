import type { Response } from "express";
import type { ApiResponseMeta } from "./apiResponseMeta";
import type { ApiErrorCode } from "./errorCodes";
import type { RequestWithContext } from "../middleware/requestContext";

export interface ApiRequestMeta {
  requestId: string;
  timestamp: string;
}

export type ApiErrorBody = {
  code: ApiErrorCode | string;
  message: string;
  requestId: string;
  details?: unknown;
};

export type ApiErrorResponse = {
  ok: false;
  error: ApiErrorBody;
  meta?: ApiRequestMeta;
};

export type ApiSuccessResponse<T> = {
  ok: true;
  data: T;
  meta?: ApiResponseMeta & ApiRequestMeta;
};

export function requestMeta(req: RequestWithContext): ApiRequestMeta {
  return {
    requestId: req.requestId ?? "unknown",
    timestamp: new Date().toISOString(),
  };
}

export function buildApiErrorResponse(input: {
  code: ApiErrorCode | string;
  message: string;
  requestId: string;
  details?: unknown;
}): ApiErrorResponse {
  const meta = {
    requestId: input.requestId,
    timestamp: new Date().toISOString(),
  };

  return {
    ok: false,
    error: {
      code: input.code,
      message: input.message,
      requestId: input.requestId,
      ...(input.details !== undefined ? { details: input.details } : {}),
    },
    meta,
  };
}

export function apiOk<T>(
  req: RequestWithContext,
  data: T,
  meta?: Partial<ApiResponseMeta>,
): ApiSuccessResponse<T> {
  return {
    ok: true,
    data,
    meta: {
      ...(meta ?? {}),
      ...requestMeta(req),
    } as ApiResponseMeta & ApiRequestMeta,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Backward-compatible success envelope that preserves legacy top-level fields. */
export function apiOkFlat(
  req: RequestWithContext,
  payload: Record<string, unknown>,
): Record<string, unknown> & { ok: true; meta?: ApiResponseMeta & ApiRequestMeta } {
  const existingMeta = isRecord(payload.meta) ? payload.meta : {};
  const { meta: _meta, ...rest } = payload;

  return {
    ok: true,
    ...rest,
    meta: {
      ...existingMeta,
      ...requestMeta(req),
    } as ApiResponseMeta & ApiRequestMeta,
  };
}

export function sendApiJson(
  res: Response,
  status: number,
  body: ApiErrorResponse | Record<string, unknown>,
  requestId?: string,
): Response {
  const resolvedRequestId =
    requestId ??
    (body.ok === false && isRecord(body.error) && typeof body.error.requestId === "string"
      ? body.error.requestId
      : isRecord(body.meta) && typeof body.meta.requestId === "string"
        ? body.meta.requestId
        : undefined);

  if (resolvedRequestId) {
    res.setHeader("x-request-id", resolvedRequestId);
  }

  return res.status(status).json(body);
}
