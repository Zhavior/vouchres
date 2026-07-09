type ApiErrorEnvelope = {
  ok: false;
  error?: {
    code?: string;
    message?: string;
    requestId?: string;
    details?: unknown;
  };
};

type ApiSuccessEnvelope<T> = {
  ok: true;
  data?: T;
  meta?: Record<string, unknown>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Unwraps `{ ok, data }` and `{ ok, ...legacyFields }` success envelopes.
 * Throws a structured error object for `{ ok: false, error }` responses.
 */
export function unwrapApiPayload<T>(body: unknown): T {
  if (!isRecord(body) || !("ok" in body)) {
    return body as T;
  }

  if (body.ok === false) {
    const envelope = body as ApiErrorEnvelope;
    const err = envelope.error ?? { message: "request_failed" };
    throw {
      error: err.code ?? err.message ?? "request_failed",
      message: err.message,
      code: err.code,
      details: err.details,
      requestId: err.requestId,
    };
  }

  const envelope = body as ApiSuccessEnvelope<T> & Record<string, unknown>;
  if ("data" in envelope && envelope.data !== undefined) {
    return envelope.data as T;
  }

  const { ok: _ok, meta: _meta, error: _error, ...rest } = envelope;
  return rest as T;
}

export function parseApiErrorBody(body: unknown, status: number): Record<string, unknown> {
  if (isRecord(body) && body.ok === false && isRecord(body.error)) {
    return { ...body.error, status };
  }
  if (isRecord(body)) {
    return { ...body, status };
  }
  return { error: "request_failed", status };
}
