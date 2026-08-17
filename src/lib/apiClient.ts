import { getAuthToken, supabase } from "./supabaseClient";
import { apiOrigin } from "./apiBase";
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

/**
 * Default request deadline. This client previously had none, so a request that
 * never settled hung forever — vouchedgeApi and safeJsonFetch both enforce 12s,
 * and the layer carrying every authenticated call had no ceiling at all.
 * Long-running AI routes get a wider budget rather than a special case at each
 * call site.
 */
const DEFAULT_TIMEOUT_MS = 15_000;
const SLOW_PATH_TIMEOUT_MS = 45_000;
const SLOW_PATHS = ["/api/ai/", "/api/agents/", "/api/judge/", "/api/intelligence/"];

function timeoutForPath(path: string): number {
  return SLOW_PATHS.some((p) => path.includes(p)) ? SLOW_PATH_TIMEOUT_MS : DEFAULT_TIMEOUT_MS;
}

/**
 * Abort when either the caller's signal fires or the deadline elapses, without
 * discarding the caller's signal (react-query relies on it for cancellation).
 */
function withDeadline(signal: AbortSignal | undefined, ms: number): {
  signal: AbortSignal;
  cleanup: () => void;
  timedOut: () => boolean;
} {
  const controller = new AbortController();
  let timedOut = false;

  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, ms);

  const onAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener("abort", onAbort, { once: true });
  }

  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
    },
    timedOut: () => timedOut,
  };
}

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
    /** Override the per-path default deadline. */
    timeoutMs?: number;
  } = {},
  authRetried = false,
): Promise<T> {
  // Single origin resolver shared with apiBase.apiUrl — these used to be two
  // independent expressions that could disagree.
  const url = new URL(path, apiOrigin());
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

  const deadline = withDeadline(opts.signal, opts.timeoutMs ?? timeoutForPath(path));
  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method: opts.method ?? "GET",
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: deadline.signal,
      credentials: "include",
    });
  } catch (err) {
    // Distinguish our deadline from a caller-initiated abort, so a timeout is
    // reported as a timeout rather than surfacing as a generic cancellation.
    if (deadline.timedOut()) {
      throw {
        error: "request_timeout",
        message: `Request to ${path} exceeded ${opts.timeoutMs ?? timeoutForPath(path)}ms.`,
        status: 408,
      } as ApiError;
    }
    throw err;
  } finally {
    deadline.cleanup();
  }

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
  get: <T = any>(path: string, query?: Record<string, any>, signal?: AbortSignal, timeoutMs?: number) =>
    request<T>(path, { method: "GET", query, signal, timeoutMs }),
  post: <T = any>(path: string, body?: any, timeoutMs?: number) =>
    request<T>(path, { method: "POST", body, timeoutMs }),
  patch: <T = any>(path: string, body?: any, timeoutMs?: number) =>
    request<T>(path, { method: "PATCH", body, timeoutMs }),
  put: <T = any>(path: string, body?: any, timeoutMs?: number) =>
    request<T>(path, { method: "PUT", body, timeoutMs }),
  delete: <T = any>(path: string, body?: any, timeoutMs?: number) =>
    request<T>(path, { method: "DELETE", body, timeoutMs }),
};
