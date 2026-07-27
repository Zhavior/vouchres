import type { FeedComment } from '../types';
import { apiClient } from '../lib/apiClient';
import { getAuthToken } from '../lib/supabaseClient';
import {
  buildCommentTree,
  countCommentsInTree,
  flattenCommentTree,
  mapBackendComment,
  type BackendCommentRow,
} from '../lib/commentBridge';
import { useFeedStore } from '../stores/feedStore';

function resolveBackendPostId(postId: string): string | null {
  const post = useFeedStore.getState().posts.find((p) => p.id === postId);
  return post?.backendPostId ?? (postId.match(/^[0-9a-f-]{36}$/i) ? postId : null);
}

function syncPostComments(postId: string, comments: FeedComment[], commentsCount?: number) {
  const tree = buildCommentTree(comments);
  const flat = flattenCommentTree(tree);
  useFeedStore.getState().syncPosts(
    useFeedStore.getState().posts.map((post) => {
      if (post.id !== postId) return post;
      return {
        ...post,
        comments: tree,
        commentsCount: commentsCount ?? flat.length,
      };
    }),
  );
}

export async function fetchPostComments(postId: string): Promise<FeedComment[]> {
  const backendPostId = resolveBackendPostId(postId);
  if (!backendPostId) return [];

  const data = await apiClient.get<{ comments?: BackendCommentRow[] }>(
    `/api/posts/${encodeURIComponent(backendPostId)}/comments`,
    { query: { limit: 100, offset: 0 } },
  );

  const mapped = (data.comments ?? []).map((row) => mapBackendComment(row, postId));
  syncPostComments(postId, mapped);
  return buildCommentTree(mapped);
}

export async function submitPostComment(input: {
  postId: string;
  body: string;
  parentId?: string | null;
  replyToUserId?: string | null;
}): Promise<FeedComment | null> {
  const token = await getAuthToken();
  if (!token) throw new Error('Sign in to reply.');

  const backendPostId = resolveBackendPostId(input.postId);
  const trimmed = input.body.trim();
  if (!trimmed) throw new Error('Reply cannot be empty.');

  if (!backendPostId) {
    throw new Error('This post is not synced yet. Try again in a moment.');
  }

  const created = await apiClient.post<BackendCommentRow>(
    `/api/posts/${encodeURIComponent(backendPostId)}/comments`,
    {
      body: trimmed,
      parent_id: input.parentId ?? undefined,
      reply_to_user_id: input.replyToUserId ?? undefined,
    },
  );

  const mapped = mapBackendComment(created, input.postId);
  const post = useFeedStore.getState().posts.find((p) => p.id === input.postId);
  const existingFlat = flattenCommentTree(post?.comments ?? []);
  const nextFlat = [...existingFlat, mapped];
  syncPostComments(input.postId, nextFlat, (post?.commentsCount ?? 0) + 1);
  return mapped;
}

export async function toggleCommentLike(input: {
  postId: string;
  commentId: string;
  liked: boolean;
}): Promise<void> {
  const token = await getAuthToken();
  if (!token) throw new Error('Sign in to like replies.');

  if (input.liked) {
    await apiClient.delete(`/api/comments/${encodeURIComponent(input.commentId)}/like`);
  } else {
    await apiClient.post(`/api/comments/${encodeURIComponent(input.commentId)}/like`, {});
  }

  const post = useFeedStore.getState().posts.find((p) => p.id === input.postId);
  if (!post?.comments) return;

  const updateTree = (nodes: FeedComment[]): FeedComment[] =>
    nodes.map((node) => {
      if (node.id === input.commentId) {
        const nextLiked = !input.liked;
        return {
          ...node,
          isLiked: nextLiked,
          likesCount: Math.max(0, node.likesCount + (nextLiked ? 1 : -1)),
        };
      }
      if (node.replies?.length) {
        return { ...node, replies: updateTree(node.replies) };
      }
      return node;
    });

  useFeedStore.getState().syncPosts(
    useFeedStore.getState().posts.map((p) =>
      p.id === input.postId ? { ...p, comments: updateTree(p.comments ?? []) } : p,
    ),
  );
}

export async function deletePostComment(input: {
  postId: string;
  commentId: string;
}): Promise<void> {
  const token = await getAuthToken();
  if (!token) throw new Error('Sign in to delete replies.');

  await apiClient.delete(`/api/comments/${encodeURIComponent(input.commentId)}`);

  const post = useFeedStore.getState().posts.find((p) => p.id === input.postId);
  const flat = flattenCommentTree(post?.comments ?? []).filter((c) => c.id !== input.commentId);
  syncPostComments(input.postId, flat, Math.max(0, (post?.commentsCount ?? 1) - 1));
}

export function handleAddComment(postId: string, commentContent: string): void {
  void submitPostComment({ postId, body: commentContent }).catch((err) => {
    console.warn('[comments] submit failed', err);
    alert(err?.message ?? 'Could not post reply.');
  });
}

export { countCommentsInTree };
