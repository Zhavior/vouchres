import React, { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Shield, ShieldCheck, ArrowLeft, Edit3, Save, Info, Sparkles, MessageSquare, Share, Lock, Palette, Camera, Loader2, Crown, Gem, Star } from 'lucide-react';
import { CreatorProofProfile, FeedPost, Vouch, Parlay } from '../types';
import FeedPostCard from '../social/feed/FeedPostCard';
import { THEME_REGISTRY } from '../theme/themeRegistry';
import ProfileThemeWrapper from './profile/ProfileThemeWrapper';
import ProfileAvatarBorder from './profile/ProfileAvatarBorder';
import ProfileShareCard from './profile/ProfileShareCard';
import { DeferredBubbleField } from './vouchedge/DeferredBubbleField';
import { VEButton } from './ui/ve';
import { canCustomizeProfileHeader } from './pro/proAccessUtils';
import { useEntitlements } from '../features/hr/hooks/useEntitlements';
import { apiClient } from '../lib/apiClient';
import { useAuth } from '../lib/useAuth';
import { useDirectMessages } from '../hooks/useFollowingHub';
import { useProfileSocialStats, useSocialGraph } from '../hooks/useSocialGraph';
import { uploadProfileAvatar, uploadProfileHeader } from '../lib/profileAvatarUpload';
import { AURORA_LABEL, AURORA_PAGE, AURORA_PAGE_GAP, AURORA_PAGE_PAD_X } from '../theme/auroraTokens';
import { AuroraMaxPanel } from './aurora-max/AuroraMaxPrimitives';
import '../styles/profile-aurora-max.css';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface ProfilePageProps {
  profile: CreatorProofProfile;
  onUpdateProfile: (updated: Partial<CreatorProofProfile>) => void;
  posts?: FeedPost[];
  onLikePost?: (postId: string) => void;
  onVouchPost?: (postId: string) => void;
  onRepostPost?: (postId: string) => void;
  onSaveVouch?: (vouch: Vouch) => void;
  savedVouchIds?: string[];
  onAddComment?: (postId: string, commentContent: string) => void;
  onDeletePost?: (postId: string) => void;
  savedParlays?: Parlay[];
  onSectionChange?: (section: string) => void;
  viewUserId?: string;
  onClearViewUser?: () => void;
}

type SubscriptionTier = 'BASIC' | 'GOLD' | 'SELLER_PRO';

type ProfileProofSnapshot = {
  record: {
    wins: number;
    losses: number;
    pushes: number;
    settled: number;
    winRate: number | null;
    netUnits: number;
  };
  recentSettled: Array<{
    id: string;
    market: string;
    selection: string;
    status: 'won' | 'lost' | 'push';
    settledUnits: number;
    lockedAt: string | null;
    gradedAt: string | null;
    createdAt: string | null;
  }>;
  social: { followers: number; following: number; subscribers: number };
};

const TIER_CONFIG: Record<SubscriptionTier, {
  label: string;
  badge: string;
  icon: typeof Shield;
  accent: string;
  chipClass: string;
  panelClass: string;
  auraClass: string;
  evolutionTitle: string;
  evolutionText: string;
  perks: string[];
  signatureBadges: string[];
}> = {
  BASIC: {
    label: 'Starter Identity',
    badge: 'EDGE STARTER',
    icon: Shield,
    accent: 'text-white/80',
    chipClass: 'profile-aurora-inset text-[var(--aurora-max-paper)]/72',
    panelClass: 'aurora-max-panel',
    auraClass: 'from-[var(--aurora-max-emerald)]/10 via-transparent to-transparent',
    evolutionTitle: 'Built for proof first',
    evolutionText: 'Starter profiles focus on trust, ledger clarity, and visible accountability before cosmetics.',
    perks: ['Public trust record', 'Verified win-rate ledger', 'Core profile identity'],
    signatureBadges: ['Truth-first profile', 'Verified record', 'Public accountability'],
  },
  GOLD: {
    label: 'Gold Identity',
    badge: 'GOLD MEMBER',
    icon: Crown,
    accent: 'text-vouch-emerald',
    chipClass: 'border-vouch-emerald/30 bg-vouch-emerald/10 text-vouch-emerald',
    panelClass: 'border-vouch-emerald/25 bg-vouch-emerald/6',
    auraClass: 'from-vouch-emerald/20 via-vouch-emerald/10 to-transparent',
    evolutionTitle: 'Premium personal brand',
    evolutionText: 'Gold profiles unlock stronger presence with premium identity treatment, better header status, and elevated profile presentation.',
    perks: ['Header customization', 'Premium profile styling', 'Elevated member badge set'],
    signatureBadges: ['Gold identity', 'Premium styling', 'Enhanced member status'],
  },
  SELLER_PRO: {
    label: 'Seller Pro Identity',
    badge: 'SELLER PRO',
    icon: Gem,
    accent: 'text-vouch-cyan',
    chipClass: 'border-vouch-cyan/30 bg-vouch-cyan/10 text-vouch-cyan',
    panelClass: 'border-vouch-cyan/25 bg-vouch-cyan/6',
    auraClass: 'from-vouch-cyan/20 via-vouch-cyan/10 to-transparent',
    evolutionTitle: 'Monetized creator presence',
    evolutionText: 'Seller Pro profiles should feel like premium storefronts: stronger authority, stronger differentiation, and stronger public trust signals.',
    perks: ['Creator-grade trust branding', 'Subscriber-facing identity', 'Highest-tier profile presence'],
    signatureBadges: ['Seller Pro storefront', 'Subscriber-ready profile', 'Creator trust surface'],
  },
};

