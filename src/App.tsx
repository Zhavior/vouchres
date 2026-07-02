import React, { Suspense, lazy, useState, useEffect, useMemo, useRef, useTransition } from 'react';
import HomeFeedLayout from './social/feed/HomeFeedLayout';
import ParlayStudio from './components/ParlayStudio';
import HrNotifications from './components/notifications/HrNotifications';
import AppNotificationsHost from './components/notifications/AppNotificationsHost';
import EdgeIslandCommandCenter from './components/theEdge/EdgeIslandCommandCenter';
import { Sparkles as EdgeIslandIcon } from 'lucide-react';
import { apiUrl } from './lib/apiBase';
import { ThemeProvider } from './components/theme/ThemeProvider';
import { canAccessThemeStore } from './lib/adminDevAccess';
import AppErrorBoundary from './components/AppErrorBoundary';

import { FeedPost, Parlay, Vouch, CreatorProofProfile, Leg, MLBPlayer } from './types';
import { INITIAL_PROFILE, INITIAL_POSTS } from './data/mockData';
import ParlayCommandCenter from './components/parlay/ParlayCommandCenter';
import { ProAccessGate } from './components/pro/ProAccessGate';
import { resolveMarket } from './sports/markets';
import { gradePendingParlays } from './lib/parlayGrading';
import { generateAiParlays } from './lib/aiParlayGenerator';
import { isLive } from './lib/parlayLifecycle';
import { notify } from './lib/appNotifications';
import { apiClient } from './lib/apiClient';
import { getAuthToken, isSupabaseConfigured } from './lib/supabaseClient';
import { decimalToAmerican, decimalLabel } from './lib/odds';
import { normalizePlayerId } from './lib/mlbHeadshot';
import { normalizeParlaySlip, buildSaveParlayPayload } from './lib/parlays/parlayBridge';
import AuthStatusBadge from './components/auth/AuthStatusBadge';
import VouchEdgeLoader from './components/loading/VouchEdgeLoader';
import NbaNflArena from './components/NbaNflArena';
import { VouchEdgeLoadingScreen } from "./components/loading";
import { EdgePortalTransition } from "./components/transitions";
import VouchEdgeBootGate from "./components/boot/VouchEdgeBootGate";

const TheEdgeShell = lazy(() => import('./components/theEdge/TheEdgeShell'));
const HomeFeedPage = lazy(() => import('./social/feed/HomeFeedPage'));
const TodayDashboard = lazy(() => import('./components/TodayDashboard'));
const EdgeIslandPage = lazy(() => import('./pages/EdgeIslandPage'));
const VouchBoard = lazy(() => import('./components/VouchBoard'));
const ProfilePage = lazy(() => import('./components/ProfilePage'));
const SettingsPage = lazy(() => import('./components/SettingsPage'));
const PremiumSubPage = lazy(() => import('./components/PremiumSubPage'));
const PlayerResearchHub = lazy(() => import('./components/PlayerResearchHub'));
const CustomizePage = lazy(() => import('./components/CustomizePage'));
const ResultsStudio = lazy(() => import('./components/results/ResultsStudio'));
const SmartAiEngine = lazy(() => import('./components/SmartAiEngine'));
const MlbIntelligenceHub = lazy(() => import('./components/MlbIntelligenceHub'));
const Leaderboard = lazy(() => import('./components/Leaderboard'));
const ThemeStore = lazy(() => import('./components/ThemeStore'));
const EpicThemeShowcase = lazy(() =>
  import('./components/vouchedge/EpicThemeShowcase').then((module) => ({
    default: module.EpicThemeShowcase,
  })),
);
const SubscriberHub = lazy(() => import('./components/SubscriberHub'));
const LiveGameLabPage = lazy(() => import('./pages/LiveGameLabPage'));
const DailyHrBoardPage = lazy(() => import('./pages/DailyHrBoardPage'));
const DailyPlayersPage = lazy(() => import('./pages/DailyPlayersPage'));
const LiveGamesPro = lazy(() => import('./components/LiveGamesPro'));
const NotificationsPage = lazy(() => import('./components/notifications/NotificationsPage'));
const PlayerEdgeLabPage = lazy(() => import('./pages/pro/PlayerEdgeLabPage'));
const TeamMatchupLabPage = lazy(() => import('./pages/pro/TeamMatchupLabPage'));
const ProGraphsLabPage = lazy(() => import('./pages/pro/ProGraphsLabPage'));

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

