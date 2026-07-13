import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import { queryKeys } from './queryKeys';
import type { ConversationSummary, DirectMessage } from '../../lib/messagingTypes';

export function useConversations(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.messageConversations(),
    queryFn: () => apiClient.get<{ conversations: ConversationSummary[] }>('/api/messages/conversations'),
    staleTime: 15_000,
    refetchInterval: 20_000,
    enabled: options?.enabled ?? true,
  });
}

export function useConversationMessages(conversationId: string | null) {
  return useQuery({
    queryKey: queryKeys.messageThread(conversationId ?? 'none'),
    queryFn: () => apiClient.get<{ messages: DirectMessage[] }>(`/api/messages/conversations/${conversationId}/messages`, { limit: 100 }),
    staleTime: 5_000,
    refetchInterval: 8_000,
    enabled: Boolean(conversationId),
  });
}

export function useStartConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (recipientUserId: string) =>
      apiClient.post<{ conversation: ConversationSummary }>('/api/messages/conversations', { recipientUserId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.messageConversations() });
    },
  });
}

export function useSendDirectMessage(conversationId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (text: string) => {
      if (!conversationId) throw new Error('No conversation selected.');
      return apiClient.post<{ message: DirectMessage }>(`/api/messages/conversations/${conversationId}/messages`, { text });
    },
    onSuccess: () => {
      if (!conversationId) return;
      void queryClient.invalidateQueries({ queryKey: queryKeys.messageThread(conversationId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.messageConversations() });
    },
  });
}

export function useMarkConversationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) => apiClient.post(`/api/messages/conversations/${conversationId}/read`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.messageConversations() });
    },
  });
}
