import React, { useState, useEffect, useRef } from 'react';
import HomeFeedLayout from './social/feed/HomeFeedLayout';
import HomeFeedPage from './social/feed/HomeFeedPage';
import ParlayLab from './components/ParlayLab';
import VouchBoard from './components/VouchBoard';
import ResultsPage from './components/ResultsPage';
import ProfilePage from './components/ProfilePage';
import SettingsPage from './components/SettingsPage';
import PremiumSubPage from './components/PremiumSubPage';
import AisLandingPage from './components/AisLandingPage';
import PlayerResearchConsole from './components/PlayerResearchConsole';
import SmartAiEngine from './components/SmartAiEngine';
import MlbIntelligenceHub from './components/MlbIntelligenceHub';
import LiveGames from './components/LiveGames';
import NotificationCenter from './components/NotificationCenter';
import LiveStreams from './components/LiveStreams';
import Leaderboard from './components/Leaderboard';
import ThemeStore from './components/ThemeStore';
import SubscriberHub from './components/SubscriberHub';
import { X } from 'lucide-react';
import { ThemeProvider } from './components/theme/ThemeProvider';

import { FeedPost, Parlay, Vouch, CreatorProofProfile, Leg, MLBPlayer } from './types';
import { INITIAL_PROFILE, INITIAL_POSTS } from './data/mockData';

