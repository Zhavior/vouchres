import { AppError } from "../errors/AppError";

/** ISO-like codes: `US`, `US-NV`, `CA-ON`. */
export const JURISDICTION_CODE_PATTERN = /^[A-Z]{2}(-[A-Z0-9]{2,})?$/;

export function normalizeJurisdictionCode(raw: string): string {
  return raw.trim().toUpperCase();
}

export function isValidJurisdictionCode(raw: string): boolean {
  return JURISDICTION_CODE_PATTERN.test(normalizeJurisdictionCode(raw));
}

function parseBlockedJurisdictionsFromEnv(): Set<string> {
  const raw = process.env.BLOCKED_JURISDICTIONS?.trim();
  if (!raw) return new Set();

  const blocked = new Set<string>();
  for (const part of raw.split(",")) {
    const code = normalizeJurisdictionCode(part);
    if (!code) continue;
    if (!JURISDICTION_CODE_PATTERN.test(code)) {
      console.warn(`[jurisdiction] ignoring invalid BLOCKED_JURISDICTIONS entry: ${part}`);
      continue;
    }
    blocked.add(code);
  }
  return blocked;
}

let cachedBlocked: Set<string> | null = null;

/** Operator-configured blocklist — empty by default (no stub that blocks every US state). */
export function getBlockedJurisdictions(): ReadonlySet<string> {
  if (!cachedBlocked) cachedBlocked = parseBlockedJurisdictionsFromEnv();
  return cachedBlocked;
}

/** Test helper — re-read env after vi.stubEnv. */
export function resetJurisdictionPolicyCacheForTests(): void {
  cachedBlocked = null;
}

export function assertJurisdictionAllowed(raw: string): void {
  const code = normalizeJurisdictionCode(raw);
  if (!JURISDICTION_CODE_PATTERN.test(code)) {
    throw new AppError({
      status: 400,
      code: "bad_request",
      message: "Jurisdiction must use ISO-like codes (e.g. US-NV, CA).",
      details: { field: "jurisdiction" },
    });
  }

  if (getBlockedJurisdictions().has(code)) {
    throw new AppError({
      status: 403,
      code: "forbidden",
      message: "This jurisdiction is not permitted.",
      details: { jurisdiction: code },
    });
  }
}