const STICKY_PUBLIC_SECTIONS = new Set([
  'welcome',
  'feed',
  'home',
  'daily_players',
  'live_games',
  'hr_board',
  'game_research',
  'player_research',
]);

const PUBLIC_SECTIONS = new Set([
  'welcome',
  'feed',
  'home',
  'daily_players',
  'live_games',
  'hr_board',
  'game_research',
  'player_research',
  'top_cappers',
  'subscribers_club',
  'subscriber_club',
]);

function hasRealAuthToken() {
  try {
    // Only trust Supabase's real auth storage.
    // Do not trust old VouchEdge/demo/local fallback keys.
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key) continue;
      if (!key.startsWith('sb-') || !key.includes('auth-token')) continue;

      const raw = localStorage.getItem(key);
      if (!raw) continue;

      try {
        const parsed = JSON.parse(raw);
        const session = parsed?.currentSession ?? parsed;
        const accessToken = session?.access_token;
        const userId = session?.user?.id;

        if (accessToken && userId && accessToken.length >= 20) {
          localStorage.setItem('vouchedge_auth_token', accessToken);
          return true;
        }
      } catch {
        return false;
      }
    }
  } catch {
    return false;
  }

  return false;
}

const PROTECTED_SECTIONS = new Set([
  'billing',
  'admin',
]);

function saveActiveSection(section: string) {
  try {
    localStorage.setItem('vouchedge_active_section', section);
  } catch {
    // ignore storage failures
  }
}

