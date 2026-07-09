import type { FeedPost, CreatorProofProfile } from '../types';
import { INITIAL_PROFILE } from '../data/mockData';
import { canDeleteFeedPost } from '../lib/postDeletePolicy';
import { apiClient } from '../lib/apiClient';
import { getAuthToken } from '../lib/supabaseClient';
import { useFeedStore } from '../stores/feedStore';
import { useProfileStore } from '../stores/profileStore';
import { useVouchesStore } from '../stores/vouchesStore';
import { pushVouchToBackend } from './vouchActions';

export function createFeedPost(postData: Partial<FeedPost>): FeedPost {
  const profile = useProfileStore.getState().profile ?? INITIAL_PROFILE;

  return {
    id: `post-user-${Date.now()}`,
    userId: 'u-user-current',
    displayName: profile.displayName,
    username: profile.username,
    isVerified: profile.verified,
    subscriptionTier: profile.subscriptionTier,
    timestamp: new Date().toISOString(),
    likesCount: 0,
    commentsCount: 0,
    vouchesCount: 0,
    repostsCount: 0,
    comments: [],
    content: postData.content || '',
    postType: postData.postType || 'RESEARCH_NOTE',
    sportBadge: postData.sportBadge,
    sourceBadge: postData.sourceBadge || 'Community',
    parlay: postData.parlay,
    vouch: postData.vouch,
    result: postData.result,
    researchNote: postData.researchNote,
    mediaUrl: postData.mediaUrl,
    mediaType: postData.mediaType,
    mediaUrl2: postData.mediaUrl2,
    showSecondCard: postData.showSecondCard,
    boardConfig: postData.boardConfig,
  };
}

export function handlePostCreated(postData: Partial<FeedPost>): void {
  const profile = useProfileStore.getState().profile ?? INITIAL_PROFILE;
  const posts = useFeedStore.getState().posts;
  const savedVouches = useVouchesStore.getState().savedVouches;
  const syncPosts = useFeedStore.getState().syncPosts;
  const syncProfile = useProfileStore.getState().syncProfile;
  const syncVouches = useVouchesStore.getState().syncVouches;

  const newPost = createFeedPost(postData);
  syncPosts([newPost, ...posts]);

  let vouchForBackend: import('../types').Vouch | undefined;
  if (newPost.postType === 'VOUCH' && newPost.vouch) {
    const exists = savedVouches.some((v) => v.id === newPost.vouch?.id);
    if (!exists) {
      vouchForBackend = { ...newPost.vouch, isSavedByUser: true };
      syncVouches([...savedVouches, vouchForBackend]);
    } else {
      vouchForBackend = savedVouches.find((v) => v.id === newPost.vouch?.id);
    }
  }

  if (newPost.postType === 'RESULT' && newPost.result) {
    const res = newPost.result;
    const isWin = res.status === 'WON';
    const isLoss = res.status === 'LOST';

    if (isWin || isLoss) {
      const additionalProfit = isWin ? res.profit ?? 0.0 : -res.units;
      syncProfile({
        ...profile,
        totalPicks: profile.totalPicks + 1,
        wonPicks: profile.wonPicks + (isWin ? 1 : 0),
        unitsNetProfit: profile.unitsNetProfit + additionalProfit,
        winRate: ((profile.wonPicks + (isWin ? 1 : 0)) / (profile.totalPicks + 1)) * 100,
      });
    }
  }

  if (newPost.content.trim()) {
    void (async () => {
      const backendVouchId = vouchForBackend ? await pushVouchToBackend(vouchForBackend) : undefined;
      const token = await getAuthToken();
      if (!token) return;
      try {
        const created = await apiClient.post<{ id?: string }>('/api/posts', {
          body: newPost.content,
          pick_id: newPost.parlay?.backendPickId,
          vouch_id: backendVouchId,
        });
        if (created?.id) {
          const prev = useFeedStore.getState().posts;
          useFeedStore.getState().syncPosts(
            prev.map((p) => (p.id === newPost.id ? { ...p, backendPostId: created.id } : p)),
          );
        }
      } catch (err) {
        console.warn('[posts] backend save failed (kept in localStorage)', err);
      }
    })();
  }
}

export function handleLikePost(postId: string): void {
  const syncPosts = useFeedStore.getState().syncPosts;
  syncPosts(
    useFeedStore.getState().posts.map((p) => {
      if (p.id !== postId) return p;
      const isLiked = !p.isLiked;
      return { ...p, isLiked, likesCount: p.likesCount + (isLiked ? 1 : -1) };
    }),
  );
}

export function handleVouchPost(postId: string): void {
  const syncPosts = useFeedStore.getState().syncPosts;
  syncPosts(
    useFeedStore.getState().posts.map((p) => {
      if (p.id !== postId) return p;
      const isVouched = !p.isVouched;
      return { ...p, isVouched, vouchesCount: p.vouchesCount + (isVouched ? 1 : -1) };
    }),
  );
}

export function handleRepostPost(postId: string): void {
  const syncPosts = useFeedStore.getState().syncPosts;
  syncPosts(
    useFeedStore.getState().posts.map((p) => {
      if (p.id !== postId) return p;
      const isReposted = !p.isReposted;
      return { ...p, isReposted, repostsCount: p.repostsCount + (isReposted ? 1 : -1) };
    }),
  );
}

export function handleDeletePost(postId: string): void {
  const posts = useFeedStore.getState().posts;
  const syncPosts = useFeedStore.getState().syncPosts;
  const target = posts.find((p) => p.id === postId);
  if (!target || !canDeleteFeedPost(target)) return;
  if (!window.confirm('Delete this post? This cannot be undone.')) return;

  syncPosts(posts.filter((p) => p.id !== postId));

  void (async () => {
    const token = await getAuthToken();
    const backendId = target.backendPostId;
    if (!token || !backendId) return;
    try {
      await apiClient.delete(`/api/posts/${encodeURIComponent(backendId)}`);
    } catch (err) {
      console.warn('[posts] backend delete failed (removed locally)', err);
    }
  })();
}

export function handleAddComment(postId: string, commentContent: string): void {
  const profile = useProfileStore.getState().profile ?? INITIAL_PROFILE;
  const syncPosts = useFeedStore.getState().syncPosts;
  syncPosts(
    useFeedStore.getState().posts.map((p) => {
      if (p.id !== postId) return p;
      const newComm = {
        id: `c-user-${Date.now()}`,
        postId,
        userId: 'u-user-current',
        displayName: profile.displayName,
        username: profile.username,
        timestamp: new Date().toISOString(),
        content: commentContent,
        likesCount: 0,
      };
      return {
        ...p,
        commentsCount: p.commentsCount + 1,
        comments: [...(p.comments || []), newComm],
      };
    }),
  );
}