function normalizeSubscriptionTier(value: unknown): SubscriptionTier {
  const raw = String(value ?? '').trim().toUpperCase();
  if (raw === 'GOLD') return 'GOLD';
  if (raw === 'SELLER_PRO' || raw === 'SELLER PRO' || raw === 'PRO') return 'SELLER_PRO';
  return 'BASIC';
}

function buildViewedProfile(base: CreatorProofProfile, remote?: Record<string, unknown> | null): CreatorProofProfile {
  if (!remote) return base;
  const totalPicks = Number(remote.total_picks ?? base.totalPicks ?? 0);
  const wonPicks = Number(remote.won_picks ?? base.wonPicks ?? 0);
  const lostPicks = Number(remote.lost_picks ?? 0);
  const pushedPicks = Number(remote.pushed_picks ?? 0);
  const resolvedPicks = Math.max(0, wonPicks + lostPicks + pushedPicks);
  const winRate = resolvedPicks > 0 ? (wonPicks / resolvedPicks) * 100 : 0;
  return {
    ...base,
    displayName: String(remote.display_name ?? base.displayName ?? 'VouchEdge Member'),
    username: String(remote.username ?? base.username ?? ''),
    handle: String(remote.handle ?? remote.username ?? base.handle ?? ''),
    avatarUrl: String(remote.avatar_url ?? base.avatarUrl ?? ''),
    headerUrl: String(remote.header_url ?? base.headerUrl ?? ''),
    bio: String(remote.bio ?? base.bio ?? ''),
    verified: Boolean(remote.is_staff) || base.verified,
    subscriptionTier: normalizeSubscriptionTier(remote.tier ?? base.subscriptionTier),
    totalPicks,
    wonPicks,
    winRate,
    unitsNetProfit: Number(remote.net_units ?? base.unitsNetProfit ?? 0),
    unitsTracked: totalPicks,
  };
}

