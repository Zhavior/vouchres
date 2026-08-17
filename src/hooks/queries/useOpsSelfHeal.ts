import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import { queryKeys } from './queryKeys';

/**
 * Client mirrors of the staff-only ops contracts already served by the
 * deployed API:
 *   GET  /api/v3/system/self-heal                    (scan + last loop report)
 *   POST /api/v3/system/self-heal/scan               (fresh scan)
 *   POST /api/v3/system/self-heal/run                (repair loop)
 *   POST /api/v3/system/self-heal/actions/:actionId  (single action)
 *   GET  /api/health/metrics                         (route/grade telemetry)
 *   GET  /api/system/core-health                     (route registration)
 *
 * Types are transcribed from server/v3/modules/system/selfHealingEngine.ts and
 * server/lib/observability/*.ts. Nothing here invents a field the server does
 * not send.
 */

export type SelfHealSeverity = 'info' | 'warn' | 'critical';
export type SelfHealStatus = 'ok' | 'drift_detected';

export interface SelfHealCheck {
  id: string;
  title: string;
  status: SelfHealStatus;
  severity: SelfHealSeverity;
  detectedCount: number;
  detail: string;
  repairActionIds: string[];
}

export interface SelfHealActionDefinition {
  id: string;
  title: string;
  description: string;
  dryRunSupported: boolean;
}

export interface SelfHealActionResult {
  actionId: string;
  title: string;
  dryRun: boolean;
  ok: boolean;
  summary: Record<string, unknown>;
  startedAt: string;
  finishedAt: string;
}

export interface SelfHealScanReport {
  generatedAt: string;
  healthy: boolean;
  checks: SelfHealCheck[];
  actionCatalog: SelfHealActionDefinition[];
}

export interface SelfHealLoopReport {
  startedAt: string;
  finishedAt: string;
  dryRun: boolean;
  before: SelfHealScanReport;
  actions: SelfHealActionResult[];
  after: SelfHealScanReport;
}

export interface SelfHealOverview {
  scan: SelfHealScanReport;
  lastLoop: SelfHealLoopReport | null;
}

export interface RouteMetricsSnapshot {
  startedAt: string;
  uptimeMs: number;
  totals: { requests: number; errors: number; slowRequests: number };
  latencyMs: { avg: number; p95: number; max: number };
  statusClasses: Record<'2xx' | '3xx' | '4xx' | '5xx', number>;
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

export interface ParlayGradeMetricsSnapshot {
  contractVersion: string;
  startedAt: string;
  uptimeMs: number;
  totals: {
    requests: number;
    successes: number;
    validationErrors: number;
    failures: number;
    allLegsPending: number;
  };
  latencyMs: { avg: number; p95: number; max: number };
  legs: { avgPerRequest: number; totalGraded: number };
  validationFailurePaths: Array<{ path: string; count: number }>;
  recent: Array<{
    at: string;
    outcome: string;
    durationMs: number;
    legCount: number;
    requestId?: string;
  }>;
}

export interface LegacyRouteMetricsSnapshot {
  startedAt: string;
  uptimeMs: number;
  totals: { hits: number; uniqueRoutes: number };
  routes: Array<{ label: string; method: string; route: string; hits: number; lastSeenAt: string }>;
  recent: Array<{ at: string; label: string; method: string; route: string; requestId?: string }>;
}

export interface HealthMetricsPayload {
  service?: string;
  schema?: string;
  updatedAt?: string;
  metrics?: RouteMetricsSnapshot;
  parlayGrade?: ParlayGradeMetricsSnapshot;
  legacyRoutes?: LegacyRouteMetricsSnapshot;
}

export interface CoreHealthPayload {
  status?: string;
  service?: string;
  routes?: Record<string, boolean>;
  time?: string;
}

export interface SelfHealRunInput {
  dryRun: boolean;
  maxActions: number;
}

export interface SelfHealActionInput {
  actionId: string;
  dryRun: boolean;
}

export function useSelfHealOverview() {
  return useQuery<SelfHealOverview>({
    queryKey: queryKeys.opsSelfHeal(),
    queryFn: () => apiClient.get<SelfHealOverview>('/api/v3/system/self-heal'),
    staleTime: 30_000,
    retry: false,
  });
}

export function useOpsRouteMetrics() {
  return useQuery<HealthMetricsPayload>({
    queryKey: queryKeys.opsRouteMetrics(),
    queryFn: () => apiClient.get<HealthMetricsPayload>('/api/health/metrics'),
    staleTime: 15_000,
    retry: false,
  });
}

export function useOpsCoreHealth() {
  return useQuery<CoreHealthPayload>({
    queryKey: queryKeys.opsCoreHealth(),
    queryFn: () => apiClient.get<CoreHealthPayload>('/api/system/core-health'),
    staleTime: 60_000,
    retry: false,
  });
}

/** Re-scan without repairing. Refreshes the overview cache in place. */
export function useSelfHealScanMutation() {
  const queryClient = useQueryClient();
  return useMutation<SelfHealScanReport, unknown, void>({
    mutationFn: async () => {
      const response = await apiClient.post<{ scan: SelfHealScanReport }>(
        '/api/v3/system/self-heal/scan',
        {},
      );
      return response.scan;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.opsSelfHeal() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.opsRouteMetrics() });
    },
  });
}

/** State-changing repair loop. Callers must confirm before invoking. */
export function useSelfHealRunMutation() {
  const queryClient = useQueryClient();
  return useMutation<SelfHealLoopReport, unknown, SelfHealRunInput>({
    mutationFn: async (input) => {
      const response = await apiClient.post<{ report: SelfHealLoopReport }>(
        '/api/v3/system/self-heal/run',
        { dryRun: input.dryRun, maxActions: input.maxActions },
      );
      return response.report;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.opsSelfHeal() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.opsRouteMetrics() });
    },
  });
}

/**
 * Executes one catalog action. The server exposes no read-only per-action
 * status endpoint, so inspecting an action means running it with dryRun:true.
 */
export function useSelfHealActionMutation() {
  const queryClient = useQueryClient();
  return useMutation<SelfHealActionResult, unknown, SelfHealActionInput>({
    mutationFn: async (input) => {
      const response = await apiClient.post<{ report: SelfHealActionResult }>(
        `/api/v3/system/self-heal/actions/${encodeURIComponent(input.actionId)}`,
        { dryRun: input.dryRun },
      );
      return response.report;
    },
    onSuccess: (report) => {
      if (!report.dryRun) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.opsSelfHeal() });
      }
      void queryClient.invalidateQueries({ queryKey: queryKeys.opsRouteMetrics() });
    },
  });
}