function requiresLogin(section: string) {
  if (PUBLIC_SECTIONS.has(section)) return false;
  return PROTECTED_SECTIONS.has(section);
}


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

  if (target === 'notifications' || target === '/notifications' || target === 'alerts' || target === '/alerts') {
    return 'notifications';
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

function mapBackendParlay(pick: any): Parlay {
  // Backend stores DECIMAL odds (or null when unknown). Leg.odds is AMERICAN
  // (or null) — convert decimal→American, preserving "unknown" as null.
  const legs: Leg[] = (pick.legs || []).map((leg: any, i: number) => {
    const dec = typeof leg.odds_decimal === 'number' ? leg.odds_decimal : null;
    return {
      id: leg.id || `${pick.id}-leg-${i}`,
      sport: pick.sport || 'mlb',
      game: leg.event_id || '',
      market: leg.market || '',
      selection: leg.selection || '',
      odds: dec && dec > 1.01 ? decimalToAmerican(dec) : null,
      status: (['WON', 'LOST', 'VOID'].includes(String(leg.status || '').toUpperCase())
        ? (String(leg.status).toUpperCase() as Leg['status'])
        : 'PENDING'),
      gamePk: leg.event_id && leg.event_id !== 'manual' ? leg.event_id : undefined,
      marketCode: leg.market || undefined,
      actual: leg.actual ?? null,
      gameStartTime: leg.game_start_time || undefined,
      playerId: normalizePlayerId(leg.player_id),
    };
  });

  const status = ((): Parlay['status'] => {
    const s = String(pick.status || 'pending').toLowerCase();
    if (s === 'won') return 'WON';
    if (s === 'lost') return 'LOST';
    if (s === 'void' || s === 'push') return 'VOID';
    return 'PENDING';
  })();

  const decOdds = typeof pick.odds_decimal === 'number' ? pick.odds_decimal : null;
  const totalOdds = decimalLabel(decOdds); // "Odds TBD" when null/invalid

  return {
    id: pick.id,
    title: pick.explanation || pick.market || 'Saved Parlay',
    legs,
    totalOdds,
    oddsValue: decOdds && decOdds > 1.01 ? decOdds : 0,
    riskTier: 'MEDIUM',
    status,
    mode: pick.is_demo ? 'PRACTICE' : 'REAL',
    createdAt: pick.created_at,
    wagerAmount: pick.stake_units,
    backendPickId: pick.id,
    backendSyncState: 'synced',
    backendSyncedAt: pick.updated_at || pick.created_at,
    aiGenerated: Boolean(pick.ai_generated),
  };
}

export default function App() {
  const [edgePortalTransitionActive, setEdgePortalTransitionActive] = useState(() => {
    return sessionStorage.getItem("vouchedge_entering_edge_island") === "true";
  });

  useEffect(() => {
    if (!edgePortalTransitionActive) return;

    const timer = window.setTimeout(() => {
      sessionStorage.removeItem("vouchedge_entering_edge_island");
      setEdgePortalTransitionActive(false);
    }, 1700);

    return () => window.clearTimeout(timer);
  }, [edgePortalTransitionActive]);

  const [activeSection, setActiveSection] = useState<string>(() => {
    const locationSection = resolveDevSectionFromLocation();
    if (locationSection) return locationSection;
    if (DEV_BYPASS_AUTH && hasRealAuthToken()) return 'hr_board';
    return 'welcome';
  });
  const [authStateVersion, setAuthStateVersion] = useState(0);
  const activeSectionRef = useRef(activeSection);
  const routeSwitchTimerRef = useRef<number | null>(null);
  const gradingRef = useRef(false);
  const [isGrading, setIsGrading] = useState(false);
  const [gradingLastChecked, setGradingLastChecked] = useState<Date | null>(null);
  const backendParlaySyncRef = useRef(false);
  const backendProfileRef = useRef<BackendProfile | null | undefined>(undefined);
  const savedSlipsRef = useRef<Parlay[]>([]);
  const profileRef = useRef<CreatorProofProfile | null>(null);
  const [isPendingRoute, startRouteTransition] = useTransition();
  const [isRouteSwitching, setIsRouteSwitching] = useState(false);

  // The Edge Island — quick-launch popup dock, opened from the floating
  // launcher button (mounted globally, under the notification bell).
  const [edgeIslandOpen, setEdgeIslandOpen] = useState(false);

  // Boot loader: `appReady` flips once initial local data is loaded; the loader
  // then rushes to 100% and unmounts itself via `hideBootLoader`.
  const [appReady, setAppReady] = useState(false);
  const [hideBootLoader, setHideBootLoader] = useState(false);
  const [vouchEdgeLoadProgress, setVouchEdgeLoadProgress] = useState(8);
  const [vouchEdgeLoadMessage, setVouchEdgeLoadMessage] = useState("Starting VouchEdge systems...");

  const navigateSection = (section: string) => {
    if (PUBLIC_SECTIONS.has(section)) {
      saveActiveSection(section);
      setActiveSection(section);
      return;
    }

    if (requiresLogin(section) && !hasRealAuthToken()) {
      try {
        localStorage.setItem('vouchedge_after_auth_destination', section);
      } catch {
        // ignore storage failures
      }

      saveActiveSection('welcome');
      setActiveSection('welcome');
      return;
    }

    saveActiveSection(section);
    setActiveSection(section);
  }

  const handleLoginSuccess = () => {
    try {
      localStorage.setItem('vouchedge_after_auth_mode', 'island');
    } catch {
      // ignore storage failures
    }
    setAuthStateVersion((version) => version + 1);
    navigateSection('welcome');
  };

  const handleLogoutComplete = () => {
    setAuthStateVersion((version) => version + 1);
    saveActiveSection('welcome');
    setActiveSection('welcome');
  };
  
  useEffect(() => {
    if (hideBootLoader) return;

    const messages = [
      "Starting VouchEdge systems...",
      "Loading AI ledger...",
      "Syncing V.A.I smart picks...",
      "Checking result engine...",
      "Preparing premium command center...",
    ];

    let tick = 0;
    const timer = window.setInterval(() => {
      tick += 1;
      setVouchEdgeLoadProgress((current) => {
        if (appReady) return Math.min(100, current + 18);
        return Math.min(92, current + 7);
      });
      setVouchEdgeLoadMessage(messages[Math.min(messages.length - 1, tick % messages.length)]);
    }, 260);

    return () => window.clearInterval(timer);
  }, [appReady, hideBootLoader]);

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

  // The Edge route mode:
  // logged-out users see the premium public portal;
  // logged-in/dev users see the personalized My Edge dashboard.
  const isOpenEdgeDashboardMode = useMemo(
    () =>
      DEV_BYPASS_AUTH ||
      Boolean(localStorage.getItem('vouchedge_auth_token')) ||
      Boolean(localStorage.getItem('mlb_ai_auth_token')) ||
      localStorage.getItem('vouchedge_after_auth_mode') === 'island',
    [authStateVersion]
  );

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
        const loaded = JSON.parse(storedProfile);
        if (loaded.subscriptionTier !== 'SELLER_PRO') loaded.subscriptionTier = 'SELLER_PRO';
        setProfile(loaded);
      } else {
        setProfile(INITIAL_PROFILE);
        localStorage.setItem('vouchedge_profile', JSON.stringify(INITIAL_PROFILE));
      }
    } catch (e) {
      console.error('LocalStorage load failed, using fallbacks', e);
      setPosts(INITIAL_POSTS);
      setProfile(INITIAL_PROFILE);
    } finally {
      // Initial local data is loaded — let the boot loader finish to 100%.
      setAppReady(true);
    }
  }, []);

  // Load backend parlays on startup if user is authenticated.
  // Merges with localStorage: local-only parlays (no backendPickId) are kept;
  // backend parlays are authoritative for anything with a matching ID.
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;

    (async () => {
      try {
        const token = await getAuthToken();
        if (!token || cancelled) return;

        const result = await apiClient.get<{ parlays: any[] }>('/api/me/parlays?limit=100');
        if (!result?.parlays?.length || cancelled) return;

        const backendParlays = result.parlays.map(mapBackendParlay);
        const backendIds = new Set(backendParlays.map(p => p.id));

        const localSlips = savedSlipsRef.current;
        // Keep local parlays that have no backend record yet (new unsaved slips)
        const localOnly = localSlips.filter(p => !p.backendPickId || !backendIds.has(p.backendPickId));

        const merged = [...backendParlays, ...localOnly];
        const seen = new Set<string>();
        const deduped = merged.filter(p => {
          if (seen.has(p.id)) return false;
          seen.add(p.id);
          return true;
        });

        syncSlips(deduped);
      } catch (err) {
        console.warn('[parlays] backend load failed (localStorage parlays still active)', err);
      }
    })();

    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      const created = await apiClient.post<{ id: string }>('/api/me/parlays', payload);
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

  // Save new parlay created in ParlayLab / ParlayStudio
  // Push a single parlay to the backend (POST /api/me/parlays) and reflect the
  // sync state back into savedSlips. Shared by save + retry. Best-effort:
  // never throws — the parlay always survives in localStorage.
  const pushParlayToBackend = async (parlay: Parlay): Promise<void> => {
    if (!isSupabaseConfigured) return;

    // Duplicate protection (client-side): never fire two saves for one parlay.
    // If it is already synced or mid-save, do nothing. The backend also
    // de-dupes on client_ref, so this is defense-in-depth.
    const current = savedSlipsRef.current.find((p) => p.id === parlay.id);
    if (current?.backendPickId && current?.backendSyncState === 'synced') {
      return;
    }
    if (current?.backendSyncState === 'saving' && current !== parlay) {
      return;
    }

    // Mark as saving so the card can show a spinner.
    const markState = (state: Parlay['backendSyncState'], extra?: Partial<Parlay>) => {
      syncSlips(
        savedSlipsRef.current.map((p) =>
          p.id === parlay.id ? { ...p, backendSyncState: state, ...extra } : p
        )
      );
    };

    try {
      const token = await getAuthToken();
      if (!token) {
        markState('auth_required', {
          backendSyncError: 'Sign in to save this parlay to your account.',
        });
        return;
      }

      markState('saving', { backendSyncError: undefined });

      const canonicalSlip = normalizeParlaySlip(
        {
          ...parlay,
          source: parlay.aiGenerated ? 'ai_pick' : 'manual_builder',
        },
        parlay.aiGenerated ? 'ai_pick' : 'manual_builder',
      );
      const payload = buildSaveParlayPayload(canonicalSlip);

      const result = await apiClient.post<{ id: string; deduped?: boolean }>('/api/me/parlays', payload);

      if (result?.id) {
        markState('synced', {
          backendPickId: result.id,
          backendSyncedAt: new Date().toISOString(),
          backendSyncError: undefined,
        });
      } else {
        markState('failed', { backendSyncError: 'Backend did not return a parlay id.' });
      }
    } catch (err: any) {
      // Non-fatal — parlay is preserved in localStorage
      console.warn('[parlays] backend save failed (kept in localStorage)', err);
      markState('failed', {
        backendSyncError: err?.error || err?.message || 'Backend save failed.',
      });
    }
  };

  const handleSaveParlaySlip = async (newParlay: Parlay) => {
    const savedParlay: Parlay = {
      ...newParlay,
      id: newParlay.id || `parlay-${Date.now()}`,
      status: newParlay.status || 'PENDING',
      mode: newParlay.mode || 'PRACTICE',
      createdAt: newParlay.createdAt || new Date().toISOString(),
      lockNotified: false,
      backendSyncState: 'saving',
    };

    // Optimistic localStorage save — instant
    const updated = [savedParlay, ...savedSlips];
    syncSlips(updated);

    notify({
      kind: 'success',
      title: '✅ Parlay Saved',
      body: `${savedParlay.title || 'Your parlay'} was saved to Parlay Hub.`,
      section: 'live_parlays',
    });

    navigateSection('live_parlays');

    // Background backend sync — non-blocking, best-effort
    await pushParlayToBackend(savedParlay);
  };

  const pushAiParlaysToBackend = async (parlays: Parlay[]): Promise<void> => {
    if (!isSupabaseConfigured) return;

    for (const parlay of parlays) {
      if (!parlay.aiGenerated) continue;
      await pushParlayToBackend(parlay);
    }
  };

  // Retry backend sync for a local-only or failed parlay.
  const handleRetryParlaySync = async (parlayId: string) => {
    const parlay = savedSlipsRef.current.find((p) => p.id === parlayId);
    if (!parlay) return;
    await pushParlayToBackend(parlay);
  };

  // Grade pending parlays against the live MLB feed and reflect outcomes in
  // Results + profile stats. Idempotent: only PENDING+gradable parlays are sent,
  // and only PENDING→settled transitions update win/loss/units.
  const handleGradeResults = async () => {
    if (gradingRef.current) return;
    gradingRef.current = true;
    setIsGrading(true);
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
      setIsGrading(false);
      setGradingLastChecked(new Date());
    }
  };

  // Auto-grade when the user opens Results or My Parlays.
  useEffect(() => {
    if (activeSection === 'results' || activeSection === 'live_parlays') handleGradeResults();
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
    void pushAiParlaysToBackend(created);
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
    void pushAiParlaysToBackend(created);
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
      // Do not auto-POST grade requests from the global heartbeat.
      // Grading is rate-limited and should run from server cron or explicit user refresh.
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

  const handleAddLegFromResearch = (player: MLBPlayer, prop: { id: string; market: string; odds: number | null; spec: string; gamePk?: string | number; playerId?: number | string }) => {
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
    // Capture the MLB player id for headshots (prop.playerId, the player record,
    // or parsed from prop.id like "hr-665487"). Never guessed from the name.
    const playerId = normalizePlayerId(prop.playerId ?? player.id ?? prop.id);
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
      playerId,
    };
    setActiveLegs([...activeLegs, newLeg]);
    alert(`🎯 Added "${prop.spec}" to your active parlay slip context!`);
  };

  // Render content depending on left sidebar active item
  const renderMainView = () => {
    switch (activeSection) {
      case 'welcome':
        return (
          <TheEdgeShell
            mode={isOpenEdgeDashboardMode ? 'dashboard' : 'public'}
            presentation="page"
            activeSection={activeSection}
            savedParlays={savedSlips}
            profile={profile}
            onSectionChange={navigateSection}
          />
        );
      case 'today':
        return <TodayDashboard onSectionChange={navigateSection} savedSlips={savedSlips} />;
      case 'island':
        return <EdgeIslandPage onSectionChange={navigateSection} savedSlips={savedSlips} />;
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
        return <DailyHrBoardPage onAddLegToParlay={handleAddLegFromResearch} profile={profile} />;
      case 'daily_players':
        return <DailyPlayersPage />;
      case 'live_parlays':
        return <ParlayCommandCenter savedSlips={savedSlips} />;
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
        return <TeamMatchupLabPage />;
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
      case 'notifications':
        return <NotificationsPage onSectionChange={navigateSection} />;
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
      case 'nba_nfl':
        return (
          <NbaNflArena
            onSectionChange={navigateSection}
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
      <VouchEdgeBootGate enabled={activeSection !== 'welcome' && hasRealAuthToken()}>
        <div className="ve-motion-shell ve-theme-transition">
        <div className="ve-motion-bg" aria-hidden="true">
          <div className="ve-motion-grid" />
          <div className="ve-motion-noise" />
          <div className="ve-motion-spotlight" />
          <div className="ve-motion-orb ve-motion-orb-a" />
          <div className="ve-motion-orb ve-motion-orb-b" />
          <div className="ve-motion-orb ve-motion-orb-c" />
        </div>

        <div className="ve-motion-content">
          {!hideBootLoader && (
            <VouchEdgeLoader ready={appReady} onDone={() => setHideBootLoader(true)} />
          )}
          <AppErrorBoundary resetKey={activeSection} onBackHome={() => navigateSection('today')}>
        <AuthStatusBadge
          hideGuest={activeSection === 'welcome'}
          onLoginSuccess={handleLoginSuccess}
          onLogoutComplete={handleLogoutComplete}
        />
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
          <Suspense
            fallback={
              <div className="flex min-h-[50vh] items-center justify-center p-8 text-sm font-bold text-slate-400">
                Loading view...
              </div>
            }
          >
            {renderMainView()}
          </Suspense>
          {activeSection !== 'welcome' && <HrNotifications savedSlips={savedSlips} />}
        </HomeFeedLayout>
        <AppNotificationsHost onNavigate={navigateSection} />

        {/* The Edge Island launcher — sits directly under the notification
            bell (which lives at bottom-44/40 right-6/8 in AppNotificationsHost). */}
        {activeSection !== 'welcome' && (
          <button
            type="button"
            onClick={() => setEdgeIslandOpen(true)}
            aria-label="Open The Edge Island"
            title="The Edge Island"
            className="fixed bottom-28 md:bottom-24 right-6 md:right-8 z-[60] w-12 h-12 rounded-full bg-slate-900 border border-cyan-500/40 flex items-center justify-center shadow-xl shadow-cyan-950/30 hover:border-cyan-400/70 hover:bg-slate-800 transition-colors"
          >
            <EdgeIslandIcon className="w-5 h-5 text-cyan-300" />
          </button>
        )}

        <EdgeIslandCommandCenter
          open={edgeIslandOpen}
          onClose={() => setEdgeIslandOpen(false)}
          onSectionChange={navigateSection}
          savedSlips={savedSlips}
          profile={profile}
        />
          </AppErrorBoundary>
        </div>
        </div>
      </VouchEdgeBootGate>
    </ThemeProvider>
  );
}
