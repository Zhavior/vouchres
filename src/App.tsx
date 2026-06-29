import React, { useState, useEffect, useRef, useTransition } from 'react';
import HomeFeedLayout from './social/feed/HomeFeedLayout';
import HomeFeedPage from './social/feed/HomeFeedPage';
import ParlayLab from './components/ParlayLab';
import ParlayStudio from './components/ParlayStudio';
import VouchBoard from './components/VouchBoard';
import ResultsPage from './components/ResultsPage';
import ProfilePage from './components/ProfilePage';
import SettingsPage from './components/SettingsPage';
import PremiumSubPage from './components/PremiumSubPage';
import AisLandingPage from './components/AisLandingPage';
import PlayerResearchConsole from './components/PlayerResearchConsole';
import PlayerResearchHub from './components/PlayerResearchHub';
import CustomizePage from './components/CustomizePage';
import ResultsStudio from './components/results/ResultsStudio';
import SmartAiEngine from './components/SmartAiEngine';
import MlbIntelligenceHub from './components/MlbIntelligenceHub';
import DailyHrBoardPage from './pages/DailyHrBoardPage';
import LiveGameLabPage from './pages/LiveGameLabPage';
import LiveGames from './components/LiveGames';
import HrNotifications from './components/notifications/HrNotifications';
import AppNotificationsHost from './components/notifications/AppNotificationsHost';
import LiveGamesPro from './components/LiveGamesPro';
import WelcomePortal from './components/WelcomePortal';
import TodayDashboard from './components/TodayDashboard';
import { apiUrl } from './lib/apiBase';
import Leaderboard from './components/Leaderboard';
import ThemeStore from './components/ThemeStore';
import { EpicThemeShowcase } from './components/vouchedge/EpicThemeShowcase';
import SubscriberHub from './components/SubscriberHub';
import { X } from 'lucide-react';
import { ThemeProvider } from './components/theme/ThemeProvider';
import { canAccessThemeStore } from './lib/adminDevAccess';
import AppErrorBoundary from './components/AppErrorBoundary';

import { FeedPost, Parlay, Vouch, CreatorProofProfile, Leg, MLBPlayer } from './types';
import { INITIAL_PROFILE, INITIAL_POSTS } from './data/mockData';
import PlayerEdgeLabPage from './pages/pro/PlayerEdgeLabPage';
import TeamMatchupLabPage from './pages/pro/TeamMatchupLabPage';
import ProGraphsLabPage from './pages/pro/ProGraphsLabPage';
import DailyPlayersPage from './pages/DailyPlayersPage';
import LiveParlaysPage from './pages/LiveParlaysPage';
import { ProAccessGate } from './components/pro/ProAccessGate';
import { resolveMarket } from './sports/markets';
import { gradePendingParlays } from './lib/parlayGrading';
import { generateAiParlays } from './lib/aiParlayGenerator';
import { isLive } from './lib/parlayLifecycle';
import { notify } from './lib/appNotifications';
import { apiClient } from './lib/apiClient';
import { getAuthToken, isSupabaseConfigured } from './lib/supabaseClient';

/** Default daily time the AI builds the slate (local time, "HH:MM"). */
const AI_GEN_DEFAULT_TIME = '10:00';

interface BackendProfile {
  id: string;
  age_confirmed_at?: string | null;
  jurisdiction_confirmed_at?: string | null;
  jurisdiction?: string | null;
}

function isAiBackendCandidate(parlay: Parlay): boolean {
  return Boolean(parlay.aiGenerated);
}

function mapParlayToBackendPayload(parlay: Parlay) {
  const legs = (parlay.legs || []).map((leg) => {
    const resolved = leg.marketCode ? { marketCode: leg.marketCode } : resolveMarket('mlb', leg.market, leg.selection);
    const oddsDecimal = typeof leg.odds === 'number' && Number.isFinite(leg.odds) ? leg.odds : null;
    if (!leg.gamePk || !resolved.marketCode || !leg.selection || !oddsDecimal) {
      return null;
    }
    return {
      event_id: String(leg.gamePk),
      market: resolved.marketCode,
      selection: leg.selection,
      odds_decimal: oddsDecimal,
    };
  }).filter(Boolean) as Array<{
    event_id: string;
    market: string;
    selection: string;
    odds_decimal: number;
  }>;

  if (legs.length < 2) return null;

  return {
    legs,
    stake_units: parlay.wagerAmount ?? 1,
    confidence: parlay.edgeScore ?? undefined,
    explanation: parlay.edgeReport ?? undefined,
  };
}

