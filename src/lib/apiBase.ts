/**
 * Backend origin for all API calls.
 * - Local dev & node-server deploy: leave unset -> "" -> same-origin relative /api/... works.
 * - Vercel/static frontend: set VITE_API_BASE_URL to your deployed backend origin
 *   (e.g. https://vouchedge.onrender.com) so /api calls hit the live backend.
 */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) || "";

/** Prefix an /api path with the configured backend origin. */
export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Absolute origin for callers that must build a `URL` object rather than a
 * relative string. This is the single resolver: apiClient previously computed
 * `VITE_API_BASE_URL || window.location.origin` independently, so the two could
 * disagree about what the backend origin was. `API_BASE_URL` stays "" for the
 * relative same-origin case, and this adds the origin only where an absolute
 * base is structurally required.
 *
 * `|| not ??` is deliberate: VITE_API_BASE_URL="" must fall through.
 */
export function apiOrigin(): string {
  if (API_BASE_URL) return API_BASE_URL;
  return typeof window === "undefined" ? "http://localhost" : window.location.origin;
}
