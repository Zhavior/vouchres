export type AppErrorCode =
  | "bad_request"
  | "validation_error"
  | "missing_token"
  | "invalid_token"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "domain_state_error"
  | "entitlement_required"
  | "quota_exceeded"
  | "rate_limited"
  | "external_service_error"
  | "internal_server_error";

export interface AppErrorOptions {
  status: number;
  code: AppErrorCode;
  message: string;
  details?: unknown;
  expose?: boolean;
  cause?: unknown;
}

export class AppError extends Error {
  readonly status: number;
  readonly code: AppErrorCode;
  readonly details?: unknown;
  readonly expose: boolean;
  override readonly cause?: unknown;

  constructor(options: AppErrorOptions) {
    super(options.message);
    this.name = "AppError";
    this.status = options.status;
    this.code = options.code;
    this.details = options.details;
    this.expose = options.expose ?? options.status < 500;
    this.cause = options.cause;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