const DEV_BYPASS_AUTH = import.meta.env.DEV && import.meta.env.VITE_DEV_BYPASS_AUTH === 'true';

function resolveDevSectionFromLocation() {
  if (!import.meta.env.DEV || typeof window === 'undefined') return null;

  const pathname = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase().replace(/^#/, '');
  const target = hash || pathname;

  if (target === 'hr-board' || target === '/hr-board' || target === 'daily-hr-board' || target === '/daily-hr-board') {
    return 'hr_board';
  }

  if (target === 'daily-players' || target === '/daily-players') {
    return 'daily_players';
  }

  if (target === 'live-parlays' || target === '/live-parlays') {
    return 'live_parlays';
  }

  if (target === 'live-game-lab' || target === '/live-game-lab') {
    return 'live_game_lab';
  }

  if (target === 'player-edge-lab' || target === '/player-edge-lab') {
    return 'player_edge_lab';
  }

  if (target === 'team-matchup-lab' || target === '/team-matchup-lab') {
    return 'team_matchup_lab';
  }

  if (target === 'pro-graphs-lab' || target === '/pro-graphs-lab') {
    return 'pro_graphs_lab';
  }

  if (target === 'live_games' || target === '/live_games' || target === 'live-projections' || target === '/live-projections') {
    return 'live_games';
  }

  return null;
}

export default function App() {
  const [activeSection, setActiveSection] = useState<string>(() => {
    const locationSection = resolveDevSectionFromLocation();
    if (locationSection) return locationSection;
    if (DEV_BYPASS_AUTH) return 'hr_board';
    return 'welcome';
  });
  const activeSectionRef = useRef(activeSection);
  const routeSwitchTimerRef = useRef<number | null>(null);
  const gradingRef = useRef(false);
  const backendParlaySyncRef = useRef(false);
  const backendProfileRef = useRef<BackendProfile | null | undefined>(undefined);
  const savedSlipsRef = useRef<Parlay[]>([]);
  const profileRef = useRef<CreatorProofProfile | null>(null);
  const [isPendingRoute, startRouteTransition] = useTransition();
  const [isRouteSwitching, setIsRouteSwitching] = useState(false);

  const navigateSection = (section: string) => {
    if (!section || section === activeSectionRef.current) return;

    setIsRouteSwitching(true);
    if (routeSwitchTimerRef.current) {
      window.clearTimeout(routeSwitchTimerRef.current);
    }

    window.requestAnimationFrame(() => {
      startRouteTransition(() => {
        setActiveSection(section);
      });
    });

    routeSwitchTimerRef.current = window.setTimeout(() => {
      setIsRouteSwitching(false);
      routeSwitchTimerRef.current = null;
    }, 450);
  };
  
  useEffect(() => {
    activeSectionRef.current = activeSection;
  }, [activeSection]);

  useEffect(() => {
    return () => {
      if (routeSwitchTimerRef.current) {
        window.clearTimeout(routeSwitchTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!import.meta.env.DEV) return;

    const syncSectionFromLocation = () => {
      const locationSection = resolveDevSectionFromLocation();
      if (locationSection) {
        navigateSection(locationSection);
      }
    };

    window.addEventListener('hashchange', syncSectionFromLocation);
    window.addEventListener('popstate', syncSectionFromLocation);

    return () => {
      window.removeEventListener('hashchange', syncSectionFromLocation);
      window.removeEventListener('popstate', syncSectionFromLocation);
    };
  }, []);

  // Core synchronized states
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [savedSlips, setSavedSlips] = useState<Parlay[]>([]);
  const [savedVouches, setSavedVouches] = useState<Vouch[]>([]);
  const [profile, setProfile] = useState<CreatorProofProfile>(INITIAL_PROFILE);
  const [activeLegs, setActiveLegs] = useState<Leg[]>([]);
  const [liveGames, setLiveGames] = useState<any[]>([]);
  const canSeeThemeStore = canAccessThemeStore(profile);

  useEffect(() => {
    if (activeSection === 'themestore' && !canSeeThemeStore) {
      setActiveSection('profile');
    }
  }, [activeSection, canSeeThemeStore]);

  // Periodically fetch live game schedule status to prevent betting/picking on finished games
  useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await fetch(apiUrl('/api/mlb/live'));
        const contentType = response.headers.get('content-type') ?? '';

        if (response.ok && contentType.includes('application/json')) {
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
    savedSlipsRef.current = newSlips;
    setSavedSlips(newSlips);
    localStorage.setItem('vouchedge_slips', JSON.stringify(newSlips));
  };

  const syncVouches = (newVouches: Vouch[]) => {
    setSavedVouches(newVouches);
    localStorage.setItem('vouchedge_vouches', JSON.stringify(newVouches));
  };

  const syncProfile = (newProfile: CreatorProofProfile) => {
    profileRef.current = newProfile;
    setProfile(newProfile);
    localStorage.setItem('vouchedge_profile', JSON.stringify(newProfile));
  };

  const fetchBackendProfile = async (): Promise<BackendProfile | null> => {
    if (!isSupabaseConfigured) return null;
    if (backendProfileRef.current !== undefined) return backendProfileRef.current;

    const token = await getAuthToken();
    if (!token) {
      backendProfileRef.current = null;
      return null;
    }

    try {
      const me = await apiClient.get<BackendProfile>('/api/auth/me');
      backendProfileRef.current = me;
      return me;
    } catch (error) {
      console.warn('[parlays] backend profile lookup failed', error);
      backendProfileRef.current = null;
      return null;
    }
  };

  const syncParlayToBackend = async (parlay: Parlay): Promise<Parlay> => {
    if (!isAiBackendCandidate(parlay) || parlay.backendPickId) {
      return parlay;
    }

    const payload = mapParlayToBackendPayload(parlay);
    if (!payload) {
      return {
        ...parlay,
        backendSyncState: 'not_syncable',
        backendSyncError: 'Missing verified gamePk, market code, or multi-leg structure.',
      };
    }

    const me = await fetchBackendProfile();
    if (!me?.id) {
      return {
        ...parlay,
        backendSyncState: 'auth_required',
        backendSyncError: 'Sign in required before the backend can track this AI parlay.',
      };
    }

    if (!me.age_confirmed_at || !me.jurisdiction_confirmed_at || !me.jurisdiction) {
      return {
        ...parlay,
        backendSyncState: 'legal_required',
        backendSyncError: 'Legal confirmation is required before the backend can track this AI parlay.',
      };
    }

    try {
      const created = await apiClient.post<{ id: string }>('/api/parlays', payload);
      return {
        ...parlay,
        backendPickId: created?.id || parlay.backendPickId,
        backendSyncState: 'synced',
        backendSyncedAt: new Date().toISOString(),
        backendSyncError: undefined,
      };
    } catch (error: any) {
      const status = Number(error?.status ?? 0);
      if (status === 401) {
        backendProfileRef.current = null;
        return {
          ...parlay,
          backendSyncState: 'auth_required',
          backendSyncError: 'Sign in required before the backend can track this AI parlay.',
        };
      }
      if (status === 403) {
        return {
          ...parlay,
          backendSyncState: 'legal_required',
          backendSyncError: error?.error || error?.message || 'Legal confirmation blocked backend parlay save.',
        };
      }
      return {
        ...parlay,
        backendSyncState: 'failed',
        backendSyncError: error?.error || error?.message || 'Backend parlay save failed.',
      };
    }
  };

  // Keep refs fresh for the mount-once lifecycle heartbeat (avoids stale closures
  // and prevents the interval from re-subscribing on every state change).
  savedSlipsRef.current = savedSlips;
  profileRef.current = profile;

  useEffect(() => {
    let cancelled = false;

    const runBackendParlaySync = async () => {
      if (backendParlaySyncRef.current) return;

      const candidates = savedSlipsRef.current.filter((parlay) =>
        isAiBackendCandidate(parlay) &&
        !parlay.backendPickId &&
        parlay.backendSyncState !== 'not_syncable'
      );

      if (!candidates.length) return;

      backendParlaySyncRef.current = true;
      try {
        let next = savedSlipsRef.current;
        let changed = false;

        for (const parlay of candidates) {
          const updated = await syncParlayToBackend(parlay);
          if (JSON.stringify(updated) !== JSON.stringify(parlay)) {
            next = next.map((row) => (row.id === parlay.id ? updated : row));
            changed = true;
          }
        }

        if (!cancelled && changed) {
          syncSlips(next);
        }
      } finally {
        backendParlaySyncRef.current = false;
      }
    };

    void runBackendParlaySync();

    return () => {
      cancelled = true;
    };
  }, [savedSlips]);

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

  // Update saved parlay from Parlay Hub
  const handleUpdateParlaySlip = (updatedParlay: Parlay) => {
    const updated = savedSlips.map((slip) =>
      slip.id === updatedParlay.id ? { ...slip, ...updatedParlay } : slip
    );

    syncSlips(updated);

    notify({
      kind: 'success',
      title: '✅ Parlay Updated',
      body: `${updatedParlay.title || 'Your parlay'} was updated.`,
      section: 'live_parlays',
    });
  };

  // Save new parlay created in ParlayLab
  const handleSaveParlaySlip = (newParlay: Parlay) => {
    const savedParlay = {
      ...newParlay,
      id: newParlay.id || `parlay-${Date.now()}`,
      status: newParlay.status || 'PENDING',
      mode: newParlay.mode || 'PRACTICE',
      createdAt: newParlay.createdAt || new Date().toISOString(),
      lockNotified: false,
    };

    const updated = [savedParlay, ...savedSlips];
    syncSlips(updated);

    notify({
      kind: 'success',
      title: '✅ Parlay Saved',
      body: `${savedParlay.title || 'Your parlay'} was saved to Parlay Hub.`,
      section: 'live_parlays',
    });

    navigateSection('live_parlays');
  };

  // Grade pending parlays against the live MLB feed and reflect outcomes in
  // Results + profile stats. Idempotent: only PENDING+gradable parlays are sent,
  // and only PENDING→settled transitions update win/loss/units.
  const handleGradeResults = async () => {
    if (gradingRef.current) return;
    gradingRef.current = true;
    try {
      const { parlays, newlySettled, changed } = await gradePendingParlays(savedSlipsRef.current);
      if (!changed) return;
      syncSlips(parlays);
      if (newlySettled.length) {
        let wins = 0, losses = 0, units = 0;
        for (const s of newlySettled) {
          if (s.after.status === 'WON') wins++;
          else if (s.after.status === 'LOST') losses++;
          units += s.settledUnits;
          notify({
            kind: 'result',
            title: `${s.after.status === 'WON' ? '🏆 Parlay won' : 'Parlay graded'}: ${s.after.title}`,
            body: `${s.after.status} · ${s.settledUnits >= 0 ? '+' : ''}${s.settledUnits.toFixed(2)} units. View in Results.`,
            section: 'results',
          });
        }
        const cur = profileRef.current!;
        const newTotal = cur.totalPicks + wins + losses;
        const newWon = cur.wonPicks + wins;
        syncProfile({
          ...cur,
          totalPicks: newTotal,
          wonPicks: newWon,
          unitsNetProfit: cur.unitsNetProfit + units,
          winRate: newTotal ? (newWon / newTotal) * 100 : cur.winRate,
        });
      }
    } finally {
      gradingRef.current = false;
    }
  };

  // Auto-grade when the user opens Results.
  useEffect(() => {
    if (activeSection === 'results') handleGradeResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection]);

  // Run the scheduled AI parlay generation if it's past today's set time and we
  // haven't generated for today yet. Confirmed-starter parlays only.
  const runScheduledAiGeneration = async () => {
    const today = new Date().toISOString().slice(0, 10);
    const lastGen = localStorage.getItem('vouchedge_ai_gen_date');
    if (lastGen === today) return;
    const genTime = localStorage.getItem('vouchedge_ai_gen_time') || AI_GEN_DEFAULT_TIME; // "HH:MM"
    const [gh, gm] = genTime.split(':').map(Number);
    const now = new Date();
    if (now.getHours() < gh || (now.getHours() === gh && now.getMinutes() < gm)) return;

    const created = await generateAiParlays({ sport: 'mlb' });
    // Mark today done even if 0 (no confirmed lineups yet) — we retry tomorrow,
    // but allow a manual refresh via the Live Parlays page if lineups post later.
    localStorage.setItem('vouchedge_ai_gen_date', today);
    if (created.length === 0) return;
    // Dedupe: drop any prior still-pending AI parlays before adding the new slate.
    const kept = savedSlipsRef.current.filter((p) => !p.aiGenerated || p.status !== 'PENDING');
    syncSlips([...created, ...kept]);
    notify({
      kind: 'ai',
      title: `🤖 V.A.I built ${created.length} parlays for today`,
      body: 'Confirmed starters only. They lock 30 min before first pitch, then move to Parlay Hub.',
      section: 'live_parlays',
    });
  };

  // Manual generation (Live Parlays "Generate" button). Replaces today's slate.
  const handleGenerateAiParlaysNow = async () => {
    if (gradingRef.current) return;
    const created = await generateAiParlays({ sport: 'mlb' });
    localStorage.setItem('vouchedge_ai_gen_date', new Date().toISOString().slice(0, 10));
    if (created.length === 0) {
      alert('No confirmed lineups are posted yet — check back closer to game time.');
      return;
    }
    const kept = savedSlipsRef.current.filter((p) => !p.aiGenerated || p.status !== 'PENDING');
    syncSlips([...created, ...kept]);
    notify({
      kind: 'ai',
      title: `🤖 V.A.I built ${created.length} parlays`,
      body: 'Confirmed starters only. They lock 30 min before first pitch, then move to Parlay Hub.',
      section: 'live_parlays',
    });
  };

  // Fire a one-time "locked → moved to Live" notification as parlays cross their
  // lock time, and persist the flag so it doesn't repeat.
  const checkParlayLocks = () => {
    let changed = false;
    const updated = savedSlipsRef.current.map((p) => {
      if (p.status !== 'PENDING' || p.lockNotified) return p;
      if (isLive(p)) {
        changed = true;
        notify({
          kind: 'lock',
          title: `🔒 Locked: ${p.title}`,
          body: 'Moved to Parlay Hub. It will auto-grade when the games are final.',
          section: 'live_parlays',
        });
        return { ...p, lockNotified: true };
      }
      return p;
    });
    if (changed) syncSlips(updated);
  };

  // Lifecycle heartbeat: scheduled generation, lock notifications, auto-grading.
  // Mount-once; reads live state via refs to avoid re-subscribing on every save.
  useEffect(() => {
    const tick = () => {
      runScheduledAiGeneration();
      checkParlayLocks();
      handleGradeResults();
    };
    const warmup = window.setTimeout(tick, 1500); // let initial state hydrate
    const id = window.setInterval(tick, 60_000);
    return () => { window.clearTimeout(warmup); window.clearInterval(id); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update Profile Hub details
  const handleUpdateProfile = (updatedProfile: Partial<CreatorProofProfile>) => {
    const nextProfile = { ...profile, ...updatedProfile };
    syncProfile(nextProfile);
  };

  // Reset all local state to initial empty values
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

  const handleAddLegFromResearch = (player: MLBPlayer, prop: { id: string; market: string; odds: number; spec: string; gamePk?: string | number }) => {
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
    const { marketCode, threshold } = resolveMarket('mlb', prop.market, prop.spec);
    const gamePk = prop.gamePk != null ? String(prop.gamePk) : (matchedGame?.gamePk != null ? String(matchedGame.gamePk) : undefined);
    const newLeg: Leg = {
      id: `leg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      sport: "MLB",
      game: matchedGame ? `${matchedGame.awayTeam} @ ${matchedGame.homeTeam}` : `${player.team} Live Target`,
      market: prop.market,
      selection: prop.spec,
      odds: prop.odds,
      status: 'PENDING',
      gamePk,
      marketCode,
      threshold,
    };
    setActiveLegs([...activeLegs, newLeg]);
    alert(`🎯 Added "${prop.spec}" to your active parlay slip context!`);
  };

  // Render content depending on left sidebar active item
  const renderMainView = () => {
    switch (activeSection) {
      case 'welcome':
        return <WelcomePortal onSectionChange={navigateSection} />;
      case 'today':
        return <TodayDashboard onSectionChange={navigateSection} savedSlips={savedSlips} />;
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
            onSectionChange={navigateSection}
          />
        );
      case 'build':
        return (
          <ParlayStudio
            onSaveParlay={handleSaveParlaySlip}
            savedParlays={savedSlips}
            legs={activeLegs}
            setLegs={setActiveLegs}
            onSectionChange={navigateSection}
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
            onSectionChange={navigateSection}
            onAddLegToParlay={handleAddLegFromResearch}
            onSaveVouch={handleSaveVouch}
            onPostCreated={handlePostCreated}
            onSaveParlay={handleSaveParlaySlip}
            liveGames={liveGames}
          />
        );
      case 'intel':
        return <MlbIntelligenceHub profile={profile} onSectionChange={navigateSection} />;

      case 'hr_board':
        return <DailyHrBoardPage onAddLegToParlay={handleAddLegFromResearch} />;
      case 'daily_players':
        return <DailyPlayersPage />;
      case 'live_parlays':
        return <LiveParlaysPage parlays={savedSlips} onGenerate={handleGenerateAiParlaysNow} onUpdateParlay={handleUpdateParlaySlip} />;
      case 'live_game_lab':
        return (
          <ProAccessGate profile={profile} featureName="Live Game Lab" onNavigatePremium={() => navigateSection('premium')}>
            <LiveGameLabPage />
          </ProAccessGate>
        );
      case 'player_edge_lab':
        return (
          <ProAccessGate profile={profile} featureName="Player Edge Lab" onNavigatePremium={() => navigateSection('premium')}>
            <PlayerEdgeLabPage />
          </ProAccessGate>
        );
      case 'team_matchup_lab':
        return (
          <ProAccessGate profile={profile} featureName="Team Matchup Lab" onNavigatePremium={() => navigateSection('premium')}>
            <TeamMatchupLabPage />
          </ProAccessGate>
        );
      case 'pro_graphs_lab':
        return (
          <ProAccessGate profile={profile} featureName="Pro Graphs Lab" onNavigatePremium={() => navigateSection('premium')}>
            <ProGraphsLabPage />
          </ProAccessGate>
        );
      case 'live_games':
        return (
          <LiveGamesPro
            onSectionChange={navigateSection}
            onAddLegToParlay={handleAddLegFromResearch}
          />
        );
      case 'research':
        return (
          <PlayerResearchHub
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
            onSectionChange={navigateSection}
          />
        );
      case 'results':
        return (
          <ResultsStudio
            posts={posts}
            profile={profile}
            savedParlays={savedSlips}
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
            savedParlays={savedSlips}
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
        if (!canSeeThemeStore) {
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
              savedParlays={savedSlips}
            />
          );
        }
        return (
          <ThemeStore
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
          />
        );
      case 'epic_themes':
        return <EpicThemeShowcase />;
      case 'subscriber_hub':
        return (
          <ProAccessGate
            profile={profile}
            requiredTier="SELLER_PRO"
            featureName="Subscriber Clubs & Chat"
            onNavigatePremium={() => navigateSection('premium')}
          >
            <SubscriberHub
              profile={profile}
              onUpdateProfile={handleUpdateProfile}
              onSectionChange={navigateSection}
            />
          </ProAccessGate>
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
      case 'customize':
        return (
          <CustomizePage
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
            onSectionChange={navigateSection}
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
      <AppErrorBoundary resetKey={activeSection} onBackHome={() => navigateSection('today')}>
        <HomeFeedLayout
          activeSection={activeSection}
          onSectionChange={navigateSection}
          posts={posts}
          profile={profile}
          savedVouchIds={savedVouchIds}
          onSaveVouch={handleSaveVouch}
          activeLegs={activeLegs}
          savedSlips={savedSlips}
          isRouteSwitching={isRouteSwitching || isPendingRoute}
        >
          {renderMainView()}
          {activeSection !== 'welcome' && <HrNotifications savedSlips={savedSlips} />}
          {activeSection !== 'welcome' && <AppNotificationsHost onNavigate={navigateSection} />}
        </HomeFeedLayout>
      </AppErrorBoundary>
    </ThemeProvider>
  );
}
