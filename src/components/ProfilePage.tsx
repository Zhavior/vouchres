import React, { useState } from 'react';
import { Shield, ShieldCheck, ArrowLeft, Edit3, Save, Info, Sparkles, MessageSquare, Share, Lock, Palette } from 'lucide-react';
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
import { useAuth } from '../lib/useAuth';
import { useProfileSocialStats } from '../hooks/useSocialGraph';
import { Z8_LABEL, Z8_PAGE, Z8_PAGE_GAP, Z8_PAGE_PAD_X, Z8_PAGE_PAD_Y, Z8_PANEL_PREMIUM, Z8_STAT_CHIP, Z8_TABULAR } from '../theme/z8Tokens';
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

export default function ProfilePage({ 
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
  const socialStats = useProfileSocialStats(profileUserId);
  const [isEditing, setIsEditing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [bio, setBio] = useState(profile.bio);
  const [hoveredDayYmd, setHoveredDayYmd] = useState<string | null>(null);
  const entitlements = useEntitlements();
  const canEditHeader = canCustomizeProfileHeader(profile, {
    isPro: entitlements.isPro,
    isStaff: entitlements.isStaff,
  });

  const getActiveThemeData = () => {
    const themeToFind = profile.profileThemeId || profile.activeTheme || 'cyber-blue';
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

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      displayName: displayName.trim(),
      bio: bio.trim()
    });
    setIsEditing(false);
  };

  // Filter user's posts
  const userPosts = posts.filter(
    p => p.userId === 'u-user-current' || p.username === profile.username || p.displayName === profile.displayName
  );

  // Filter user's results
  const userResults = posts.filter(
    p => p.postType === 'RESULT' && p.result && (p.userId === 'u-user-current' || p.username === profile.username || p.displayName === profile.displayName)
  );

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
    <ProfileThemeWrapper themeId={profile.profileThemeId || profile.activeTheme || 'cyber-blue'}>
      <div className={`${Z8_PAGE} ve-page-shell min-h-0 min-w-0 max-w-[1120px] mx-auto overflow-x-hidden bg-ve-obsidian text-ve-flash ve-safe-bottom ${Z8_PAGE_PAD_X} ${Z8_PAGE_PAD_Y} ${Z8_PAGE_GAP}`} id="profile-details-view">

        <header className="flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className={`${Z8_LABEL} text-vouch-emerald`}>{isOwnProfile ? 'Your profile' : 'Community profile'}</span>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              {isOwnProfile ? 'Trust record and identity' : `${profile.displayName}'s trust record`}
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-white/55">
              Settled results, public activity, and account identity in one verifiable record.
            </p>
          </div>
          {!isOwnProfile && onClearViewUser && (
            <button type="button" onClick={onClearViewUser} className="z8-control inline-flex min-h-11 items-center justify-center gap-2 border border-white/10 bg-black/30 px-4 font-mono text-[11px] font-bold uppercase tracking-wide text-white/70 hover:border-vouch-cyan/35 hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              Back to your profile
            </button>
          )}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Profile Card, Pro verification, & Activity feed */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Main card */}
            <div className={`${Z8_PANEL_PREMIUM} rounded-2xl overflow-hidden relative transition-all duration-300 ${
              activeThemeData ? activeThemeData.fontFamily || 'font-sans' : 'font-sans'
            }`} id="profile-primary-card">
              
              {/* Cats around the borders of the profile card (Google Cats Theme) */}
              {profile.activeTheme === 'google_cats' && (
                <>
                  {/* Cat peaking over the top border */}
                  <div className="absolute -top-3.5 right-12 flex flex-col items-center pointer-events-none select-none z-30 transition-all hover:-top-1 group cursor-pointer">
                    <span className="text-3xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] animate-bounce" style={{ animationDuration: '3s' }}>🐱</span>
                    <span className="text-[8px] bg-yellow-400 text-ve-surface-panel px-1.5 py-0.5 rounded font-black uppercase font-mono tracking-wider border border-slate-900 shadow leading-none scale-90">G_KITTY</span>
                  </div>
                  
                  {/* Kitten clinging onto the left border */}
                  <div className="absolute top-1/3 -left-3.5 flex items-center pointer-events-none select-none z-30 animate-pulse">
                    <span className="text-3xl rotate-45 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">🐈</span>
                  </div>

                  {/* Cute sleeping cat on the bottom border margin */}
                  <div className="absolute -bottom-1.5 right-6 flex items-center pointer-events-none select-none z-30 opacity-80">
                    <span className="text-2xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">🐾🐈‍⬛💤</span>
                  </div>

                  {/* Paw prints across the top boundary */}
                  <div className="absolute top-2 left-1/4 flex gap-4 pointer-events-none select-none z-10 opacity-20 font-mono text-xs">
                    <span>🐾</span>
                    <span>🐾</span>
                    <span>🐾</span>
                  </div>
                </>
              )}

              {/* Dynamic theme floating bubbles */}
              {profile.activeTheme && profile.activeTheme !== 'default' && (
                <DeferredBubbleField count={8} mobileCount={3} variant="float" className="opacity-35 z-0" />
              )}

              <div className={`h-28 sm:h-32 bg-gradient-to-r relative border-b border-vouch-cyan/15 z-10 ${
                activeThemeData ? activeThemeData.coverBg || 'from-sky-600/25 to-indigo-600/25' : 'from-sky-600/25 to-indigo-600/25'
              }`}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent pointer-events-none" />
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-vouch-cyan/50 to-transparent" />

                {/* Header customization — Gold+ only */}
                <div className="absolute top-3 right-3 z-20">
                  {isOwnProfile && canEditHeader ? (
                    <button
                      type="button"
                      onClick={() => onSectionChange?.('themestore')}
                      className="flex items-center gap-1.5 rounded-full border border-vouch-cyan/30 bg-black/45 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-vouch-cyan backdrop-blur-sm transition-colors hover:border-vouch-cyan/55 hover:bg-black/60"
                      id="customize-profile-header-btn"
                    >
                      <Palette className="w-3.5 h-3.5" />
                      Customize Header
                    </button>
                  ) : isOwnProfile ? (
                    <button
                      type="button"
                      onClick={() => onSectionChange?.('premium')}
                      className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white/55 backdrop-blur-sm transition-colors hover:border-vouch-amber/35 hover:text-vouch-amber"
                      id="locked-profile-header-btn"
                      title="Upgrade to Gold to customize your profile header"
                    >
                      <Lock className="w-3.5 h-3.5 text-vouch-amber/80" />
                      Upgrade to customize header
                    </button>
                  ) : null}
                </div>

                <div className="absolute -bottom-10 left-6 z-10">
                  
                  {/* Cute Kitten Ears & Whiskers on image border for Google Cats Theme */}
                  {profile.activeTheme === 'google_cats' && (
                    <>
                      {/* Left ear */}
                      <div className="absolute -top-3 left-1.5 w-6 h-6 bg-blue-500 border border-slate-950 rounded-tr-emerald-500 rounded-tl-2xl rounded-br-2xl rotate-12 z-30 flex items-center justify-center shadow-lg">
                        <div className="w-3 h-3 bg-pink-400 rounded-tr-emerald-400 rounded-tl-xl rounded-br-xl" />
                      </div>
                      {/* Right ear */}
                      <div className="absolute -top-3 right-1.5 w-6 h-6 bg-green-600 border border-slate-950 rounded-tl-emerald-500 rounded-tr-2xl rounded-bl-2xl -rotate-12 z-30 flex items-center justify-center shadow-lg">
                        <div className="w-3 h-3 bg-pink-400 rounded-tl-emerald-400 rounded-tr-xl rounded-bl-xl" />
                      </div>
                      {/* Left & Right whiskers indicators */}
                      <div className="absolute -left-3.5 top-6 font-mono font-black text-[#EA4335] text-xs pointer-events-none select-none z-10 rotate-12 animate-pulse">🐾</div>
                      <div className="absolute -right-3.5 top-6 font-mono font-black text-[#FBBC05] text-xs pointer-events-none select-none z-10 -rotate-12 animate-pulse">🐾</div>
                    </>
                  )}

                  <ProfileAvatarBorder 
                    borderId={profile.profileBorderId}
                    displayName={profile.displayName}
                    initials={profile.displayName.split(' ').map(n=>n[0]).join('')}
                    size="xl"
                    winRate={profile.winRate}
                    isVerified={profile.verified}
                  />
                </div>
              </div>

            <div className="p-6 pt-12 space-y-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                      {displayName}
                    </h3>
                    {profile.verified && (
                      <span className="text-[10px] bg-vouch-emerald/10 text-vouch-emerald px-2 py-0.5 rounded-full font-bold border border-vouch-emerald/25 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        VERIFIED ACCOUNT
                      </span>
                    )}
                  </div>
                  <p className={`${Z8_LABEL} text-white/40 mt-0.5 normal-case tracking-normal font-medium`}>@{profile.handle || profile.username}</p>
                  
                  {/* Dynamic Followers and Tailing count belt */}
                  <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 mt-2.5 text-[11px] text-white/45 font-medium ${Z8_TABULAR}`}>
                    <div className="whitespace-nowrap">
                      <strong className="text-white/90">{socialStats.followers}</strong>{' '}
                      <span className="text-white/35">followers</span>
                    </div>
                    <div className="whitespace-nowrap">
                      <strong className="text-white/90 font-bold">{socialStats.subscribers}</strong>{' '}
                      <span className="text-white/35">
                        {profile.subscriptionTier === 'SELLER_PRO' ? 'subscribers' : 'subscribers'}
                      </span>
                    </div>
                    <div className="whitespace-nowrap">
                      <strong className="text-white/90">{socialStats.friends}</strong>{' '}
                      <span className="text-white/35">friends</span>
                    </div>
                    <div className="whitespace-nowrap">
                      <strong className="text-white/90">{followingCount}</strong>{' '}
                      <span className="text-white/35">following</span>
                    </div>
                    <div className="whitespace-nowrap">
                      <strong className="text-white/90">{socialStats.tailing}</strong>{' '}
                      <span className="text-white/35">tailing</span>
                    </div>
                  </div>

                  {/* Slogan phrase or custom quote (Custom AI Theme extensibility) */}
                  {activeThemeData?.customAIPhrase && (
                    <div className="mt-2.5 p-2 bg-slate-950/55 rounded-xl border border-slate-850/60 flex items-center gap-2 max-w-fit shadow-inner">
                      <span className="text-[8.5px] bg-indigo-950/50 text-indigo-400 font-mono font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wide border border-indigo-900/30">
                        {activeThemeData.badge ? activeThemeData.badge.toUpperCase() : 'THEM_AURA'}
                      </span>
                      <span className="text-[10px] text-slate-300 font-extrabold font-mono tracking-wider leading-none">
                        {activeThemeData.customAIPhrase}
                      </span>
                    </div>
                  )}
                </div>

                {!isEditing ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <VEButton
                      onClick={() => setShowShareModal(true)}
                      id="share-profile-btn"
                      variant="ghost"
                      className="border-sky-800/40 text-sky-400 hover:text-sky-300"
                    >
                      <Share className="w-3.5 h-3.5" />
                      Share Card
                    </VEButton>
                    {isOwnProfile && (
                      <VEButton
                        onClick={() => setIsEditing(true)}
                        id="edit-profile-btn"
                        variant="ghost"
                        className="border-slate-800 text-slate-300 hover:text-slate-100"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit Profile
                      </VEButton>
                    )}
                  </div>
                ) : null}
              </div>

              {isEditing ? (
                <form onSubmit={handleProfileSave} className="space-y-3.5 bg-ve-graphite p-4 rounded-xl border border-slate-850" id="profile-edit-subform">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Display Name</label>
                    <input 
                      type="text" 
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full text-xs bg-ve-storm border border-slate-800 rounded-lg px-3 py-2 text-slate-200 outline-none focus:border-sky-500"
                      maxLength={30}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Bio Overview</label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="w-full text-xs bg-ve-storm border border-slate-800 rounded-lg px-3 py-2 text-slate-200 outline-none focus:border-sky-500 h-20 resize-none"
                      maxLength={160}
                    />
                  </div>

                  <div className="flex gap-2">
                    <button 
                      type="submit" 
                      className="px-3 py-1.5 bg-sky-500 hover:bg-sky-450 text-slate-950 font-black rounded-lg text-xs flex items-center gap-1 shadow transition-colors"
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
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-slate-200 rounded-lg text-xs font-bold font-mono"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <p className="text-white/75 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                  "{profile.bio}"
                </p>
              )}

              {/* Verified Metrics Strip Grid */}
              <div className="space-y-3.5 pt-1">
                <h4 className={`${Z8_LABEL} text-white/55 flex items-center gap-1.5`}>
                  <Shield className="w-4 h-4 text-vouch-emerald" />
                  Verified Sports Tracker Analytics
                </h4>

                <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs ${Z8_TABULAR}`}>
                  <div className={`${Z8_STAT_CHIP} p-3`}>
                    <p className={`${Z8_LABEL} text-white/35`}>True Win Rate</p>
                    <p className="font-mono text-base font-black text-vouch-cyan mt-1">{profile.winRate.toFixed(1)}%</p>
                  </div>
                  <div className={`${Z8_STAT_CHIP} p-3`}>
                    <p className={`${Z8_LABEL} text-white/35`}>Net Returns</p>
                    <p className={`font-mono text-base font-black mt-1 ${profile.unitsNetProfit >= 0 ? 'text-vouch-emerald' : 'text-rose-400'}`}>
                      {profile.unitsNetProfit >= 0 ? '+' : ''}{profile.unitsNetProfit.toFixed(1)}U
                    </p>
                  </div>
                  <div className={`${Z8_STAT_CHIP} p-3`}>
                    <p className={`${Z8_LABEL} text-white/35`}>Verified Picks</p>
                    <p className="font-mono text-base font-black text-white mt-1">{profile.totalPicks}</p>
                  </div>
                  <div className={`${Z8_STAT_CHIP} p-3`}>
                    <p className={`${Z8_LABEL} text-white/35`}>Total Won</p>
                    <p className="font-mono text-base font-black text-vouch-emerald mt-1">{profile.wonPicks}</p>
                  </div>
                </div>
              </div>

              {/* Sub-tier Badge Details */}
              <div className={`flex items-center justify-between p-3.5 rounded-xl border text-xs ${
                profile.subscriptionTier === 'SELLER_PRO'
                  ? 'border-vouch-cyan/25 bg-vouch-cyan/5'
                  : profile.subscriptionTier === 'GOLD'
                    ? 'border-vouch-emerald/25 bg-vouch-emerald/5'
                    : 'border-white/10 bg-black/25'
              }`}>
                <div className="flex items-center gap-2">
                  <Sparkles className={`w-4 h-4 ${
                    profile.subscriptionTier === 'SELLER_PRO' ? 'text-vouch-cyan' :
                    profile.subscriptionTier === 'GOLD' ? 'text-vouch-emerald' : 'text-white/40'
                  }`} />
                  <div>
                    <span className={`${Z8_LABEL} text-white/35 block leading-tight`}>Subscription Tier</span>
                    <span className="font-extrabold text-white text-xs tracking-wide">
                      {profile.subscriptionTier === 'SELLER_PRO' ? '💎 SELLER PRO MONETIZED' : profile.subscriptionTier === 'GOLD' ? '✨ VEDGE GOLD' : '🛡️ VEdge BASIC PARTNER'}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`${Z8_LABEL} text-white/35 block`}>Status</span>
                  <span className="text-vouch-emerald text-xs font-black font-mono">
                    {profile.totalPicks > 0 ? `${profile.totalPicks} PICKS TRACKED` : 'NO SETTLED PICKS'}
                  </span>
                </div>
              </div>

              {isOwnProfile && !canEditHeader && (
                <div className="flex items-start gap-2 rounded-xl border border-vouch-amber/20 bg-vouch-amber/5 px-3.5 py-2.5 text-[11px] text-white/55">
                  <Lock className="w-3.5 h-3.5 text-vouch-amber shrink-0 mt-0.5" />
                  <p>
                    Profile header themes are a <span className="text-vouch-emerald font-bold">Gold</span> perk.
                    {' '}
                    <button
                      type="button"
                      onClick={() => onSectionChange?.('premium')}
                      className="text-vouch-cyan font-bold hover:underline"
                    >
                      Upgrade to customize header
                    </button>
                  </p>
                </div>
              )}

            </div>
          </div>

          {/* Verification disclosure */}
          <div className={`${Z8_PANEL_PREMIUM} rounded-2xl p-3.5 flex items-start gap-2.5`}>
            <Info className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <div className="text-[11px] text-slate-400 leading-relaxed font-semibold">
              <span className="text-slate-350 block mb-1">TRACKING DISCLOSURE:</span>
              Performance metrics are calculated from settled results available to this profile. Unsettled picks and local-only drafts are excluded. Historical results do not guarantee future outcomes.
            </div>
          </div>

          {/* Your Previous Posts Feed list */}
          <div className="space-y-4 pt-2" id="user-archived-posts-section">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 px-1">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0"></span>
                My Shared Stakes & Ledger Posts ({userPosts.length})
              </h3>
              <span className="text-[10px] text-slate-500 font-mono font-bold">
                Transparent Archive
              </span>
            </div>

            {userPosts.length === 0 ? (
              <div className="p-12 text-center bg-ve-storm rounded-2xl border border-slate-850 space-y-3">
                <MessageSquare className="w-10 h-10 text-slate-600 mx-auto animate-pulse" />
                <div className="space-y-1">
                  <p className="text-xs text-slate-300 font-bold uppercase font-mono">No Posts Published Yet</p>
                  <p className="text-[11px] text-slate-550 max-w-sm mx-auto text-slate-450 leading-relaxed">
                    You haven't logged any sports analyses, result settlements, or parlay slips to the feed yet. 
                    Use the composer on the Home Feed or the custom Vouch visual generator to make your mark!
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4" id="user-previous-posts-list">
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
            )}
          </div>

        </div>

        {/* Right Sidebar: "My Outcomes" Private Calendar Win Rate Card */}
        <div className="lg:col-span-4 space-y-6">

          <div className={`${Z8_PANEL_PREMIUM} rounded-2xl p-4.5 space-y-4 shadow-xl relative animate-slide-up`} id="profile-performance-graphs-card">
            <div className="flex items-center justify-between border-b border-slate-850 pb-3">
              <div>
                <h3 className="font-bold text-slate-100 text-xs tracking-wider uppercase">
                  Performance Graphs
                </h3>
                <p className="text-[10px] text-slate-500 font-semibold mt-1">
                  Real ledger data from your settled outcomes.
                </p>
              </div>
              <span className="text-[9px] font-mono font-black text-vouch-cyan bg-cyan-950/40 px-2 py-0.5 rounded-full border border-cyan-900/40 uppercase">
                SETTLED DATA
              </span>
            </div>

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
                  <div className={`${Z8_PANEL_PREMIUM} rounded-2xl p-5 text-center`}>
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
                  <div className={`${Z8_PANEL_PREMIUM} h-[190px] p-3`}>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Profit / Loss</span>
                      <span className="text-[10px] font-mono text-slate-500">Units by day</span>
                    </div>
                    <ResponsiveContainer width="100%" height="88%">
                      <AreaChart data={graphRows}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" />
                        <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{ background: '#020617', border: '1px solid rgba(148,163,184,0.25)', borderRadius: 12, color: '#e2e8f0' }}
                          formatter={(value) => [`${Number(value).toFixed(2)}U`, 'Profit']}
                        />
                        <Area type="monotone" dataKey="profit" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.12} strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className={`${Z8_PANEL_PREMIUM} h-[190px] p-3`}>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Win Rate Trend</span>
                      <span className="text-[10px] font-mono text-slate-500">Settled plays</span>
                    </div>
                    <ResponsiveContainer width="100%" height="88%">
                      <BarChart data={graphRows}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" />
                        <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                        <Tooltip
                          contentStyle={{ background: '#020617', border: '1px solid rgba(148,163,184,0.25)', borderRadius: 12, color: '#e2e8f0' }}
                          formatter={(value) => [`${Number(value).toFixed(0)}%`, 'Win rate']}
                        />
                        <Bar dataKey="winRate" fill="#10b981" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              );
            })()}
          </div>

          <div className={`hidden md:block ${Z8_PANEL_PREMIUM} rounded-2xl p-4.5 space-y-4 shadow-xl relative animate-slide-up`} id="profile-my-outcomes-sidemenu-card">
            <div className="flex items-center justify-between border-b border-slate-850 pb-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block animate-pulse" />
                <h3 className="font-bold text-slate-100 text-xs tracking-wider uppercase">
                  Recent Outcomes
                </h3>
              </div>
              <span className="text-[9px] font-mono font-black text-emerald-450 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-900/40 uppercase">
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
                    className={`relative p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                      hasPlays 
                        ? 'bg-slate-900/60 border-slate-800 hover:border-slate-600 hover:bg-ve-surface-panel/45 shadow-sm' 
                        : 'bg-ve-storm/40 border-slate-900/50 opacity-55 hover:opacity-100 transition-opacity'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono font-bold text-slate-200">{formattedDate}</span>
                        {isToday && (
                          <span className="text-[8px] font-black uppercase tracking-wider text-sky-400 bg-sky-950 px-1 py-0.2 rounded border border-sky-900/50">
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
                          <span className={`text-xs font-mono font-black ${
                            winRate !== null && winRate >= 50 ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {winRate !== null ? `${winRate.toFixed(0)}% WR` : 'Settle Pending'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[9px] font-mono text-slate-600 uppercase font-black tracking-wider">No Outcomes</span>
                      )}
                    </div>

                    {/* Simple Progress Bar indicator */}
                    {hasPlays && winRate !== null && (
                      <div className="w-full bg-slate-950 h-1 mt-2.5 rounded overflow-hidden flex">
                        <div className="bg-emerald-500 h-full" style={{ width: `${winRate}%` }} />
                        <div className="bg-rose-500 h-full" style={{ width: `${100 - winRate}%` }} />
                      </div>
                    )}

                    {/* Rich Floating HTML Tooltip relative to container */}
                    {hoveredDayYmd === ymd && (
                      <div className="absolute left-[-20px] right-[-20px] lg:left-auto lg:right-0 lg:w-[280px] top-[102%] z-50 bg-slate-950 border border-slate-800 p-3.5 rounded-2xl shadow-2xl space-y-3 animate-fadeIn">
                        <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                          <span className="text-xs font-black text-slate-200 uppercase tracking-wider">{formattedDate} Performance</span>
                          <span className="text-[9px] font-mono text-slate-500">{ymd}</span>
                        </div>

                        {hasPlays ? (
                          <div className="space-y-3">
                            {/* Winrate Stats Grid panel */}
                            <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                              <div className="bg-ve-storm p-1.5 rounded-md border border-slate-850">
                                <p className="text-slate-400 uppercase font-black tracking-wider">Winrate</p>
                                <p className="text-sky-455 font-mono font-bold text-xs mt-0.5 text-sky-400 font-black">
                                  {winRate !== null ? `${winRate.toFixed(0)}%` : '—'}
                                </p>
                              </div>
                              <div className="bg-ve-storm p-1.5 rounded-md border border-slate-850">
                                <p className="text-slate-400 uppercase font-black tracking-wider">W / L</p>
                                <p className="text-slate-200 font-mono font-bold text-xs mt-0.5">{wonCount}W - {lostCount}L</p>
                              </div>
                              <div className="bg-ve-storm p-1.5 rounded-md border border-slate-850">
                                <p className="text-slate-400 uppercase font-black tracking-wider">Profit</p>
                                <p className={`font-mono font-bold text-xs mt-0.5 ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-455'}`}>
                                  {netProfit >= 0 ? '+' : ''}{netProfit.toFixed(1)}U
                                </p>
                              </div>
                            </div>

                            {/* Plays breakdown list */}
                            <div className="space-y-1.5 max-h-[140px] overflow-y-auto no-scrollbar">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest block pl-0.5">Settled Markets</p>
                              {dayOutcomes.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center text-[10px] bg-slate-900/40 p-1.5 rounded-lg border border-slate-850">
                                  <span className="text-slate-300 font-medium truncate max-w-[140px]">{item.result?.marketName}</span>
                                  <span className={`font-mono font-black px-1.5 rounded text-[9px] ${
                                    item.result?.status === 'WON' ? 'bg-emerald-950/80 text-emerald-400' : 'bg-rose-950/80 text-rose-400'
                                  }`}>
                                    {item.result?.status}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-[10px] text-slate-500 text-center font-mono py-2 leading-relaxed">
                            No ledger outcomes recorded for this date. Settle plays in your feed to populate.
                          </p>
                        )}
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* Profile Share Studio Modal Popup */}
      {showShareModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-fade-in" id="profile-share-modal-overlay">
          <ProfileShareCard profile={profile} onClose={() => setShowShareModal(false)} />
        </div>
      )}

    </div>
    </ProfileThemeWrapper>
  );
}
