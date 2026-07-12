import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '../lib/apiClient';

export interface FollowingHubNote {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  body: string;
  emoji: string | null;
  expiresAt: string | null;
  updatedAt: string | null;
  isSelf: boolean;
}

export interface FollowingHubStory {
  id: string;
  user_id: string;
  kind: 'text' | 'image';
  body?: string | null;
  media_url?: string | null;
  background?: string;
  expires_at: string;
  created_at: string;
  viewed?: boolean;
}

export interface FollowingHubPerson {
  userId: string;
  isSelf: boolean;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  note: Record<string, unknown> | null;
  stories: FollowingHubStory[];
  hasUnseenStories: boolean;
}

export interface DirectConversation {
  id: string;
  otherUserId: string | null;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  lastMessage: Record<string, unknown> | null;
  unread: boolean;
}

export interface DirectMessage {
  id: string;
  body: string;
  created_at: string;
  sender_id: string;
  sender?: {
    id?: string;
    username?: string;
    display_name?: string;
    avatar_url?: string | null;
  };
}

export function useFollowingHub(enabled = true) {
  const [people, setPeople] = useState<FollowingHubPerson[]>([]);
  const [notes, setNotes] = useState<FollowingHubNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<{ people?: FollowingHubPerson[]; notes?: FollowingHubNote[] }>(
        '/api/following-hub',
      );
      setPeople(data.people ?? []);
      setNotes(data.notes ?? []);
    } catch (err: any) {
      setError(err?.message ?? 'Could not load Following hub.');
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const publishNote = useCallback(async (body: string, emoji?: string | null) => {
    await apiClient.put('/api/status-note', { body, emoji: emoji ?? null });
    await refresh();
  }, [refresh]);

  const clearNote = useCallback(async () => {
    await apiClient.delete('/api/status-note');
    await refresh();
  }, [refresh]);

  const publishStory = useCallback(async (input: {
    body: string;
    background?: string;
    kind?: 'text' | 'image';
    mediaUrl?: string | null;
  }) => {
    await apiClient.post('/api/stories', {
      kind: input.kind ?? 'text',
      body: input.body,
      background: input.background ?? '#0f172a',
      media_url: input.mediaUrl ?? null,
    });
    await refresh();
  }, [refresh]);

  const markStoryViewed = useCallback(async (storyId: string) => {
    await apiClient.post(`/api/stories/${encodeURIComponent(storyId)}/view`, {});
    await refresh();
  }, [refresh]);

  return {
    people,
    notes,
    loading,
    error,
    refresh,
    publishNote,
    clearNote,
    publishStory,
    markStoryViewed,
  };
}

export function useDirectMessages(enabled = true) {
  const [conversations, setConversations] = useState<DirectConversation[]>([]);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshConversations = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const data = await apiClient.get<{ conversations?: DirectConversation[] }>(
        '/api/messages/conversations',
      );
      setConversations(data.conversations ?? []);
      setError(null);
    } catch (err: any) {
      setError(err?.message ?? 'Could not load messages.');
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  const openConversation = useCallback(async (conversationId: string) => {
    setActiveConversationId(conversationId);
    const data = await apiClient.get<{ messages?: DirectMessage[] }>(
      `/api/messages/conversations/${encodeURIComponent(conversationId)}`,
    );
    setMessages(data.messages ?? []);
  }, []);

  const startConversation = useCallback(async (userId: string) => {
    const data = await apiClient.post<{ conversationId?: string }>(
      '/api/messages/conversations',
      { user_id: userId },
    );
    if (data.conversationId) {
      await refreshConversations();
      await openConversation(data.conversationId);
      return data.conversationId;
    }
    return null;
  }, [openConversation, refreshConversations]);

  const sendMessage = useCallback(async (body: string) => {
    if (!activeConversationId) return;
    const data = await apiClient.post<{ message?: DirectMessage }>(
      `/api/messages/conversations/${encodeURIComponent(activeConversationId)}`,
      { body },
    );
    if (data.message) {
      setMessages((prev) => [...prev, data.message!]);
    }
    await refreshConversations();
  }, [activeConversationId, refreshConversations]);

  useEffect(() => {
    void refreshConversations();
  }, [refreshConversations]);

  return {
    conversations,
    messages,
    activeConversationId,
    loading,
    error,
    refreshConversations,
    openConversation,
    startConversation,
    sendMessage,
    setActiveConversationId,
  };
}
