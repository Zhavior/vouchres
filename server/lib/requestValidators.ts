import { AppError } from "../errors/AppError";

const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;

function firstQueryValue(value: unknown): unknown {
  return Array.isArray(value) ? value[0] : value;
}

export function requiredYmd(value: unknown, field = "date"): string {
  const raw = firstQueryValue(value);
  if (typeof raw === "string" && YMD_RE.test(raw.trim())) return raw.trim();

  throw new AppError({
    status: 400,
    code: "validation_error",
    message: `${field} must use YYYY-MM-DD format.`,
    details: [{ path: field, message: "Expected YYYY-MM-DD." }],
  });
}

export function optionalYmd(value: unknown, field = "date"): string | undefined {
  const raw = firstQueryValue(value);
  if (raw == null || raw === "") return undefined;
  return requiredYmd(raw, field);
}

export function ymdOrDefault(value: unknown, fallback: string, field = "date"): string {
  return optionalYmd(value, field) ?? fallback;
}

export function positiveInt(value: unknown, field: string): number {
  const raw = firstQueryValue(value);
  const normalized = typeof raw === "string" ? raw.trim() : String(raw ?? "");
  if (/^\d+$/.test(normalized)) {
    const parsed = Number(normalized);
    if (Number.isSafeInteger(parsed) && parsed > 0) return parsed;
  }

  throw new AppError({
    status: 400,
    code: "validation_error",
    message: `${field} must be a positive integer.`,
    details: [{ path: field, message: "Expected positive integer." }],
  });
}

export function boundedInt(value: unknown, field: string, fallback: number, min: number, max: number): number {
  const raw = firstQueryValue(value);
  const normalized = raw == null || raw === "" ? fallback : raw;
  const parsed = Number(normalized);
  if (Number.isInteger(parsed) && parsed >= min && parsed <= max) return parsed;

  throw new AppError({
    status: 400,
    code: "validation_error",
    message: `${field} must be an integer between ${min} and ${max}.`,
    details: [{ path: field, message: `Expected integer ${min}-${max}.` }],
  });
}

export function boolQuery(value: unknown, fallback: boolean, field = "dryRun"): boolean {
  const raw = firstQueryValue(value);
  if (raw == null || raw === "") return fallback;
  const normalized = String(raw).trim().toLowerCase();
  if (["true", "1", "yes"].includes(normalized)) return true;
  if (["false", "0", "no"].includes(normalized)) return false;

  throw new AppError({
    status: 400,
    code: "validation_error",
    message: `${field} must be true or false.`,
    details: [{ path: field, message: "Expected boolean." }],
  });
}

export function upstreamUnavailable(message: string, cause: unknown): AppError {
  return new AppError({
    status: 503,
    code: "external_service_error",
    message,
    cause,
  });
}
