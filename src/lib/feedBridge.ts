import type { FeedPost } from '../types';

export type BackendFeedPostRow = {
  id: string;
  body: string;
  created_at: string;
  view_count?: number;
  is_demo?: boolean;
  post_kind?: string | null;
  media_url?: string | null;
  media_type?: 'audio' | null;
  author?: {
    id?: string;
    username?: string;
    display_name?: string;
    avatar_url?: string | null;
    tier?: string;
  } | null;
  pick?: {
    id?: string;
    market?: string;
    selection?: string;
    status?: string;
    settled_units?: number | null;
    locked_at?: string | null;
    created_at?: string | null;
  } | null;
  likes_count?: Array<{ count?: number }>;
  comments_count?: Array<{ count?: number }>;
  liked_by_me?: boolean;
};

function countFromAggregate(rows?: Array<{ count?: number }>): number {
  const value = rows?.[0]?.count;
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function mapAuthorTier(tier?: string): FeedPost['subscriptionTier'] {
  const normalized = (tier ?? 'free').toLowerCase();
  if (normalized === 'gold') return 'GOLD';
  if (normalized === 'seller_pro') return 'SELLER_PRO';
  return 'BASIC';
}

function inferPostType(row: BackendFeedPostRow): FeedPost['postType'] {
  if (row.pick?.id) return 'PARLAY';
  if (row.post_kind === 'audio') return 'AUDIO';
  if (row.post_kind === 'research_note') return 'RESEARCH_NOTE';
  if (row.post_kind === 'result') return 'RESULT';
  if (row.post_kind === 'vouch') return 'VOUCH';
  return 'DISCUSSION';
}

export function mapBackendFeedPost(row: BackendFeedPostRow): FeedPost {
  const author = row.author ?? {};
  const pick = row.pick ?? undefined;

  return {
    id: row.id,
    backendPostId: row.id,
    userId: author.id ?? 'unknown',
    displayName: author.display_name || author.username || 'User',
    username: author.username || 'user',
    avatarUrl: author.avatar_url || undefined,
    subscriptionTier: mapAuthorTier(author.tier),
    timestamp: row.created_at,
    postType: inferPostType(row),
    content: row.body ?? '',
    sourceBadge: row.is_demo ? 'Demo' : 'Community',
    likesCount: countFromAggregate(row.likes_count),
    commentsCount: countFromAggregate(row.comments_count),
    vouchesCount: 0,
    repostsCount: 0,
    viewsCount: row.view_count ?? 0,
    isLiked: Boolean(row.liked_by_me),
    comments: [],
    mediaUrl: row.media_url ?? undefined,
    mediaType: row.media_type ?? undefined,
    parlay: pick?.id
      ? {
          id: pick.id,
          backendPickId: pick.id,
          title: pick.selection || pick.market || 'Pick',
          legs: [],
          totalOdds: '—',
          oddsValue: 0,
          riskTier: 'MEDIUM',
          status: 'PENDING',
          createdAt: pick.created_at ?? row.created_at,
          feedLockedAt: pick.locked_at ?? undefined,
        }
      : undefined,
  };
}
