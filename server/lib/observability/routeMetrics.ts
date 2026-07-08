export interface RouteMetricsSnapshot {
  startedAt: string;
  uptimeMs: number;
  totals: {
    requests: number;
    errors: number;
    slowRequests: number;
  };
  latencyMs: {
    avg: number;
    p95: number;
    max: number;
  };
  statusClasses: Record<"2xx" | "3xx" | "4xx" | "5xx", number>;
  routes: Array<{
    method: string;
    route: string;
    requests: number;
    errors: number;
    avgMs: number;
    p95Ms: number;
    maxMs: number;
  }>;
  recent: Array<{
    at: string;
    method: string;
    route: string;
    status: number;
    durationMs: number;
    requestId?: string;
  }>;
}

interface RouteBucket {
  method: string;
  route: string;
  requests: number;
  errors: number;
  durations: number[];
  maxMs: number;
}

interface RecentRouteEvent {
  at: string;
  method: string;
  route: string;
  status: number;
  durationMs: number;
  requestId?: string;
}

const MAX_DURATIONS_PER_ROUTE = 200;
const MAX_RECENT_EVENTS = 50;
const SLOW_REQUEST_MS = Number(process.env.API_SLOW_REQUEST_MS ?? 1_500);

const startedAtMs = Date.now();
const startedAt = new Date(startedAtMs).toISOString();
const routes = new Map<string, RouteBucket>();
const recent: RecentRouteEvent[] = [];
const statusClasses = {
  "2xx": 0,
  "3xx": 0,
  "4xx": 0,
  "5xx": 0,
};

let totalRequests = 0;
let totalErrors = 0;
let totalSlowRequests = 0;
let totalDurationMs = 0;
let maxDurationMs = 0;
const globalDurations: number[] = [];

function statusClass(status: number): keyof typeof statusClasses {
  if (status >= 500) return "5xx";
  if (status >= 400) return "4xx";
  if (status >= 300) return "3xx";
  return "2xx";
}

function percentile(values: number[], pct: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((pct / 100) * sorted.length) - 1);
  return sorted[index] ?? 0;
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function trimDurations(values: number[], max: number): void {
  if (values.length > max) values.splice(0, values.length - max);
}

function roundMs(value: number): number {
  return Math.round(value);
}

export function recordRouteMetric(input: {
  method: string;
  route: string;
  status: number;
  durationMs: number;
  requestId?: string;
}): void {
  const route = input.route || "unknown";
  const key = `${input.method} ${route}`;
  const bucket = routes.get(key) ?? {
    method: input.method,
    route,
    requests: 0,
    errors: 0,
    durations: [],
    maxMs: 0,
  };

  bucket.requests += 1;
  bucket.durations.push(input.durationMs);
  trimDurations(bucket.durations, MAX_DURATIONS_PER_ROUTE);
  bucket.maxMs = Math.max(bucket.maxMs, input.durationMs);
  if (input.status >= 500) bucket.errors += 1;
  routes.set(key, bucket);

  totalRequests += 1;
  totalDurationMs += input.durationMs;
  maxDurationMs = Math.max(maxDurationMs, input.durationMs);
  if (input.status >= 500) totalErrors += 1;
  if (input.durationMs >= SLOW_REQUEST_MS) totalSlowRequests += 1;

  globalDurations.push(input.durationMs);
  trimDurations(globalDurations, 1_000);
  statusClasses[statusClass(input.status)] += 1;

  if (input.status >= 500 || input.durationMs >= SLOW_REQUEST_MS) {
    recent.push({
      at: new Date().toISOString(),
      method: input.method,
      route,
      status: input.status,
      durationMs: roundMs(input.durationMs),
      requestId: input.requestId,
    });
    if (recent.length > MAX_RECENT_EVENTS) recent.splice(0, recent.length - MAX_RECENT_EVENTS);
  }
}

export function getRouteMetricsSnapshot(now = new Date()): RouteMetricsSnapshot {
  const routeRows = [...routes.values()]
    .map((bucket) => ({
      method: bucket.method,
      route: bucket.route,
      requests: bucket.requests,
      errors: bucket.errors,
      avgMs: roundMs(avg(bucket.durations)),
      p95Ms: roundMs(percentile(bucket.durations, 95)),
      maxMs: roundMs(bucket.maxMs),
    }))
    .sort((a, b) => b.requests - a.requests || b.maxMs - a.maxMs)
    .slice(0, 25);

  return {
    startedAt,
    uptimeMs: now.getTime() - startedAtMs,
    totals: {
      requests: totalRequests,
      errors: totalErrors,
      slowRequests: totalSlowRequests,
    },
    latencyMs: {
      avg: totalRequests > 0 ? roundMs(totalDurationMs / totalRequests) : 0,
      p95: roundMs(percentile(globalDurations, 95)),
      max: roundMs(maxDurationMs),
    },
    statusClasses: { ...statusClasses },
    routes: routeRows,
    recent: [...recent].reverse(),
  };
}

export function resetRouteMetricsForTests(): void {
  routes.clear();
  recent.splice(0, recent.length);
  statusClasses["2xx"] = 0;
  statusClasses["3xx"] = 0;
  statusClasses["4xx"] = 0;
  statusClasses["5xx"] = 0;
  totalRequests = 0;
  totalErrors = 0;
  totalSlowRequests = 0;
  totalDurationMs = 0;
  maxDurationMs = 0;
  globalDurations.splice(0, globalDurations.length);
}
