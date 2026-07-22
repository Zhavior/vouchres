import { getAuthToken, supabase } from "./supabaseClient";
import { parseApiErrorBody, unwrapApiPayload } from "./apiEnvelope";
import { recordHrBoardCacheControl } from "./hrBoardCache";

/**
 * Authenticated fetch helper — replaces apiBase.getJson / postJson.
 *
 * Automatically attaches:
 *   - Authorization: Bearer <token>  (when logged in)
 *   - Content-Type: application/json  (when body present)
 *   - X-Client-Version: from package.json (for client-compat checks)
 *
 * On 401 from /api/auth/me, signs the user out via Supabase. Other 401s are
 * surfaced to callers without killing the session (tier gates, etc.).
 */
const CLIENT_VERSION = import.meta.env.VITE_CLIENT_VERSION ?? "0.1.0-beta";

export interface ApiError {
  error: string;
  message?: string;
  details?: any;
  [key: string]: any;
}

async function request<T = any>(
  path: string,
  opts: {
    method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
    body?: any;
    query?: Record<string, string | number | boolean | undefined>;
    signal?: AbortSignal;
  } = {}
): Promise<T> {
  const url = new URL(
    path,
    // Use || not ?? — empty string VITE_API_BASE_URL="" must fall through to window.location.origin
    import.meta.env.VITE_API_BASE_URL || window.location.origin
  );
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }
  }

  const headers: Record<string, string> = {
    "X-Client-Version": CLIENT_VERSION,
  };

  if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const token = await getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url.toString(), {
    method: opts.method ?? "GET",
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
    credentials: "include",
  });

  // Handle 401 — only force sign-out for session validation, not tier-gated resources.
  // Pro Lab routes can return 401 for Basic users; signing out globally would drop
  // them back to the logged-out landing page instead of showing the paywall.
  if (res.status === 401) {
    const body = await res.json().catch(() => ({ error: 'unauthorized' }));
    const isAuthMe = path.startsWith('/api/auth/me');
    if (token && isAuthMe) {
      await supabase.auth.signOut();
    }
    const parsed = parseApiErrorBody(body, res.status) as ApiError;
    throw { ...parsed, status: 401 } as ApiError;
  }

  // Handle 402 / 429 — paywall / quota — caller decides UX
  if (res.status === 402 || res.status === 429) {
    const body = await res.json().catch(() => ({ error: "unknown" }));
    throw { ...body, status: res.status } as ApiError;
  }

  const body = await res.json().catch(() => ({ error: "request_failed" }));

  if (!res.ok) {
    throw parseApiErrorBody(body, res.status) as ApiError;
  }

  if (path.includes("/api/mlb/hr-board/")) {
    recordHrBoardCacheControl(res.headers.get("cache-control"));
  }

  return unwrapApiPayload<T>(body);
}

export const apiClient = {
  get: <T = any>(path: string, query?: Record<string, any>, signal?: AbortSignal) =>
    request<T>(path, { method: "GET", query, signal }),
  post: <T = any>(path: string, body?: any) =>
    request<T>(path, { method: "POST", body }),
  patch: <T = any>(path: string, body?: any) =>
    request<T>(path, { method: "PATCH", body }),
  put: <T = any>(path: string, body?: any) =>
    request<T>(path, { method: "PUT", body }),
  delete: <T = any>(path: string, body?: any) =>
    request<T>(path, { method: "DELETE", body }),
};
