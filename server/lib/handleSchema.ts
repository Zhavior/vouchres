import { z } from "zod";

export const HANDLE_MIN = 3;
export const HANDLE_MAX = 30;

/** Twitter-style: lowercase letter/digit first, then letters, digits, underscores. */
export const HANDLE_PATTERN = /^[a-z0-9][a-z0-9_]*$/;

export const RESERVED_HANDLES = new Set([
  "admin",
  "api",
  "auth",
  "billing",
  "help",
  "login",
  "logout",
  "moderator",
  "null",
  "root",
  "settings",
  "signup",
  "staff",
  "support",
  "system",
  "undefined",
  "vouchedge",
  "welcome",
]);

export const HandleSchema = z
  .string()
  .trim()
  .transform((value) => value.toLowerCase())
  .pipe(
    z
      .string()
      .min(HANDLE_MIN)
      .max(HANDLE_MAX)
      .regex(HANDLE_PATTERN),
  );

export function normalizeHandle(raw: string): string {
  return raw.trim().toLowerCase();
}

export type HandleValidationResult =
  | { ok: true; handle: string }
  | { ok: false; reason: string };

export function validateHandle(raw: string): HandleValidationResult {
  const normalized = normalizeHandle(raw);
  if (!normalized) {
    return { ok: false, reason: "invalid_length" };
  }
  if (normalized.length < HANDLE_MIN || normalized.length > HANDLE_MAX) {
    return { ok: false, reason: "invalid_length" };
  }
  if (!HANDLE_PATTERN.test(normalized)) {
    return { ok: false, reason: "invalid_format" };
  }
  if (RESERVED_HANDLES.has(normalized)) {
    return { ok: false, reason: "reserved" };
  }
  return { ok: true, handle: normalized };
}
