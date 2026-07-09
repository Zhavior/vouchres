import React, { useState } from 'react';
import { User, Shield, ShieldCheck, Mail, Calendar, Edit3, Save, Info, Sparkles, MessageSquare, Share } from 'lucide-react';
import { CreatorProofProfile, FeedPost, Vouch, Parlay } from '../types';
import ProfileResume from './profile/ProfileResume';
import FeedPostCard from '../social/feed/FeedPostCard';
import { THEME_REGISTRY, VisualTheme } from '../theme/themeRegistry';
import ProfileThemeWrapper from './profile/ProfileThemeWrapper';
import ProfileAvatarBorder from './profile/ProfileAvatarBorder';
import ProfileShareCard from './profile/ProfileShareCard';
import { VEButton } from './ui/ve';
import { Z8_PAGE } from '../theme/z8Tokens';
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
  savedParlays?: Parlay[];
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
  savedParlays = []
}: ProfilePageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [bio, setBio] = useState(profile.bio);
  const [hoveredDayYmd, setHoveredDayYmd] = useState<string | null>(null);

  const getActiveThemeData = () => {
    const themeToFind = profile.profileThemeId || profile.activeTheme || 'cyber-blue';
    let found = THEME_REGISTRY.find(t => t.id === themeToFind);
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
              cardStyle: match.cardStyle || 'bg-[#121824] border-slate-800',
              glowColor: match.glowColor || 'from-sky-500 to-indigo-500',
              particleDemo: match.particleDemo || ['✨', '💎'],
              fontFamily: match.fontFamily || 'font-mono',
              coverBg: match.coverBg || 'from-indigo-650/40 to-slate-950/40',
              customAIPhrase: match.customAIPhrase || '🚀 CUSTOM THEME REVENUE INSTANCE LIVE'
            };
          }
        }
      } catch (e) {}
    }
    return found;
  };

  const activeThemeData = getActiveThemeData();
  
  const [followingCount, setFollowingCount] = useState(() => {
    try {
      const stored = localStorage.getItem('vouchedge_following');
      return stored ? JSON.parse(stored).length : 0;
    } catch {
      return 0;
    }
  });

  React.useEffect(() => {
    const handleSync = (e: any) => {
      setFollowingCount(e.detail.length);
    };
    window.addEventListener('vouchedge-following-updated', handleSync);
    return () => {
      window.removeEventListener('vouchedge-following-updated', handleSync);
    };
  }, []);

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
      <div className={`p-4 md:p-6 max-w-[1120px] mx-auto ${Z8_PAGE} space-y-6`} id="profile-details-view">

        <ProfileResume savedParlays={savedParlays} winRate={profile.winRate} />

        {/* Title segment */}
        <div className="flex flex-col">
          <h2 className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-2 font-z8">
            <User className="w-5 h-5 text-vouch-cyan" />
            Real Profile Guard & Proof Hub
          </h2>
          <p className="text-xs text-white/45 mt-1 font-z8">
            Review your tracking statistics, win rates, and verify your proof handle credentials.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Profile Card, Pro verification, & Activity feed */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Main card */}
            <div className={`rounded-2xl border overflow-hidden relative transition-all duration-300 ${
              activeThemeData ? activeThemeData.fontFamily || 'font-sans' : 'font-sans'
            } ${
              activeThemeData ? activeThemeData.cardStyle : 'bg-[#121824] border-slate-850'
            }`} id="profile-primary-card">
              
              {/* Cats around the borders of the profile card (Google Cats Theme) */}
              {profile.activeTheme === 'google_cats' && (
                <>
                  {/* Cat peaking over the top border */}
                  <div className="absolute -top-3.5 right-12 flex flex-col items-center pointer-events-none select-none z-30 transition-all hover:-top-1 group cursor-pointer">
                    <span className="text-3xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] animate-bounce" style={{ animationDuration: '3s' }}>🐱</span>
                    <span className="text-[8px] bg-[#FBBC05] text-[#121824] px-1.5 py-0.5 rounded font-black uppercase font-mono tracking-wider border border-slate-900 shadow leading-none scale-90">G_KITTY</span>
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

              {/* Dynamic theme floating elements */}
              {profile.activeTheme && profile.activeTheme !== 'default' && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-35 flex justify-around items-center z-0 select-none">
                  {Array.from({ length: 12 }).map((_, i) => {
                    const themeSymbols = activeThemeData && activeThemeData.particleDemo ? activeThemeData.particleDemo : ['✨'];
                    const sym = themeSymbols[i % themeSymbols.length];
                    return (
                      <span 
                        key={i} 
                        className="animate-pulse text-xs"
                        style={{
                          animationDelay: `${i * 150}ms`,
                          transform: `translateY(${Math.sin(i) * 20}px) rotate(${i * 30}deg)`
                        }}
                      >
                        {sym}
                      </span>
                    );
                  })}
                </div>
              )}

              <div className={`h-24 bg-gradient-to-r relative border-b border-slate-850/60 z-10 ${
                activeThemeData ? activeThemeData.coverBg || 'from-sky-600/25 to-indigo-600/25' : 'from-sky-600/25 to-indigo-600/25'
              }`}>
                <div className="absolute -bottom-10 left-6">
                  
                  {/* Cute Kitten Ears & Whiskers on image border for Google Cats Theme */}
                  {profile.activeTheme === 'google_cats' && (
                    <>
                      {/* Left ear */}
                      <div className="absolute -top-3 left-1.5 w-6 h-6 bg-[#4285F4] border border-slate-950 rounded-tr-emerald-500 rounded-tl-2xl rounded-br-2xl rotate-12 z-30 flex items-center justify-center shadow-lg">
                        <div className="w-3 h-3 bg-pink-400 rounded-tr-emerald-400 rounded-tl-xl rounded-br-xl" />
                      </div>
                      {/* Right ear */}
                      <div className="absolute -top-3 right-1.5 w-6 h-6 bg-[#34A853] border border-slate-950 rounded-tl-emerald-500 rounded-tr-2xl rounded-bl-2xl -rotate-12 z-30 flex items-center justify-center shadow-lg">
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

            <div className="p-6 pt-11 space-y-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-slate-100 tracking-tight">
                      {displayName}
                    </h3>
                    {profile.verified && (
                      <span className="text-[10px] bg-emerald-955 text-emerald-400 px-2 py-0.5 rounded-full font-bold border border-emerald-950/50 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        PRO VERIFIED
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">@{profile.username}</p>
                  
                  {/* Dynamic Followers and Tailing count belt */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[11px] text-slate-400 font-medium font-mono">
                    <div className="whitespace-nowrap">
                      <strong className="text-slate-200">
                        {profile.subscriptionTier === 'SELLER_PRO' ? '241' : '38'}
                      </strong>{' '}
                      <span className="text-slate-500">followers</span>
                    </div>
                    <div className="whitespace-nowrap">
                      <strong className="text-slate-200 font-bold">
                        {profile.subscriptionTier === 'SELLER_PRO' ? '156' : '15'}
                      </strong>{' '}
                      <span className="text-slate-500">
                        {profile.subscriptionTier === 'SELLER_PRO' ? 'subscribers (tails)' : 'subscribers'}
                      </span>
                    </div>
                    <div className="whitespace-nowrap">
                      <strong className="text-slate-200">{followingCount}</strong>{' '}
                      <span className="text-slate-500">following</span>
                    </div>
                  </div>

                  {/* Slogan phrase or custom quote (Custom AI Theme extensibility) */}
                  {activeThemeData?.customAIPhrase && (
                    <div className="mt-2.5 p-2 bg-slate-950/55 rounded-xl border border-slate-850/60 flex items-center gap-2 max-w-fit shadow-inner">
                      <span className="text-[8.5px] bg-[#1a0f35] text-indigo-400 font-mono font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wide border border-indigo-900/30">
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
                    <VEButton
                      onClick={() => setIsEditing(true)}
                      id="edit-profile-btn"
                      variant="ghost"
                      className="border-slate-800 text-slate-300 hover:text-slate-100"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit Profile
                    </VEButton>
                  </div>
                ) : null}
              </div>

              {isEditing ? (
                <form onSubmit={handleProfileSave} className="space-y-3.5 bg-[#0b0f19] p-4 rounded-xl border border-slate-850" id="profile-edit-subform">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Display Name</label>
                    <input 
                      type="text" 
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full text-xs bg-[#121824] border border-slate-800 rounded-lg px-3 py-2 text-slate-200 outline-none focus:border-sky-500"
                      maxLength={30}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Bio Overview</label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="w-full text-xs bg-[#121824] border border-slate-800 rounded-lg px-3 py-2 text-slate-200 outline-none focus:border-sky-500 h-20 resize-none"
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
                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                  "{profile.bio}"
                </p>
              )}

              {/* Joined date */}
              <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-medium font-mono pb-2.5 border-b border-slate-850/60">
                <Calendar className="w-3.5 h-3.5" />
                <span>Member registered verification: June 19, 2026</span>
              </div>

              {/* Verified Metrics Strip Grid */}
              <div className="space-y-3.5 pt-1">
                <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-1">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  Verified Sports Tracker Analytics
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-850">
                    <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wide font-mono">True Win Rate</p>
                    <p className="font-mono text-base font-black text-sky-400 mt-1">{profile.winRate.toFixed(1)}%</p>
                  </div>
                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-850">
                    <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wide font-mono">Net Returns</p>
                    <p className={`font-mono text-base font-black mt-1 ${profile.unitsNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-455'}`}>
                      {profile.unitsNetProfit >= 0 ? '+' : ''}{profile.unitsNetProfit.toFixed(1)}U
                    </p>
                  </div>
                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-850">
                    <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wide font-mono">Verified Picks</p>
                    <p className="font-mono text-base font-black text-slate-100 mt-1">{profile.totalPicks}</p>
                  </div>
                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-850">
                    <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wide font-mono">Total Won</p>
                    <p className="font-mono text-base font-black text-emerald-400 mt-1">{profile.wonPicks}</p>
                  </div>
                </div>
              </div>

              {/* Sub-tier Badge Details */}
              <div className="flex items-center justify-between p-3.5 bg-[#0b0f19]/60 rounded-xl border border-slate-850/60 text-xs">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <div>
                    <span className="text-slate-400 block text-[10px] font-mono leading-tight uppercase font-black">Subscription Tier</span>
                    <span className="font-extrabold text-slate-100 text-xs tracking-wide">
                      {profile.subscriptionTier === 'SELLER_PRO' ? '💎 SELLER PRO MONETIZED' : profile.subscriptionTier === 'GOLD' ? '✨ VEDGE GOLD' : '🛡️ VEdge BASIC PARTNER'}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">Status</span>
                  <span className="text-emerald-400 text-xs font-black font-mono">ACTIVE GRADER</span>
                </div>
              </div>

            </div>
          </div>

          {/* Verification disclosure */}
          <div className="p-3.5 bg-[#121824] rounded-2xl border border-slate-850 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <div className="text-[11px] text-slate-400 leading-relaxed font-semibold">
              <span className="text-slate-350 block mb-1">PRO VERIFICATION RULES:</span>
              Your profile is certified as a PRO partner because you conform to our transparent sports logging protocol. Every parlay risk leg is archived in your browser ledger. Volatility increases risk, please track responsibly.
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
              <div className="p-12 text-center bg-[#121824] rounded-2xl border border-slate-850 space-y-3">
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
                  />
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Sidebar: "My Outcomes" Private Calendar Win Rate Card */}
        <div className="lg:col-span-4 space-y-6">

          <div className="bg-[#121824] rounded-2xl border border-slate-850 p-4.5 space-y-4 shadow-xl relative animate-slide-up" id="profile-performance-graphs-card">
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
                LIVE DATA
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
                  <div className="rounded-2xl border border-slate-850 bg-slate-950/40 p-5 text-center">
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
                  <div className="h-[190px] rounded-2xl border border-slate-850 bg-slate-950/35 p-3">
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

                  <div className="h-[190px] rounded-2xl border border-slate-850 bg-slate-950/35 p-3">
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

          <div className="bg-[#121824] rounded-2xl border border-slate-850 p-4.5 space-y-4 shadow-xl relative animate-slide-up" id="profile-my-outcomes-sidemenu-card">
            <div className="flex items-center justify-between border-b border-slate-850 pb-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block animate-pulse" />
                <h3 className="font-bold text-slate-100 text-xs tracking-wider uppercase">
                  My Outcomes
                </h3>
              </div>
              <span className="text-[9px] font-mono font-black text-emerald-450 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-900/40 uppercase">
                🔒 PRIVATE CARD
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">
              Your personal settled play winrates grouped day-by-day. These entries are hidden from general feeds. 
              <strong className="text-slate-300"> Hover over any date</strong> to view settled play items & unit yields!
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
                        ? 'bg-slate-900/60 border-slate-800 hover:border-slate-600 hover:bg-[#1a2333]/45 shadow-sm' 
                        : 'bg-[#121824]/40 border-slate-900/50 opacity-55 hover:opacity-100 transition-opacity'
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
                              <div className="bg-[#121824] p-1.5 rounded-md border border-slate-850">
                                <p className="text-slate-400 uppercase font-black tracking-wider">Winrate</p>
                                <p className="text-sky-455 font-mono font-bold text-xs mt-0.5 text-sky-400 font-black">
                                  {winRate !== null ? `${winRate.toFixed(0)}%` : '—'}
                                </p>
                              </div>
                              <div className="bg-[#121824] p-1.5 rounded-md border border-slate-850">
                                <p className="text-slate-400 uppercase font-black tracking-wider">W / L</p>
                                <p className="text-slate-200 font-mono font-bold text-xs mt-0.5">{wonCount}W - {lostCount}L</p>
                              </div>
                              <div className="bg-[#121824] p-1.5 rounded-md border border-slate-850">
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
