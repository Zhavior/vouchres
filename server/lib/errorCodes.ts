/**
 * Canonical API error codes shared by AppError, route handlers, OpenAPI, and tests.
 */
export const API_ERROR_CODES = {
  bad_request: 400,
  validation_error: 400,
  missing_token: 401,
  invalid_token: 401,
  forbidden: 403,
  entitlement_required: 403,
  parlay_post_locked: 403,
  not_found: 404,
  gone: 410,
  conflict: 409,
  domain_state_error: 409,
  quota_exceeded: 429,
  rate_limited: 429,
  external_service_error: 502,
  upstream_unavailable: 503,
  internal_server_error: 500,
} as const;

export type ApiErrorCode = keyof typeof API_ERROR_CODES;

export const API_ERROR_CODE_SET = new Set<string>(Object.keys(API_ERROR_CODES));

export function isApiErrorCode(value: unknown): value is ApiErrorCode {
  return typeof value === "string" && API_ERROR_CODE_SET.has(value);
}

export function defaultStatusForErrorCode(code: ApiErrorCode): number {
  return API_ERROR_CODES[code];
}
