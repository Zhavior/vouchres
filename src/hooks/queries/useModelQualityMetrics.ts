import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import { queryKeys } from './queryKeys';

/**
 * Client mirrors of the staff-only model-quality contracts:
 *   GET /api/v3/trust/calibration   (public.trust_calibration_metrics view)
 *   GET /api/v3/resolution/sla      (public.resolution_sla_metrics table)
 *
 * Field names and nullability are transcribed 1:1 from
 * supabase/migrations/20260727000001_trust_ledger_projections.sql and
 * supabase/migrations/20260727000002_resolution_engine.sql via
 * server/services/trust/trustCalibrationService.ts and
 * server/services/resolution/resolutionSlaService.ts.
 *
 * Every statistic is `number | null` because the database emits NULL for
 * statistics it cannot compute (e.g. stddev over a single row, or any
 * aggregate over an empty projection table). Nothing here defaults a null to
 * zero — the UI renders a no-data marker instead.
 */

export interface TrustCalibrationMetrics {
  total_users_with_trust: number | null;
  avg_trust_score: number | null;
  max_trust_score: number | null;
  min_trust_score: number | null;
  trust_score_stddev: number | null;
  total_commits: number | null;
  total_locks: number | null;
  total_grades: number | null;
  total_graded_wins: number | null;
  total_graded_losses: number | null;
  avg_win_rate: number | null;
}

export interface TrustCalibrationSnapshot {
  available: boolean;
  generatedAt: string;
  source: 'trust_calibration_metrics';
  metrics: TrustCalibrationMetrics | null;
  gradedDecided: number | null;
}

export interface ResolutionSlaWindow {
  id: string;
  window_start: string;
  window_end: string;
  sla_target_hours: number | null;
  sla_target_percentage: number | null;
  total_outcomes: number | null;
  sla_met_count: number | null;
  sla_missed_count: number | null;
  sla_percentage: number | null;
  avg_resolution_hours: number | null;
  p50_resolution_hours: number | null;
  p95_resolution_hours: number | null;
  max_resolution_hours: number | null;
  market_breakdown: Record<string, unknown>;
  created_at: string;
}

export interface ResolutionSlaSnapshot {
  available: boolean;
  generatedAt: string;
  source: 'resolution_sla_metrics';
  windowCount: number;
  latest: ResolutionSlaWindow | null;
  windows: ResolutionSlaWindow[];
}

export const RESOLUTION_SLA_WINDOW_LIMIT = 12;

export function useTrustCalibration() {
  return useQuery<TrustCalibrationSnapshot>({
    queryKey: queryKeys.trustCalibration(),
    queryFn: async () => {
      const response = await apiClient.get<{ calibration: TrustCalibrationSnapshot }>(
        '/api/v3/trust/calibration',
      );
      return response.calibration;
    },
    staleTime: 60_000,
    retry: false,
  });
}

export function useResolutionSla(limit: number = RESOLUTION_SLA_WINDOW_LIMIT) {
  return useQuery<ResolutionSlaSnapshot>({
    queryKey: queryKeys.resolutionSla(limit),
    queryFn: async () => {
      const response = await apiClient.get<{ sla: ResolutionSlaSnapshot }>(
        '/api/v3/resolution/sla',
        { limit },
      );
      return response.sla;
    },
    staleTime: 60_000,
    retry: false,
  });
}