export default function ProfilePageZ8({ 
  profile, 
  onUpdateProfile,
  posts = [],
  onLikePost = () => {},
  onVouchPost = () => {},
  onRepostPost = () => {},
  onSaveVouch = () => {},
  savedVouchIds = [],
  onAddComment = () => {},
  onDeletePost,
  onSectionChange,
  viewUserId,
  onClearViewUser,
}: ProfilePageProps) {
  const { user } = useAuth();
  const profileUserId = viewUserId ?? user?.id ?? null;
  const isOwnProfile = !viewUserId || viewUserId === user?.id;
  const viewedProfileQuery = useQuery({
    queryKey: ['public-profile', viewUserId],
    queryFn: () => apiClient.get<Record<string, unknown>>(`/api/profile/${encodeURIComponent(viewUserId!)}`),
    enabled: Boolean(viewUserId) && !isOwnProfile,
    staleTime: 60_000,
  });
  const proofQuery = useQuery({
    queryKey: ['profile-proof', profileUserId],
    queryFn: () => apiClient.get<ProfileProofSnapshot>(`/api/profile/${encodeURIComponent(profileUserId!)}/proof`),
    enabled: Boolean(profileUserId),
    staleTime: 60_000,
  });
  const displayedProfile = buildViewedProfile(profile, viewedProfileQuery.data ?? null);
  const displayedTier = normalizeSubscriptionTier(displayedProfile.subscriptionTier);
  const tierConfig = TIER_CONFIG[displayedTier];
  const TierIcon = tierConfig.icon;
  const socialStats = useProfileSocialStats(profileUserId);
  const socialGraph = useSocialGraph(user?.id ?? null);
  const directMessages = useDirectMessages(Boolean(user) && !isOwnProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [displayName, setDisplayName] = useState(displayedProfile.displayName);
  const [bio, setBio] = useState(displayedProfile.bio);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [headerError, setHeaderError] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingHeader, setIsUploadingHeader] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'vouches' | 'replies'>('posts');
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const headerInputRef = useRef<HTMLInputElement>(null);
  const [hoveredDayYmd, setHoveredDayYmd] = useState<string | null>(null);
  const proof = proofQuery.data ?? null;
  const entitlements = useEntitlements();
  const canEditHeader = canCustomizeProfileHeader(displayedProfile, {
    isPro: entitlements.isPro,
    isStaff: entitlements.isStaff,
  });

  const getActiveThemeData = () => {
    const themeToFind = displayedProfile.profileThemeId || displayedProfile.activeTheme || 'cyber-blue';
    const found = THEME_REGISTRY.find(t => t.id === themeToFind);
    if (!found) {
      try {
        const stored = localStorage.getItem('vouchedge_market_themes');
        if (stored) {
          const parsed = JSON.parse(stored);
          const match = parsed.find((item: any) => item.id === themeToFind);
          if (match) {
            return {
              id: match.id,
              name: match.name,
              category: match.category,
              badge: match.badge || '💎 AI_MINT',
              avatarAnimationClass: match.avatarAnimationClass || 'animate-pulse border-sky-400 shadow-md',
              cardStyle: match.cardStyle || 'bg-ve-storm border-slate-800',
              glowColor: match.glowColor || 'from-sky-500 to-indigo-500',
              particleDemo: match.particleDemo || ['✨', '💎'],
              fontFamily: match.fontFamily || 'font-mono',
              coverBg: match.coverBg || 'from-indigo-650/40 to-slate-950/40',
              customAIPhrase: match.customAIPhrase || '🚀 CUSTOM THEME REVENUE INSTANCE LIVE'
            };
          }
        }
      } catch {
        return undefined;
      }
    }
    return found;
  };

  const activeThemeData = getActiveThemeData();
  
  const [followingCount, setFollowingCount] = useState(0);

  React.useEffect(() => {
    setFollowingCount(socialStats.following);
  }, [socialStats.following]);

  React.useEffect(() => {
    setDisplayName(displayedProfile.displayName);
    setBio(displayedProfile.bio);
  }, [displayedProfile.bio, displayedProfile.displayName]);

  const isFollowingViewedProfile = !isOwnProfile && Boolean(
    viewUserId && socialGraph.isFollowingUser({ profileId: viewUserId, username: displayedProfile.username }),
  );
  const isFriendWithViewedProfile = !isOwnProfile && Boolean(
    viewUserId && socialGraph.isFriendWith({ profileId: viewUserId, username: displayedProfile.username }),
  );

  const handleToggleFollow = React.useCallback(async () => {
    if (!viewUserId || !user) return;
    if (isFollowingViewedProfile) {
      await socialGraph.unfollowProfile(viewUserId);
      return;
    }
    await socialGraph.followProfile({ profileId: viewUserId, relationshipType: 'follow' });
  }, [isFollowingViewedProfile, socialGraph, user, viewUserId]);

  const handleMessageProfile = React.useCallback(async () => {
    if (!viewUserId || !user) return;
    const conversationId = await directMessages.startConversation(viewUserId);
    if (!conversationId) return;
    try {
      sessionStorage.setItem('vouchedge_social_open_tab', 'messages');
      sessionStorage.setItem('vouchedge_social_open_conversation_id', conversationId);
    } catch {
      // ignore storage failures
    }
    onSectionChange?.('following');
  }, [directMessages, onSectionChange, user, viewUserId]);

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      displayName: displayName.trim(),
      bio: bio.trim()
    });
    setIsEditing(false);
  };

  const handleAvatarFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setAvatarError(null);
    setIsUploadingAvatar(true);
    try {
      const avatarUrl = await uploadProfileAvatar(file);
      onUpdateProfile({ avatarUrl });
    } catch (error) {
      setAvatarError(error instanceof Error ? error.message : 'Profile photo upload failed.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleHeaderFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setHeaderError(null);
    setIsUploadingHeader(true);
    try {
      const headerUrl = await uploadProfileHeader(file);
      onUpdateProfile({ headerUrl });
    } catch (error) {
      setHeaderError(error instanceof Error ? error.message : 'Header image upload failed.');
    } finally {
      setIsUploadingHeader(false);
    }
  };

  // Filter user's posts (all types)
  const userPosts = posts.filter(
    p => (p.userId === 'u-user-current' || p.username === displayedProfile.username || p.displayName === displayedProfile.displayName)
      && p.postType !== 'RESULT'
  );

  // Filter user's vouches (VOUCH type posts)
  const userVouches = posts.filter(
    p => p.postType === 'VOUCH' && (p.userId === 'u-user-current' || p.username === displayedProfile.username || p.displayName === displayedProfile.displayName)
  );

  // Filter user's results
  const userResults = posts.filter(
    p => p.postType === 'RESULT' && p.result && (p.userId === 'u-user-current' || p.username === displayedProfile.username || p.displayName === displayedProfile.displayName)
  );
  const recentCreatorPosts = userPosts.slice(0, 3);
  const recentCreatorResults = userResults.slice(0, 3);
  const tierProofNotes = displayedTier === 'SELLER_PRO'
    ? [
        `${socialStats.subscribers} active subscribers can evaluate this profile publicly`,
        `${recentCreatorResults.length} settled creator results are visible on-page`,
        'Profile is positioned as a premium storefront, not a hidden black box',
      ]
    : displayedTier === 'GOLD'
      ? [
          'Header identity and premium profile styling are unlocked',
          `${socialStats.followers} followers can track this account in SocialOS`,
          'Gold pages emphasize stronger personal brand without hiding the record',
        ]
      : [
          'Starter profiles still surface the same public truth record',
          `${displayedProfile.totalPicks} tracked picks anchor the account reputation`,
          'Core identity stays clean, simple, and accountability-first',
        ];

  const getLocalYMD = (dateInput: string | Date | number) => {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const r = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${r}`;
  };

  // Generate the last 10 days relative to current time
  const profileDays = [];
  const baseDate = new Date();
  for (let i = 0; i < 10; i++) {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() - i);
    profileDays.push(d);
  }

  return (
    <ProfileThemeWrapper themeId={displayedProfile.profileThemeId || displayedProfile.activeTheme || 'cyber-blue'}>
      <div className={`profile-page profile-aurora-max ${AURORA_PAGE} ${AURORA_PAGE_PAD_X} ${AURORA_PAGE_GAP}`} id="profile-details-view">


        {!isOwnProfile && onClearViewUser ? (
          <button
            type="button"
            onClick={onClearViewUser}
            className="aurora-max-control mb-2 min-h-10 px-4 text-xs font-bold"
          >
            Back to your profile
          </button>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Profile Card, Pro verification, & Activity feed */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Main card */}
            <AuroraMaxPanel className={`overflow-hidden relative transition-all duration-300 ${ activeThemeData ? activeThemeData.fontFamily || 'font-sans' : 'font-sans' }`} id="profile-primary-card">
              <div
                className={`profile-aurora-header relative h-28 overflow-hidden ${
                  displayedProfile.headerUrl
                    ? ''
                    : activeThemeData?.coverBg || ''
                }`}
              >
                {displayedProfile.headerUrl ? (
                  <img
                    src={displayedProfile.headerUrl}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : null}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                {isOwnProfile ? (
                  <div className="absolute right-3 top-3 z-10 flex flex-wrap justify-end gap-2">
                    {canEditHeader ? (
                      <>
                        <input
                          ref={headerInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="sr-only"
                          onChange={(event) => void handleHeaderFile(event)}
                        />
                        <button
                          type="button"
                          id="upload-profile-header-btn"
                          onClick={() => headerInputRef.current?.click()}
                          disabled={isUploadingHeader}
                          className="aurora-max-control min-h-9 gap-1.5 px-3 text-[10px] font-black uppercase tracking-wider disabled:cursor-wait disabled:opacity-70"
                        >
                          {isUploadingHeader ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                          {isUploadingHeader ? 'Uploading' : 'Upload header'}
                        </button>
                        {displayedProfile.headerUrl ? (
                          <button
                            type="button"
                            id="remove-profile-header-btn"
                            onClick={() => {
                              setHeaderError(null);
                              onUpdateProfile({ headerUrl: '' });
                            }}
                            className="aurora-max-control min-h-9 px-3 text-[10px] font-black uppercase tracking-wider"
                          >
                            Remove
                          </button>
                        ) : null}
                      </>
                    ) : (
                      <button
                        type="button"
                        id="locked-profile-header-btn"
                        onClick={() => onSectionChange?.('premium')}
                        className="aurora-max-control min-h-9 gap-1.5 px-3 text-[10px] font-black uppercase tracking-wider"
                      >
                        <Lock className="h-3.5 w-3.5" />
                        Gold header
                      </button>
                    )}
                  </div>
                ) : null}
              </div>
              <div className="p-4 sm:p-6 flex flex-col items-center text-center relative">
                  <div className="relative">
                    <ProfileAvatarBorder 
                      borderId={displayedProfile.profileBorderId}
                      avatarUrl={displayedProfile.avatarUrl}
                      displayName={displayedProfile.displayName}
                      initials={displayedProfile.displayName.split(' ').map(n=>n[0]).join('')}
                      size="xl"
                      winRate={displayedProfile.winRate}
                      isVerified={displayedProfile.verified}
                    />
                    {isOwnProfile && (
                      <>
                        <input
                          ref={avatarInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="sr-only"
                          onChange={(event) => void handleAvatarFile(event)}
                        />
                        <button
                          type="button"
                          onClick={() => avatarInputRef.current?.click()}
                          disabled={isUploadingAvatar}
                          className="aurora-max-control absolute -bottom-1 -right-1 h-9 w-9 p-0 text-[var(--aurora-max-emerald)] disabled:cursor-wait disabled:opacity-70"
                          aria-label="Change profile photo"
                          title="Change profile photo"
                        >
                          {isUploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                        </button>
                      </>
                    )}
                  </div>
              </div>

            {avatarError && isOwnProfile && (
              <p className="text-sm text-rose-200" role="alert">{avatarError}</p>
            )}
            {headerError && isOwnProfile && (
              <p className="px-4 text-sm text-rose-200" role="alert">{headerError}</p>
            )}

            <div className="space-y-4 w-full px-4 pb-6">
              <div className="flex flex-col items-center gap-3">
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-2 justify-center flex-wrap">
                    <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                      {displayName}
                    </h3>
                    {displayedProfile.verified && (
                      <ShieldCheck className="w-5 h-5 text-vouch-emerald" />
                    )}
                  </div>
                  <p className={`${AURORA_LABEL} text-white/40 mt-1 normal-case tracking-normal font-medium text-sm`}>@{displayedProfile.handle || displayedProfile.username}</p>
                </div>
                
                {/* Dynamic Followers and Tailing count belt */}
                <div className="profile-aurora-rule flex items-center justify-center gap-6 mt-2 border-y py-3 w-full max-w-sm">
                  <div className="flex flex-col items-center">
                    <strong className="text-white/90 text-base font-black">{socialStats.followers}</strong>
                    <span className="text-[10px] uppercase tracking-wider text-white/40 font-bold">Followers</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <strong className="text-white/90 text-base font-black">{socialStats.subscribers}</strong>
                    <span className="text-[10px] uppercase tracking-wider text-white/40 font-bold">Subscribers</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <strong className="text-white/90 text-base font-black">{followingCount}</strong>
                    <span className="text-[10px] uppercase tracking-wider text-white/40 font-bold">Following</span>
                  </div>
                </div>

                {!isEditing ? (
                  <div className="flex items-center justify-center gap-3 w-full max-w-sm mt-1">
                    {isOwnProfile ? (
                      <>
                        <VEButton
                          onClick={() => setIsEditing(true)}
                          id="edit-profile-btn"
                          variant="secondary"
                          className="aurora-max-control flex-1 font-bold"
                        >
                          Edit Profile
                        </VEButton>
                        <VEButton
                          onClick={() => setShowShareModal(true)}
                          id="share-profile-btn"
                          variant="secondary"
                          className="aurora-max-control flex-1 font-bold"
                        >
                          Share Profile
                        </VEButton>
                      </>
                    ) : (
                      <>
                        <VEButton
                          onClick={() => void handleToggleFollow()}
                          variant={isFollowingViewedProfile ? 'secondary' : 'primary'}
                          className={`flex-1 font-bold ${isFollowingViewedProfile ? 'aurora-max-control' : 'aurora-max-control aurora-max-control--primary'}`}
                        >
                          {isFollowingViewedProfile ? 'Following' : 'Follow'}
                        </VEButton>
                        <VEButton
                          onClick={() => void handleMessageProfile()}
                          variant="secondary"
                          className="aurora-max-control flex-1 font-bold"
                        >
                          Message
                        </VEButton>
                      </>
                    )}
                  </div>
                ) : null}
              </div>

              <section className="aurora-max-panel mx-auto mt-5 w-full max-w-2xl p-4 text-left" aria-label="Verified profile record">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className={`${AURORA_LABEL} text-[var(--aurora-max-emerald)]`}>Verified record</p>
                    <p className="mt-1 text-xs text-white/45">Settled picks only. Pending picks never improve this record.</p>
                  </div>
                  {proofQuery.isLoading ? <Loader2 className="h-4 w-4 animate-spin text-vouch-cyan" /> : null}
                </div>
                {proof ? (
                  <>
                    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <div className="profile-aurora-metric"><p className="text-[10px] uppercase tracking-wider text-white/40">Record</p><p className="mt-1 text-sm font-black text-[var(--aurora-max-paper)]">{proof.record.wins}–{proof.record.losses}{proof.record.pushes ? `–${proof.record.pushes}` : ''}</p></div>
                      <div className="profile-aurora-metric"><p className="text-[10px] uppercase tracking-wider text-white/40">Win rate</p><p className="mt-1 text-sm font-black text-[var(--aurora-max-paper)]">{proof.record.winRate === null ? '—' : `${proof.record.winRate}%`}</p></div>
                      <div className="profile-aurora-metric"><p className="text-[10px] uppercase tracking-wider text-white/40">Net units</p><p className={`mt-1 text-sm font-black ${proof.record.netUnits >= 0 ? 'text-vouch-emerald' : 'text-rose-300'}`}>{proof.record.netUnits >= 0 ? '+' : ''}{proof.record.netUnits.toFixed(2)}u</p></div>
                      <div className="profile-aurora-metric"><p className="text-[10px] uppercase tracking-wider text-white/40">Settled</p><p className="mt-1 text-sm font-black text-[var(--aurora-max-paper)]">{proof.record.settled}</p></div>
                    </div>
                    <div className="profile-aurora-rule mt-4 border-t pt-3">
                      <p className="text-[10px] font-black uppercase tracking-wider text-white/45">Recent locked picks</p>
                      {proof.recentSettled.length ? <div className="mt-2 space-y-2">{proof.recentSettled.map((pick) => <div key={pick.id} className="flex items-center justify-between gap-3 text-xs"><span className="min-w-0 truncate text-white/70">{pick.selection}</span><span className={`shrink-0 font-black uppercase ${pick.status === 'won' ? 'text-vouch-emerald' : pick.status === 'lost' ? 'text-rose-300' : 'text-white/45'}`}>{pick.status} · {pick.settledUnits >= 0 ? '+' : ''}{pick.settledUnits.toFixed(2)}u</span></div>)}</div> : <p className="mt-2 text-xs text-white/35">No settled picks yet. This profile will build its record in public.</p>}
                    </div>
                  </>
                ) : <p className="mt-3 text-xs text-white/35">The verified record is temporarily unavailable.</p>}
              </section>

              {isEditing ? (
                <form onSubmit={handleProfileSave} className="aurora-max-panel space-y-3.5 p-3" id="profile-edit-subform">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Display Name</label>
                    <input 
                      type="text" 
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full text-xs outline-none"
                      maxLength={30}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Bio Overview</label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="h-20 w-full resize-none text-xs outline-none"
                      maxLength={160}
                    />
                  </div>

                  <div className="flex gap-2">
                    <button 
                      type="submit" 
                      className="aurora-max-control aurora-max-control--primary text-xs font-black"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Save Changes
                    </button>
                    <button 
                      type="button" 
                      onClick={() => {
                        setDisplayName(profile.displayName);
                        setBio(profile.bio);
                        setIsEditing(false);
                      }}
                      className="aurora-max-control text-xs font-bold font-mono"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="px-4 text-center mt-2 max-w-lg mx-auto">
                  <p className="text-white/90 text-[15px] leading-relaxed whitespace-pre-wrap font-medium">
                    {displayedProfile.bio}
                  </p>
                </div>
              )}
            </div>
          </AuroraMaxPanel>

          {/* X-Style Profile Tabs */}
          <div className="profile-aurora-tabs mt-6" id="profile-tabs">
            <button
              onClick={() => setActiveTab('posts')}
              className={`flex-1 pb-3 text-sm font-bold text-center transition-colors relative ${activeTab === 'posts' ? 'text-[var(--aurora-max-paper)]' : 'text-white/40 hover:text-white/70'}`}
            >
              Posts
              {userPosts.length > 0 && <span className="ml-1.5 text-[10px] font-black text-white/30">{userPosts.length}</span>}
              {activeTab === 'posts' && (
                <div className="profile-aurora-tab-ink" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('vouches')}
              className={`flex-1 pb-3 text-sm font-bold text-center transition-colors relative ${activeTab === 'vouches' ? 'text-[var(--aurora-max-paper)]' : 'text-white/40 hover:text-white/70'}`}
            >
              Vouches
              {userVouches.length > 0 && <span className="ml-1.5 text-[10px] font-black text-white/30">{userVouches.length}</span>}
              {activeTab === 'vouches' && (
                <div className="profile-aurora-tab-ink" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('replies')}
              className={`flex-1 pb-3 text-sm font-bold text-center transition-colors relative ${activeTab === 'replies' ? 'text-[var(--aurora-max-paper)]' : 'text-white/40 hover:text-white/70'}`}
            >
              Results
              {userResults.length > 0 && <span className="ml-1.5 text-[10px] font-black text-white/30">{userResults.length}</span>}
              {activeTab === 'replies' && (
                <div className="profile-aurora-tab-ink" />
              )}
            </button>
          </div>

          <div className="space-y-4 pt-2" id="user-archived-posts-section">
            {activeTab === 'posts' ? (
              userPosts.length === 0 ? (
                <div className="profile-aurora-empty py-10 text-center space-y-3">
                  <MessageSquare className="w-8 h-8 text-white/20 mx-auto" />
                  <p className="text-xs text-white/40 font-bold uppercase tracking-widest">No Posts Yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {userPosts.map((post) => (
                    <FeedPostCard
                      key={post.id}
                      post={post}
                      onLike={onLikePost}
                      onVouchAction={onVouchPost}
                      onRepost={onRepostPost}
                      onSaveVouch={onSaveVouch}
                      savedVouchIds={savedVouchIds}
                      onAddComment={onAddComment}
                      onDeletePost={onDeletePost}
                    />
                  ))}
                </div>
              )
            ) : activeTab === 'vouches' ? (
              userVouches.length === 0 ? (
                <div className="profile-aurora-empty py-10 text-center space-y-3">
                  <ShieldCheck className="w-8 h-8 text-white/20 mx-auto" />
                  <p className="text-xs text-white/40 font-bold uppercase tracking-widest">No Vouches Yet</p>
                  <p className="text-[11px] text-white/25 font-medium">Vouches will appear here once posted from the feed.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {userVouches.map((post) => (
                    <FeedPostCard
                      key={post.id}
                      post={post}
                      onLike={onLikePost}
                      onVouchAction={onVouchPost}
                      onRepost={onRepostPost}
                      onSaveVouch={onSaveVouch}
                      savedVouchIds={savedVouchIds}
                      onAddComment={onAddComment}
                      onDeletePost={onDeletePost}
                    />
                  ))}
                </div>
              )
            ) : (
              /* Results tab */
              userResults.length === 0 ? (
                <div className="profile-aurora-empty py-10 text-center space-y-3">
                  <ShieldCheck className="w-8 h-8 text-white/20 mx-auto" />
                  <p className="text-xs text-white/40 font-bold uppercase tracking-widest">No Graded Results</p>
                  <p className="text-[11px] text-white/25 font-medium">Settled vouches with outcomes will appear here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {userResults.map((post) => (
                    <FeedPostCard
                      key={post.id}
                      post={post}
                      onLike={onLikePost}
                      onVouchAction={onVouchPost}
                      onRepost={onRepostPost}
                      onSaveVouch={onSaveVouch}
                      savedVouchIds={savedVouchIds}
                      onAddComment={onAddComment}
                      onDeletePost={onDeletePost}
                    />
                  ))}
                </div>
              )
            )}
          </div>

        </div>

        {/* Right Sidebar: "My Outcomes" Private Calendar Win Rate Card */}
        <div className="lg:col-span-4 space-y-6">

          <AuroraMaxPanel className="space-y-4 relative animate-slide-up p-4" id="profile-performance-graphs-card">
            <div className="profile-aurora-rule flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-100 text-xs tracking-wider uppercase">
                  Performance Graphs
                </h3>
                <p className="text-[10px] text-slate-500 font-semibold mt-1">
                  Activity from the profile result feed. The verified record above is calculated directly from settled picks.
                </p>
              </div>
              <span className="aurora-max-eyebrow">
                SETTLED DATA
              </span>
            </div>

            <p className="text-[11px] text-slate-400">
              Performance metrics are calculated from settled results available to this profile. Unsettled picks and local-only drafts are excluded. Historical results do not guarantee future outcomes.
            </p>

            <p className={`${AURORA_LABEL} text-vouch-cyan`}>
              {displayedProfile.totalPicks > 0 ? `${displayedProfile.totalPicks} PICKS TRACKED` : 'NO SETTLED PICKS'}
            </p>

            {(() => {
              const graphRows = profileDays
                .map((day) => {
                  const ymd = getLocalYMD(day);
                  const label = day.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                  const dayOutcomes = userResults.filter(r => getLocalYMD(r.timestamp) === ymd);
                  const won = dayOutcomes.filter(r => r.result?.status === 'WON').length;
                  const lost = dayOutcomes.filter(r => r.result?.status === 'LOST').length;
                  const settled = won + lost;
                  const winRate = settled > 0 ? Math.round((won / settled) * 100) : 0;
                  const profit = Number(dayOutcomes.reduce((total, r) => {
                    if (r.result?.status === 'WON') return total + (r.result?.profit || 0);
                    if (r.result?.status === 'LOST') return total - (r.result?.units || 0);
                    return total;
                  }, 0).toFixed(2));

                  return { ymd, label, won, lost, settled, winRate, profit };
                })
                .reverse();

              const hasGraphData = graphRows.some(row => row.settled > 0);

              if (!hasGraphData) {
                return (
                  <div className="profile-aurora-empty p-4 text-center">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-300">
                      Start tracking picks to unlock your performance graph.
                    </p>
                    <p className="mt-2 text-[11px] text-slate-500">
                      Settled wins and losses will automatically populate your profile portfolio.
                    </p>
                  </div>
                );
              }

              return (
                <div className="space-y-5">
                  <div className="profile-aurora-inset h-[190px] p-2">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Profit / Loss</span>
                      <span className="text-[10px] font-mono text-white/35">Units by day</span>
                    </div>
                    <ResponsiveContainer width="100%" height="88%">
                      <AreaChart data={graphRows}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(157,215,175,0.12)" />
                        <XAxis dataKey="label" tick={{ fill: 'rgba(226,232,227,0.48)', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: 'rgba(226,232,227,0.48)', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{ background: 'var(--aurora-max-panel-strong)', border: '1px solid var(--aurora-max-line)', color: 'var(--aurora-max-paper)' }}
                          formatter={(value) => [`${Number(value).toFixed(2)}U`, 'Profit']}
                        />
                        <Area type="monotone" dataKey="profit" stroke="#00d9a0" fill="#00d9a0" fillOpacity={0.12} strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="profile-aurora-inset h-[190px] p-2">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Win Rate Trend</span>
                      <span className="text-[10px] font-mono text-white/35">Settled plays</span>
                    </div>
                    <ResponsiveContainer width="100%" height="88%">
                      <BarChart data={graphRows}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(157,215,175,0.12)" />
                        <XAxis dataKey="label" tick={{ fill: 'rgba(226,232,227,0.48)', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: 'rgba(226,232,227,0.48)', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                        <Tooltip
                          contentStyle={{ background: 'var(--aurora-max-panel-strong)', border: '1px solid var(--aurora-max-line)', color: 'var(--aurora-max-paper)' }}
                          formatter={(value) => [`${Number(value).toFixed(0)}%`, 'Win rate']}
                        />
                        <Bar dataKey="winRate" fill="#00d9a0" radius={[0, 0, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              );
            })()}
          </AuroraMaxPanel>

          <AuroraMaxPanel className="hidden md:block space-y-4 relative animate-slide-up p-4" id="profile-my-outcomes-sidemenu-card">
            <div className="profile-aurora-rule flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block animate-pulse" />
                <h3 className="font-bold text-slate-100 text-xs tracking-wider uppercase">
                  Recent Outcomes
                </h3>
              </div>
              <span className="aurora-max-eyebrow">
                SETTLED RECORD
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">
              Settled results grouped by day from the profile record currently available.
              <strong className="text-slate-300"> Hover over a date</strong> to inspect its recorded outcomes and unit result.
            </p>

            <div className="space-y-2 relative" id="private-ledgers-days-rows">
              {profileDays.map((day) => {
                const ymd = getLocalYMD(day);
                const isToday = ymd === getLocalYMD(new Date());
                const formattedDate = day.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

                const dayOutcomes = userResults.filter(r => getLocalYMD(r.timestamp) === ymd);
                const wonCount = dayOutcomes.filter(r => r.result?.status === 'WON').length;
                const lostCount = dayOutcomes.filter(r => r.result?.status === 'LOST').length;
                const totalPlayed = wonCount + lostCount;
                const winRate = totalPlayed > 0 ? (wonCount / totalPlayed) * 100 : null;
                const netProfit = dayOutcomes.reduce((total, r) => {
                  if (r.result?.status === 'WON') {
                    return total + (r.result?.profit || 0);
                  } else if (r.result?.status === 'LOST') {
                    return total - (r.result?.units || 0);
                  }
                  return total;
                }, 0);

                const hasPlays = dayOutcomes.length > 0;

                return (
                  <div
                    key={ymd}
                    onMouseEnter={() => setHoveredDayYmd(ymd)}
                    onMouseLeave={() => setHoveredDayYmd(null)}
                    className={`profile-aurora-day relative p-2.5 transition-all duration-200 cursor-pointer ${ hasPlays ? '' : 'opacity-55 hover:opacity-100' }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono font-bold text-slate-200">{formattedDate}</span>
                        {isToday && (
                          <span className="aurora-max-eyebrow">
                            Today
                          </span>
                        )}
                      </div>

                      {/* Display daily Win Rate */}
                      {hasPlays ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono text-slate-500 font-bold uppercase block sm:inline">
                            {totalPlayed} play{totalPlayed > 1 ? 's' : ''}
                          </span>
                          <span className={`text-xs font-mono font-black ${ winRate !== null && winRate >= 50 ? 'text-emerald-400' : 'text-rose-400' }`}>
                            {winRate !== null ? `${winRate.toFixed(0)}% WR` : 'Settle Pending'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[9px] font-mono text-slate-600 uppercase font-black tracking-wider">No Outcomes</span>
                      )}
                    </div>

                    {/* Simple Progress Bar indicator */}
                    {hasPlays && winRate !== null && (
                      <div className="w-full h-1 mt-2.5 rounded overflow-hidden flex">
                        <div className="bg-emerald-500 h-full" style={{ width: `${winRate}%` }} />
                        <div className="bg-rose-500 h-full" style={{ width: `${100 - winRate}%` }} />
                      </div>
                    )}

                    {/* Rich Floating HTML Tooltip relative to container */}
                    {hoveredDayYmd === ymd && (
                      <div className="profile-aurora-tip absolute left-1/2 -translate-x-1/2 w-[min(280px,calc(100vw-2rem))] lg:left-auto lg:right-0 lg:translate-x-0 lg:w-[280px] top-[102%] z-50 space-y-3 p-3 animate-fadeIn">
                        <div className="profile-aurora-rule flex justify-between items-center border-b pb-2">
                          <span className="text-xs font-black text-slate-200 uppercase tracking-wider">{formattedDate} Performance</span>
                          <span className="text-[9px] font-mono text-slate-500">{ymd}</span>
                        </div>

                        {hasPlays ? (
                          <div className="space-y-3">
                            {/* Winrate Stats Grid panel */}
                            <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                              <div className="profile-aurora-metric">
                                <p className="text-slate-400 uppercase font-black tracking-wider">Winrate</p>
                                <p className="text-sky-455 font-mono font-bold text-xs mt-0.5 text-sky-400 font-black">
                                  {winRate !== null ? `${winRate.toFixed(0)}%` : '—'}
                                </p>
                              </div>
                              <div className="profile-aurora-metric">
                                <p className="text-slate-400 uppercase font-black tracking-wider">W / L</p>
                                <p className="text-slate-200 font-mono font-bold text-xs mt-0.5">{wonCount}W - {lostCount}L</p>
                              </div>
                              <div className="profile-aurora-metric">
                                <p className="text-slate-400 uppercase font-black tracking-wider">Profit</p>
                                <p className={`font-mono font-bold text-xs mt-0.5 ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-455'}`}>
                                  {netProfit >= 0 ? '+' : ''}{netProfit.toFixed(1)}U
                                </p>
                              </div>
                            </div>

                            {/* Plays breakdown list */}
                            <div className="space-y-1.5 max-h-[140px] overflow-y-auto no-scrollbar">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Settled Markets</p>
                              {dayOutcomes.map((item, idx) => (
                                <div key={idx} className="profile-aurora-inset flex justify-between items-center gap-2 p-2 text-[10px]">
                                  <span className="text-slate-300 font-medium truncate max-w-[140px]">{item.result?.marketName}</span>
                                  <span className={`font-mono font-black rounded text-[9px] ${ item.result?.status === 'WON' ? 'bg-emerald-950/80 text-emerald-400' : 'bg-rose-950/80 text-rose-400' }`}>
                                    {item.result?.status}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-[10px] text-slate-500 text-center font-mono leading-relaxed">
                            No ledger outcomes recorded for this date. Settle plays in your feed to populate.
                          </p>
                        )}
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          </AuroraMaxPanel>
        </div>

      </div>
    </div>

      {/* Profile Share Studio Modal Popup */}
      {showShareModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--aurora-max-obsidian)]/80 backdrop-blur-sm animate-fade-in" id="profile-share-modal-overlay">
          <ProfileShareCard profile={profile} onClose={() => setShowShareModal(false)} />
        </div>
      )}
    </ProfileThemeWrapper>
  );
}
