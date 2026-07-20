export interface LegacyRouteMetricsSnapshot {
  startedAt: string;
  uptimeMs: number;
  totals: {
    hits: number;
    uniqueRoutes: number;
  };
  routes: Array<{
    label: string;
    method: string;
    route: string;
    hits: number;
    lastSeenAt: string;
  }>;
  recent: Array<{
    at: string;
    label: string;
    method: string;
    route: string;
    requestId?: string;
  }>;
}

interface LegacyRouteBucket {
  label: string;
  method: string;
  route: string;
  hits: number;
  lastSeenAt: string;
}

interface LegacyRouteEvent {
  at: string;
  label: string;
  method: string;
  route: string;
  requestId?: string;
}

const MAX_RECENT_EVENTS = 50;
const startedAtMs = Date.now();
const startedAt = new Date(startedAtMs).toISOString();
const buckets = new Map<string, LegacyRouteBucket>();
const recent: LegacyRouteEvent[] = [];
let totalHits = 0;

export function recordLegacyRouteMetric(input: {
  label: string;
  method: string;
  route: string;
  requestId?: string;
}): void {
  const key = `${input.label}:${input.method}:${input.route}`;
  const now = new Date().toISOString();
  const bucket = buckets.get(key) ?? {
    label: input.label,
    method: input.method,
    route: input.route,
    hits: 0,
    lastSeenAt: now,
  };

  bucket.hits += 1;
  bucket.lastSeenAt = now;
  buckets.set(key, bucket);
  totalHits += 1;

  recent.push({
    at: now,
    label: input.label,
    method: input.method,
    route: input.route,
    requestId: input.requestId,
  });
  if (recent.length > MAX_RECENT_EVENTS) recent.splice(0, recent.length - MAX_RECENT_EVENTS);
}

export function getLegacyRouteMetricsSnapshot(now = new Date()): LegacyRouteMetricsSnapshot {
  const routes = [...buckets.values()]
    .sort((a, b) => b.hits - a.hits || b.lastSeenAt.localeCompare(a.lastSeenAt))
    .map((bucket) => ({
      label: bucket.label,
      method: bucket.method,
      route: bucket.route,
      hits: bucket.hits,
      lastSeenAt: bucket.lastSeenAt,
    }));

  return {
    startedAt,
    uptimeMs: now.getTime() - startedAtMs,
    totals: {
      hits: totalHits,
      uniqueRoutes: buckets.size,
    },
    routes,
    recent: [...recent].reverse(),
  };
}

export function resetLegacyRouteMetricsForTests(): void {
  buckets.clear();
  recent.splice(0, recent.length);
  totalHits = 0;
}
