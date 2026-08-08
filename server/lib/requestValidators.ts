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

/** Calendar day in US Eastern, which is the timezone MLB slate dates follow. */
export function currentMlbYmd(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function shiftYmd(ymd: string, days: number): string {
  const shifted = new Date(`${ymd}T00:00:00Z`);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted.toISOString().slice(0, 10);
}

/**
 * A YYYY-MM-DD that also has to land inside a rolling window around today.
 *
 * `requiredYmd` alone accepts any syntactically valid date — roughly 3.6M of
 * them — and each distinct value becomes a fresh key in the board caches and a
 * fresh upstream build. The window keeps the reachable key space in the low
 * hundreds, which is what makes bounding those caches meaningful.
 */
export function windowedYmd(
  value: unknown,
  options: { pastDays: number; futureDays: number; field?: string; now?: Date },
): string {
  const field = options.field ?? "date";
  const date = requiredYmd(value, field);
  const today = currentMlbYmd(options.now);
  const min = shiftYmd(today, -options.pastDays);
  const max = shiftYmd(today, options.futureDays);

  if (date < min || date > max) {
    throw new AppError({
      status: 400,
      code: "validation_error",
      message: `${field} must be between ${min} and ${max}.`,
      details: [{ path: field, message: `Expected a date in ${min}..${max}.` }],
    });
  }

  return date;
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
    code: "upstream_unavailable",
    message,
    expose: true,
    cause,
  });
}
