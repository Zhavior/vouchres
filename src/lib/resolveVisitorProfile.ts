import type { CreatorProofProfile, FeedPost } from '../types';

function matchesUserId(profile: CreatorProofProfile, userId: string): boolean {
  const needle = userId.trim().toLowerCase();
  if (!needle) return false;
  return (
    profile.username?.toLowerCase() === needle ||
    profile.handle?.toLowerCase() === needle ||
    profile.displayName?.toLowerCase() === needle
  );
}

function profileFromPost(post: FeedPost): CreatorProofProfile {
  return {
    displayName: post.displayName,
    username: post.username,
    handle: post.username,
    avatarUrl: post.avatarUrl ?? '',
    bio: '',
    verified: Boolean(post.isVerified),
    winRate: post.winRate ?? 0,
    totalPicks: 0,
    wonPicks: 0,
    unitsTracked: 0,
    unitsNetProfit: 0,
    subscriptionTier: post.subscriptionTier ?? 'BASIC',
    appThemeId: post.profileThemeId,
    profileThemeId: post.profileThemeId,
    activeTheme: post.profileThemeId,
    profileBorderId: post.profileBorderId,
  };
}

export function resolveVisitorProfile(
  viewUserId: string | null | undefined,
  selfProfile: CreatorProofProfile,
  posts: FeedPost[],
): { profile: CreatorProofProfile; isSelf: boolean } {
  if (!viewUserId || matchesUserId(selfProfile, viewUserId)) {
    return { profile: selfProfile, isSelf: true };
  }

  const needle = viewUserId.trim().toLowerCase();
  const authorPost = posts.find(
    (post) =>
      post.userId?.toLowerCase() === needle ||
      post.username?.toLowerCase() === needle ||
      post.displayName?.toLowerCase() === needle,
  );

  if (authorPost) {
    return { profile: profileFromPost(authorPost), isSelf: false };
  }

  return {
    profile: {
      displayName: viewUserId,
      username: viewUserId,
      handle: viewUserId,
      avatarUrl: '',
      bio: '',
      verified: false,
      winRate: 0,
      totalPicks: 0,
      wonPicks: 0,
      unitsTracked: 0,
      unitsNetProfit: 0,
      appThemeId: 'cyber-blue',
      profileThemeId: 'cyber-blue',
      activeTheme: 'cyber-blue',
    },
    isSelf: false,
  };
}

export function postsForProfile(
  posts: FeedPost[],
  profile: CreatorProofProfile,
  viewUserId: string | null | undefined,
  isSelf: boolean,
): FeedPost[] {
  if (isSelf) return posts;
  const needle = (viewUserId ?? profile.username).trim().toLowerCase();
  return posts.filter(
    (post) =>
      post.userId?.toLowerCase() === needle ||
      post.username?.toLowerCase() === needle ||
      post.displayName?.toLowerCase() === needle,
  );
}
