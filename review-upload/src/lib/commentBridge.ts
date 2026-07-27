import type { FeedComment } from '../types';

export type BackendCommentRow = {
  id: string;
  body: string;
  created_at: string;
  parent_id?: string | null;
  reply_to_user_id?: string | null;
  author?: {
    id?: string;
    username?: string;
    display_name?: string;
    avatar_url?: string | null;
  } | null;
  reply_to?: {
    id?: string;
    username?: string;
    display_name?: string;
  } | null;
  likes_count?: Array<{ count?: number }>;
  liked_by_me?: boolean;
};

function countFromAggregate(rows?: Array<{ count?: number }>): number {
  const value = rows?.[0]?.count;
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

export function mapBackendComment(row: BackendCommentRow, postId: string): FeedComment {
  const author = row.author ?? {};
  return {
    id: row.id,
    postId,
    userId: String(author.id ?? 'unknown'),
    displayName: String(author.display_name ?? author.username ?? 'User'),
    username: String(author.username ?? 'user'),
    avatarUrl: author.avatar_url || undefined,
    timestamp: row.created_at,
    content: row.body ?? '',
    likesCount: countFromAggregate(row.likes_count),
    isLiked: Boolean(row.liked_by_me),
    parentId: row.parent_id ?? null,
    replyToUserId: row.reply_to_user_id ?? null,
    replyToUsername: row.reply_to?.username ?? undefined,
    replyToDisplayName: row.reply_to?.display_name ?? undefined,
  };
}

export function buildCommentTree(flat: FeedComment[]): FeedComment[] {
  const byId = new Map(flat.map((comment) => [comment.id, { ...comment, replies: [] as FeedComment[] }]));
  const roots: FeedComment[] = [];

  for (const comment of byId.values()) {
    if (comment.parentId && byId.has(comment.parentId)) {
      byId.get(comment.parentId)!.replies!.push(comment);
      continue;
    }
    roots.push(comment);
  }

  return roots;
}

export function flattenCommentTree(tree: FeedComment[]): FeedComment[] {
  const out: FeedComment[] = [];
  const walk = (nodes: FeedComment[]) => {
    for (const node of nodes) {
      out.push(node);
      if (node.replies?.length) walk(node.replies);
    }
  };
  walk(tree);
  return out;
}

export function countCommentsInTree(tree: FeedComment[]): number {
  return flattenCommentTree(tree).length;
}