export default function App() {
  const [activeSection, setActiveSection] = useState<string>('welcome');
  const activeSectionRef = useRef(activeSection);
  
  useEffect(() => {
    activeSectionRef.current = activeSection;
  }, [activeSection]);

  // Core synchronized states
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [savedSlips, setSavedSlips] = useState<Parlay[]>([]);
  const [savedVouches, setSavedVouches] = useState<Vouch[]>([]);
  const [profile, setProfile] = useState<CreatorProofProfile>(INITIAL_PROFILE);
  const [activeLegs, setActiveLegs] = useState<Leg[]>([]);
  const [liveGames, setLiveGames] = useState<any[]>([]);

  // Subscriber LiveStream Alert System State
  const [streamToast, setStreamToast] = useState<{
    id: string;
    capperName: string;
    username: string;
    title: string;
    avatarColor: string;
    avatarInitials: string;
  } | null>(null);

  // Periodically check subscription status and trigger toast notification
  useEffect(() => {
    const triggerSimulatedToast = () => {
      // Avoid showing or setting toast if the user is in the welcome page state
      if (activeSectionRef.current === 'welcome') {
        return;
      }

      // Look for user subscribed favorite cappers
      let subscribedIds: string[] = [];
      try {
        const stored = localStorage.getItem('vouchedge_subscribed_cappers');
        if (stored) {
          subscribedIds = JSON.parse(stored);
        }
      } catch (e) {}

      // Pool of verified creative sports cappers
      const capperPool = [
        {
          id: 'c-alpha-guru',
          name: 'Alpha Baseball Guru',
          username: 'alphaguru',
          avatarColor: 'bg-indigo-600',
          avatarInitials: 'AG',
          title: '🔥 High Heat Pitching Trends & Locked Giants Runlines! 🔥'
        },
        {
          id: 'c-parabolics',
          name: 'Homers & Parabolics',
          username: 'homer_parabola',
          avatarColor: 'bg-pink-600',
          avatarInitials: 'HP',
          title: '⚾ Statcast Exit Velocities & Live In-Play Total Runs Sweat!'
        },
        {
          id: 'sharp_guru_pro',
          name: 'Sharp Betting Guru',
          username: 'sharp_guru_pro',
          avatarColor: 'bg-emerald-600',
          avatarInitials: 'SG',
          title: '🔥 MLB Locked Sweep Parlay. Real-time Pitching Charts Live! 🔥'
        }
      ];

      // Match against those they actually subscribed to in the Subscriber Hub tab
      const subscribedOnly = capperPool.filter(c => 
        subscribedIds.includes(c.id) || 
        subscribedIds.includes(c.username)
      );

      // Choose a creator. If they have none selected, fallback to the pool as an onboarding showcase
      const finalCreator = subscribedOnly.length > 0 
        ? subscribedOnly[Math.floor(Math.random() * subscribedOnly.length)]
        : capperPool[Math.floor(Math.random() * capperPool.length)];

      setStreamToast({
        id: `toast-${Date.now()}`,
        capperName: finalCreator.name,
        username: finalCreator.username,
        title: finalCreator.title,
        avatarColor: finalCreator.avatarColor,
        avatarInitials: finalCreator.avatarInitials
      });
    };

    // First popup after 18 seconds (onboard fast)
    const timer = setTimeout(() => {
      triggerSimulatedToast();
    }, 18000);

    // Re-check/alert every 45 seconds thereafter
    const interval = setInterval(() => {
      triggerSimulatedToast();
    }, 45000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  // Periodically fetch live game schedule status to prevent betting/picking on finished games
  useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await fetch('/api/mlb/live');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.games) {
            setLiveGames(data.games);
            return;
          }
        }
      } catch (err) {
        console.warn("Could not prefetch live games in App", err);
      }
      
      // Fallback seed matches
      const fallbackGames = [
        {
          id: '2026101',
          homeTeam: "Los Angeles Dodgers",
          awayTeam: "San Diego Padres",
          status: "In Progress (7th Inning)",
        },
        {
          id: '2026102',
          homeTeam: "New York Yankees",
          awayTeam: "Boston Red Sox",
          status: "In Progress (4th Inning)",
        },
        {
          id: '2026103',
          homeTeam: "Houston Astros",
          awayTeam: "Atlanta Braves",
          status: "Warmup - 7:05 PM",
        },
        {
          id: '2026104',
          homeTeam: "San Francisco Giants",
          awayTeam: "Seattle Mariners",
          status: "Final",
        },
        {
          id: '2026105',
          homeTeam: "Chicago Cubs",
          awayTeam: "Milwaukee Brewers",
          status: "In Progress (3rd Inning)",
        },
        {
          id: '2026106',
          homeTeam: "Philadelphia Phillies",
          awayTeam: "New York Mets",
          status: "Scheduled - 4:05 PM",
        },
        {
          id: '2026107',
          homeTeam: "St. Louis Cardinals",
          awayTeam: "Chicago White Sox",
          status: "In Progress (8th Inning)",
        },
        {
          id: '2026108',
          homeTeam: "Toronto Blue Jays",
          awayTeam: "Tampa Bay Rays",
          status: "Scheduled - 6:30 PM",
        },
        {
          id: '2026109',
          homeTeam: "Texas Rangers",
          awayTeam: "Oakland Athletics",
          status: "Warmup",
        },
        {
          id: '2026110',
          homeTeam: "Detroit Tigers",
          awayTeam: "Cleveland Guardians",
          status: "Final",
        },
        {
          id: '2026111',
          homeTeam: "Arizona Diamondbacks",
          awayTeam: "Colorado Rockies",
          status: "In Progress (5th Inning)",
        },
        {
          id: '2026112',
          homeTeam: "Minnesota Twins",
          awayTeam: "Kansas City Royals",
          status: "Scheduled - 1:10 PM",
        }
      ];
      setLiveGames(fallbackGames);
    };

    fetchGames();
    const interval = setInterval(fetchGames, 20000); // Poll every 20s
    return () => clearInterval(interval);
  }, []);

  // Initialize from LocalStorage
  useEffect(() => {
    try {
      const storedPosts = localStorage.getItem('vouchedge_posts');
      if (storedPosts) {
        setPosts(JSON.parse(storedPosts));
      } else {
        setPosts(INITIAL_POSTS);
        localStorage.setItem('vouchedge_posts', JSON.stringify(INITIAL_POSTS));
      }

      const storedSlips = localStorage.getItem('vouchedge_slips');
      if (storedSlips) {
        setSavedSlips(JSON.parse(storedSlips));
      } else {
        setSavedSlips([]);
      }

      const storedVouches = localStorage.getItem('vouchedge_vouches');
      if (storedVouches) {
        setSavedVouches(JSON.parse(storedVouches));
      } else {
        // Pre-extract seed vouches to board for dynamic engagement
        const seeds = INITIAL_POSTS.filter(p => p.vouch).map(p => p.vouch!);
        setSavedVouches(seeds);
        localStorage.setItem('vouchedge_vouches', JSON.stringify(seeds));
      }

      const storedProfile = localStorage.getItem('vouchedge_profile');
      if (storedProfile) {
        setProfile(JSON.parse(storedProfile));
      } else {
        setProfile(INITIAL_PROFILE);
        localStorage.setItem('vouchedge_profile', JSON.stringify(INITIAL_PROFILE));
      }
    } catch (e) {
      console.error('LocalStorage load failed, using fallbacks', e);
      setPosts(INITIAL_POSTS);
      setProfile(INITIAL_PROFILE);
    }
  }, []);

  // Sync state modifications helper
  const syncPosts = (newPosts: FeedPost[]) => {
    setPosts(newPosts);
    localStorage.setItem('vouchedge_posts', JSON.stringify(newPosts));
  };

  const syncSlips = (newSlips: Parlay[]) => {
    setSavedSlips(newSlips);
    localStorage.setItem('vouchedge_slips', JSON.stringify(newSlips));
  };

  const syncVouches = (newVouches: Vouch[]) => {
    setSavedVouches(newVouches);
    localStorage.setItem('vouchedge_vouches', JSON.stringify(newVouches));
  };

  const syncProfile = (newProfile: CreatorProofProfile) => {
    setProfile(newProfile);
    localStorage.setItem('vouchedge_profile', JSON.stringify(newProfile));
  };

  // Interaction: Create post
  const handlePostCreated = (postData: Partial<FeedPost>) => {
    const newPost: FeedPost = {
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
      boardConfig: postData.boardConfig
    };

    const updatedPosts = [newPost, ...posts];
    syncPosts(updatedPosts);

    // If posting a vouch, auto-save/add to Vouch Board
    if (newPost.postType === 'VOUCH' && newPost.vouch) {
      const exists = savedVouches.some((v) => v.id === newPost.vouch?.id);
      if (!exists) {
        syncVouches([...savedVouches, { ...newPost.vouch, isSavedByUser: true }]);
      }
    }

    // If posting a result, update profile statistics dynamically for real transparency!
    if (newPost.postType === 'RESULT' && newPost.result) {
      const res = newPost.result;
      const isWin = res.status === 'WON';
      const isLoss = res.status === 'LOST';

      if (isWin || isLoss) {
        let additionalProfit = 0;
        if (isWin) {
          additionalProfit = res.profit ?? 0.0;
        } else {
          additionalProfit = -res.units;
        }

        const updatedProfile: CreatorProofProfile = {
          ...profile,
          totalPicks: profile.totalPicks + 1,
          wonPicks: profile.wonPicks + (isWin ? 1 : 0),
          unitsNetProfit: profile.unitsNetProfit + additionalProfit,
          winRate: ((profile.wonPicks + (isWin ? 1 : 0)) / (profile.totalPicks + 1)) * 100
        };
        syncProfile(updatedProfile);
      }
    }
  };

  // Interaction: Like toggle
  const handleLikePost = (postId: string) => {
    const updated = posts.map((p) => {
      if (p.id === postId) {
        const isLiked = !p.isLiked;
        return {
          ...p,
          isLiked,
          likesCount: p.likesCount + (isLiked ? 1 : -1)
        };
      }
      return p;
    });
    syncPosts(updated);
  };

  // Interaction: Tailing pick (vouching)
  const handleVouchPost = (postId: string) => {
    const updated = posts.map((p) => {
      if (p.id === postId) {
        const isVouched = !p.isVouched;
        return {
          ...p,
          isVouched,
          vouchesCount: p.vouchesCount + (isVouched ? 1 : -1)
        };
      }
      return p;
    });
    syncPosts(updated);
  };

  // Interaction: Repost toggle
  const handleRepostPost = (postId: string) => {
    const updated = posts.map((p) => {
      if (p.id === postId) {
        const isReposted = !p.isReposted;
        return {
          ...p,
          isReposted,
          repostsCount: p.repostsCount + (isReposted ? 1 : -1)
        };
      }
      return p;
    });
    syncPosts(updated);
  };

  // Interaction: Save Vouch to Board (either from feed or right-hand matchups)
  const handleSaveVouch = (vouch: Vouch) => {
    const exists = savedVouches.some((v) => v.id === vouch.id);
    let updatedVouches: Vouch[];

    if (exists) {
      updatedVouches = savedVouches.filter((v) => v.id !== vouch.id);
    } else {
      updatedVouches = [...savedVouches, { ...vouch, isSavedByUser: true }];
    }
    syncVouches(updatedVouches);
  };

  const handleRemoveVouchFromBoard = (vouchId: string) => {
    const updated = savedVouches.filter((v) => v.id !== vouchId);
    syncVouches(updated);
  };

  // Interaction: Write comment
  const handleAddComment = (postId: string, commentContent: string) => {
    const updated = posts.map((p) => {
      if (p.id === postId) {
        const newComm = {
          id: `c-user-${Date.now()}`,
          postId,
          userId: 'u-user-current',
          displayName: profile.displayName,
          username: profile.username,
          timestamp: new Date().toISOString(),
          content: commentContent,
          likesCount: 0
        };
        return {
          ...p,
          commentsCount: p.commentsCount + 1,
          comments: [...(p.comments || []), newComm]
        };
      }
      return p;
    });
    syncPosts(updated);
  };

  // Save new parlay created in ParlayLab
  const handleSaveParlaySlip = (newParlay: Parlay) => {
    const updated = [...savedSlips, newParlay];
    syncSlips(updated);
  };

  // Update Profile Hub details
  const handleUpdateProfile = (updatedProfile: Partial<CreatorProofProfile>) => {
    const nextProfile = { ...profile, ...updatedProfile };
    syncProfile(nextProfile);
  };

  // Restore seeded presets
  const handleResetDatabase = () => {
    localStorage.removeItem('vouchedge_posts');
    localStorage.removeItem('vouchedge_slips');
    localStorage.removeItem('vouchedge_vouches');
    localStorage.removeItem('vouchedge_profile');

    const seeds = INITIAL_POSTS.filter(p => p.vouch).map(p => p.vouch!);
    setPosts(INITIAL_POSTS);
    setSavedSlips([]);
    setSavedVouches(seeds);
    setProfile(INITIAL_PROFILE);

    localStorage.setItem('vouchedge_posts', JSON.stringify(INITIAL_POSTS));
    localStorage.setItem('vouchedge_slips', JSON.stringify([]));
    localStorage.setItem('vouchedge_vouches', JSON.stringify(seeds));
    localStorage.setItem('vouchedge_profile', JSON.stringify(INITIAL_PROFILE));
  };

  const savedVouchIds = savedVouches.map((v) => v.id);

  const handleAddLegFromResearch = (player: MLBPlayer, prop: { id: string; market: string; odds: number; spec: string }) => {
    // Check if player's game has played already and status is Final
    const playerTeam = player.team ? player.team.toLowerCase() : '';
    const matchedGame = liveGames.find((g: any) => 
      g.homeTeam.toLowerCase() === playerTeam || 
      g.awayTeam.toLowerCase() === playerTeam
    );

    if (matchedGame && matchedGame.status.toLowerCase() === 'final') {
      alert(`⚠️ Cannot bet on player: The game for ${player.name} (${matchedGame.awayTeam} @ ${matchedGame.homeTeam}) has already played and is concluded (status: Final). You cannot place picks on completed games.`);
      return;
    }

    if (activeLegs.some(l => l.selection === prop.spec)) {
      alert("This player prop selection is already added to your current parlay slip!");
      return;
    }
    const newLeg: Leg = {
      id: `leg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      sport: "MLB",
      game: matchedGame ? `${matchedGame.awayTeam} @ ${matchedGame.homeTeam}` : `${player.team} Live Target`,
      market: prop.market,
      selection: prop.spec,
      odds: prop.odds,
      status: 'PENDING'
    };
    setActiveLegs([...activeLegs, newLeg]);
    alert(`🎯 Added "${prop.spec}" to your active parlay slip context!`);
  };

  // Render content depending on left sidebar active item
  const renderMainView = () => {
    switch (activeSection) {
      case 'welcome':
        return (
          <AisLandingPage
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
            onSectionChange={setActiveSection}
          />
        );
      case 'feed':
        return (
          <HomeFeedPage
            posts={posts}
            savedSlips={savedSlips}
            profileName={profile.displayName}
            onPostCreated={handlePostCreated}
            onLikePost={handleLikePost}
            onVouchPost={handleVouchPost}
            onRepostPost={handleRepostPost}
            onSaveVouch={handleSaveVouch}
            savedVouchIds={savedVouchIds}
            onAddComment={handleAddComment}
            profile={profile}
            onSectionChange={setActiveSection}
          />
        );
      case 'build':
        return (
          <ParlayLab 
            onSaveParlay={handleSaveParlaySlip} 
            savedParlays={savedSlips}
            legs={activeLegs}
            setLegs={setActiveLegs}
            onSectionChange={setActiveSection}
            liveGames={liveGames}
            onSaveVouch={handleSaveVouch}
            posts={posts}
            profile={profile}
            initialTab="builder"
          />
        );
      case 'ai_engine':
        return (
          <SmartAiEngine
            onSectionChange={setActiveSection}
            onAddLegToParlay={handleAddLegFromResearch}
            onSaveVouch={handleSaveVouch}
            onPostCreated={handlePostCreated}
            liveGames={liveGames}
          />
        );
      case 'intel':
        return <MlbIntelligenceHub />;
      case 'live_games':
        return (
          <LiveGames 
            onSectionChange={setActiveSection}
            onAddLegToParlay={handleAddLegFromResearch}
          />
        );
      case 'research':
        return (
          <PlayerResearchConsole
            onAddLegToParlay={handleAddLegFromResearch}
            onSaveVouch={handleSaveVouch}
            savedVouchIds={savedVouchIds}
            activeLegs={activeLegs}
            liveGames={liveGames}
          />
        );
      case 'board':
        return (
          <VouchBoard 
            savedVouches={savedVouches} 
            onRemoveVouch={handleRemoveVouchFromBoard} 
            onPostCreated={handlePostCreated}
            profile={profile}
          />
        );
      case 'leaderboard':
        return (
          <Leaderboard 
            profile={profile}
            onSectionChange={setActiveSection}
          />
        );
      case 'streams':
        return (
          <LiveStreams 
            onSaveVouch={handleSaveVouch}
            savedVouchIds={savedVouchIds}
            profile={profile}
            onPostCreated={handlePostCreated}
            onSectionChange={setActiveSection}
          />
        );
      case 'results':
        return (
          <ParlayLab 
            onSaveParlay={handleSaveParlaySlip} 
            savedParlays={savedSlips}
            legs={activeLegs}
            setLegs={setActiveLegs}
            onSectionChange={setActiveSection}
            liveGames={liveGames}
            onSaveVouch={handleSaveVouch}
            posts={posts}
            profile={profile}
            initialTab="results"
          />
        );
      case 'profile':
        return (
          <ProfilePage 
            profile={profile} 
            onUpdateProfile={handleUpdateProfile} 
            posts={posts}
            onLikePost={handleLikePost}
            onVouchPost={handleVouchPost}
            onRepostPost={handleRepostPost}
            onSaveVouch={handleSaveVouch}
            savedVouchIds={savedVouchIds}
            onAddComment={handleAddComment}
          />
        );
      case 'premium':
        return (
          <PremiumSubPage 
            profile={profile} 
            onUpdateProfile={handleUpdateProfile} 
          />
        );
      case 'themestore':
        return (
          <ThemeStore 
            profile={profile} 
            onUpdateProfile={handleUpdateProfile} 
          />
        );
      case 'subscriber_hub':
        return (
          <SubscriberHub
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
            onSectionChange={setActiveSection}
          />
        );
      case 'settings':
        return (
          <SettingsPage 
            onResetDatabase={handleResetDatabase} 
            profileName={profile.displayName} 
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
          />
        );
      default:
        return (
          <div className="p-8 text-center" id="unknown-view">
            <h2 className="text-xl font-bold text-slate-100">View not found</h2>
          </div>
        );
    }
  };

  return (
    <ThemeProvider profile={profile} onUpdateProfile={handleUpdateProfile}>
      <HomeFeedLayout
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        posts={posts}
        profile={profile}
        savedVouchIds={savedVouchIds}
        onSaveVouch={handleSaveVouch}
        activeLegs={activeLegs}
        savedSlips={savedSlips}
      >
        {renderMainView()}
        {activeSection !== 'welcome' && <NotificationCenter savedSlips={savedSlips} />}

        {/* Dynamic Subscriber Livestream Go-Live Toast notification */}
        {streamToast && activeSection !== 'welcome' && (
          <div 
            onClick={() => {
              setActiveSection('streams');
              setStreamToast(null);
            }}
            className="fixed bottom-6 right-6 md:right-8 max-w-sm bg-gradient-to-r from-red-950/95 via-slate-900/98 to-slate-950 border border-red-500/80 shadow-[0_0_25px_rgba(239,68,68,0.25)] p-4 rounded-xl cursor-pointer z-[100] group animate-slide-in hover:scale-105 transition-all text-left flex items-start gap-3.5"
            id="livestream-subscriber-toast"
          >
            <div className="relative shrink-0 mt-0.5">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black text-rose-100 ${streamToast.avatarColor} ring-2 ring-red-500`}>
                {streamToast.avatarInitials}
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500 border border-slate-950 flex items-center justify-center text-[7px] font-black text-white">🔴</span>
              </span>
            </div>

            <div className="space-y-1 select-none flex-1">
              <div className="flex items-center gap-1.5 text-[10px]">
                <span className="text-red-400 font-extrabold font-mono tracking-wide uppercase">🔴 Capper Live!</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400 font-bold font-mono">@{streamToast.username}</span>
              </div>
              <h4 className="text-[13px] font-extrabold text-slate-100 leading-tight group-hover:text-red-400 transition-colors uppercase">
                {streamToast.capperName} Started Streaming!
              </h4>
              <div className="text-[11px] text-slate-400 font-semibold line-clamp-2 leading-tight">
                "{streamToast.title}"
              </div>
              <div className="pt-1.5 flex items-center gap-1 text-[10px] text-red-400 font-bold uppercase tracking-wider">
                <span>Click to watch theater Arena</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>

            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setStreamToast(null);
              }} 
              className="p-1 text-slate-500 hover:text-slate-350 rounded hover:bg-slate-800 transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </HomeFeedLayout>
    </ThemeProvider>
  );
}
