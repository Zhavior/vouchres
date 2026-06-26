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
