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
 * On 401 from /api/auth/me, refreshes once and retries. A profile endpoint
 * failure never revokes the user's other sessions or destroys local auth.
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
  } = {},
  authRetried = false,
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

  // A briefly stale access token is recoverable. Refresh once, outside any auth
  // callback, then retry with Supabase's newly persisted token.
  if (res.status === 401) {
    const isAuthMe = path.startsWith('/api/auth/me');
    if (token && isAuthMe && !authRetried) {
      const { data, error } = await supabase.auth.refreshSession();
      if (!error && data.session?.access_token) {
        return request<T>(path, opts, true);
      }
    }
    const body = await res.json().catch(() => ({ error: 'unauthorized' }));
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
