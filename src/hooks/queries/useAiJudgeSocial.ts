import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import { queryKeys } from './queryKeys';

/**
 * Client bindings for the AI-judge social pipeline
 * (server/routes/aiJudgeSocialRoutes.ts). Every field below is returned by the
 * server — nothing here synthesizes a value the API did not send.
 */

export type AiJudgeId = 'data_scout' | 'power_hunter' | 'momentum_reader' | 'risk_auditor';

export interface AiJudge {
  id?: AiJudgeId | string;
  name?: string;
  icon?: string;
  personality?: string;
  strategy?: string;
}

export interface AiJudgeCandidate {
  playerId?: number | string;
  playerName?: string;
  name?: string;
  team?: string;
  opponent?: string;
  opponentTeam?: string;
  opponentPitcherName?: string;
  venue?: string;
  hrScore?: number;
  riskTier?: string;
  confidenceTier?: string;
  estimatedHrProbability?: number;
  reasons?: string[];
  warnings?: string[];
  status?: string;
  lineupStatus?: string;
  injuryStatus?: string;
}

export type SocialDraftStatus = 'draft' | 'queued' | 'mock_posted' | 'failed';

export interface SocialDraft {
  id: string;
  judgeId?: string;
  judgeName?: string;
  postType?: 'hr_picks' | 'risk_report' | 'pro_preview' | string;
  platform?: string;
  status?: SocialDraftStatus | string;
  date?: string;
  scheduledFor?: string;
  content?: string;
  picks?: AiJudgeCandidate[];
  mockPostId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AiJudgeJudgesResponse {
  status?: string;
  mode?: string;
  judges?: AiJudge[];
}

export interface AiJudgeDraftsResponse {
  status?: string;
  mode?: string;
  drafts?: SocialDraft[];
}

export interface GenerateHrDraftsResponse {
  status?: string;
  mode?: string;
  date?: string;
  scheduledFor?: string;
  candidateCount?: number;
  drafts?: SocialDraft[];
}

export interface DraftActionResponse {
  status?: string;
  message?: string;
  draft?: SocialDraft;
}

export function useAiJudgeSocialJudges() {
  return useQuery<AiJudgeJudgesResponse>({
    queryKey: queryKeys.aiJudgeSocialJudges(),
    queryFn: () => apiClient.get<AiJudgeJudgesResponse>('/api/ai-judge-social/judges'),
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  });
}

export function useAiJudgeSocialDrafts() {
  return useQuery<AiJudgeDraftsResponse>({
    queryKey: queryKeys.aiJudgeSocialDrafts(),
    queryFn: () => apiClient.get<AiJudgeDraftsResponse>('/api/ai-judge-social/drafts'),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}

export function useGenerateHrSocialDrafts() {
  const queryClient = useQueryClient();
  return useMutation<GenerateHrDraftsResponse, unknown, { date?: string } | void>({
    mutationFn: (input) =>
      apiClient.post<GenerateHrDraftsResponse>(
        '/api/ai-judge-social/generate-hr-drafts',
        input && input.date ? { date: input.date } : {},
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.aiJudgeSocialDrafts() });
    },
  });
}

export function useQueueSocialDraft() {
  const queryClient = useQueryClient();
  return useMutation<DraftActionResponse, unknown, string>({
    mutationFn: (draftId) =>
      apiClient.post<DraftActionResponse>(
        `/api/ai-judge-social/drafts/${encodeURIComponent(draftId)}/queue`,
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.aiJudgeSocialDrafts() });
    },
  });
}

export function useMockPostSocialDraft() {
  const queryClient = useQueryClient();
  return useMutation<DraftActionResponse, unknown, string>({
    mutationFn: (draftId) =>
      apiClient.post<DraftActionResponse>(
        `/api/ai-judge-social/drafts/${encodeURIComponent(draftId)}/mock-post`,
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.aiJudgeSocialDrafts() });
    },
  });
}
