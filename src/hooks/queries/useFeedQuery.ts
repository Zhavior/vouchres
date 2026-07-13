import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import type { InfiniteData } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import { mapBackendFeedPost, type BackendFeedPostRow } from '../../lib/feedBridge';
import { getAuthToken, isSupabaseConfigured } from '../../lib/supabaseClient';
import type { FeedPost } from '../../types';
import { queryKeys } from './queryKeys';

export const FEED_PAGE_SIZE = 50;

type FeedResponse = {
  posts: BackendFeedPostRow[];
  total?: number;
  limit?: number;
  offset?: number;
  has_more?: boolean;
  has_real_content?: boolean;
};

export type FeedPage = {
  posts: FeedPost[];
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
};

export async function fetchFeedPage({
  offset,
  limit = FEED_PAGE_SIZE,
}: {
  offset: number;
  limit?: number;
}): Promise<FeedPage> {
  if (!isSupabaseConfigured) {
    return { posts: [], total: 0, offset, limit, hasMore: false };
  }

  const token = await getAuthToken();
  if (!token) {
    return { posts: [], total: 0, offset, limit, hasMore: false };
  }

  const result = await apiClient.get<FeedResponse>('/api/feed', { limit, offset });
  const rows = Array.isArray(result?.posts) ? result.posts : [];
  const mapped = rows.map(mapBackendFeedPost);
  const total = result?.total ?? mapped.length;
  const hasMore =
    typeof result?.has_more === 'boolean'
      ? result.has_more
      : offset + mapped.length < total;

  return {
    posts: mapped,
    total,
    offset,
    limit,
    hasMore,
  };
}

async function fetchScopedFeedPage(path: string): Promise<FeedPage> {
  const result = await apiClient.get<FeedResponse>(path, {
    limit: FEED_PAGE_SIZE,
    offset: 0,
  });
  const rows = Array.isArray(result?.posts) ? result.posts : [];
  const posts = rows.map(mapBackendFeedPost);
  const total = result?.total ?? posts.length;
  return {
    posts,
    total,
    offset: result?.offset ?? 0,
    limit: result?.limit ?? FEED_PAGE_SIZE,
    hasMore: Boolean(result?.has_more),
  };
}

export function flattenFeedPages(data: InfiniteData<FeedPage> | undefined): FeedPost[] {
  if (!data?.pages?.length) return [];

  const merged: FeedPost[] = [];
  const seen = new Set<string>();

  for (const page of data.pages) {
    for (const post of page.posts) {
      const key = post.backendPostId ? String(post.backendPostId) : post.id;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(post);
    }
  }

  return merged;
}

export function useFeedQuery(options?: { enabled?: boolean }) {
  return useInfiniteQuery({
    queryKey: queryKeys.feed(),
    queryFn: ({ pageParam }) => fetchFeedPage({ offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.offset + lastPage.posts.length : undefined,
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    enabled: (options?.enabled ?? true) && isSupabaseConfigured,
  });
}

export function useFollowingFeedQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.followingFeed(),
    queryFn: () => fetchScopedFeedPage('/api/feed/following'),
    staleTime: 30_000,
    enabled: (options?.enabled ?? true) && isSupabaseConfigured,
  });
}

export function useProfileFeedQuery(profileId: string | null | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.profileFeed(profileId ?? 'anonymous'),
    queryFn: () => fetchScopedFeedPage(`/api/profiles/${encodeURIComponent(profileId!)}/posts`),
    staleTime: 60_000,
    enabled: Boolean(profileId) && (options?.enabled ?? true) && isSupabaseConfigured,
  });
}

/** @deprecated Use fetchFeedPage — kept for legacy imports. */
export async function fetchFeedPosts(): Promise<FeedPost[]> {
  const page = await fetchFeedPage({ offset: 0 });
  return page.posts;
}
