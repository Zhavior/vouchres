/** RFC-ish UUID string check for PostgREST filter interpolation safety. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

export function assertUuid(value: unknown, label = "id"): string {
  if (!isUuid(value)) {
    throw new Error(`Invalid ${label}: expected UUID`);
  }
  return value;
}

export function filterUuids(values: unknown[]): string[] {
  return values.filter(isUuid);
}
