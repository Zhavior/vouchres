/**
 * MLB Stats API person IDs are numeric. App roster stubs use `mlbapi_${id}`.
 * Never interpolate a stub id into /people/{id}/stats — Stats API 400s.
 */
export function resolveMlbPersonId(raw: unknown, headshot?: string | null): number | null {
  if (typeof raw === 'number' && Number.isInteger(raw) && raw > 0) return raw;
  const s = String(raw ?? '').trim();
  const prefixed = /^mlbapi_(\d+)$/i.exec(s)?.[1];
  const digits = /^\d+$/.test(s) ? s : null;
  const fromHeadshot = headshot?.match(/\/people\/(\d+)\//)?.[1] ?? null;
  const n = Number(prefixed ?? digits ?? fromHeadshot);
  return Number.isInteger(n) && n > 0 ? n : null;
}
