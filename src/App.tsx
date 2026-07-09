import React, { Suspense, lazy, useState, useEffect, useRef, useTransition, useCallback, useMemo } from 'react';
import HomeFeedLayout from './social/feed/HomeFeedLayout';
import { Home, Plus, Sparkles as EdgeIslandIcon } from 'lucide-react';
import { useLiveGames } from './hooks/queries/useLiveGames';
import { useMyParlays } from './hooks/queries/useMyParlays';
import { useMyVouches } from './hooks/queries/useMyVouches';
import { fetchAuthMe } from './hooks/queries/useAuthMe';
import { queryClient } from './lib/queryClient';
import { queryKeys } from './hooks/queries/queryKeys';
import { ThemeProvider } from './components/theme/ThemeProvider';
import { canAccessThemeStore } from './lib/adminDevAccess';
import AppErrorBoundary from './components/AppErrorBoundary';

import { FeedPost, Parlay, Vouch, CreatorProofProfile, Leg, MLBPlayer } from './types';
import { INITIAL_PROFILE, INITIAL_POSTS } from './data/mockData';
import { resolveMarket } from './sports/markets';
import { isLive } from './lib/parlayLifecycle';
import { canDeleteFeedPost } from './lib/postDeletePolicy';
import { notify } from './lib/appNotifications';
import { apiClient } from './lib/apiClient';
import { getAuthToken, isSupabaseConfigured } from './lib/supabaseClient';
import { decimalToAmerican, decimalLabel } from './lib/odds';
import { normalizePlayerId } from './lib/mlbHeadshot';
import { normalizeParlaySlip, buildSaveParlayPayload, type CanonicalParlaySlip } from './lib/parlays/parlayBridge';
import { useParlayCommandStore } from './stores/parlayCommandStore';
import AuthStatusBadge from './components/auth/AuthStatusBadge';
import GoodbyeScreen from './components/auth/GoodbyeScreen';
import VouchEdgeBootGate from "./components/boot/VouchEdgeBootGate";

const ProAccessGate = lazy(() =>
  import('./components/pro/ProAccessGate').then((module) => ({ default: module.ProAccessGate })),
);

const HomeFeedPage = lazy(() => import('./social/feed/HomeFeedPage'));
const TodayDashboard = lazy(() => import('./components/TodayDashboard'));
const EdgeIslandPage = lazy(() => import('./pages/EdgeIslandPage'));
const VouchEdgeTerminalPage = lazy(() => import('./pages/VouchEdgeTerminalPage'));
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
const HomeRunIntelligencePage = lazy(() => import('./features/hr/pages/HomeRunIntelligencePage'));
const AiPilotPage = lazy(() => import('./features/ai/pages/AiPilotPage'));
const MlbStatHubPage = lazy(() => import('./features/mlb-stats/pages/MlbStatHubPage'));
const DailyPlayersPage = lazy(() => import('./pages/DailyPlayersPage'));
const LiveGamesPro = lazy(() => import('./components/LiveGamesPro'));
const NotificationsPage = lazy(() => import('./components/notifications/NotificationsPage'));
const PlayerEdgeLabPage = lazy(() => import('./pages/pro/PlayerEdgeLabPage'));
const TeamMatchupLabPage = lazy(() => import('./pages/pro/TeamMatchupLabPage'));
const HitterMatchupZonesPage = lazy(() => import('./pages/pro/HitterMatchupZonesPage'));
const ProGraphsLabPage = lazy(() => import('./pages/pro/ProGraphsLabPage'));
const ProCommandCenterPage = lazy(() => import('./pages/pro/ProCommandCenterPage'));
const ParlayCommandCenter = lazy(() => import('./components/parlay/ParlayCommandCenter'));
const EdgeIslandCommandCenter = lazy(() => import('./components/theEdge/EdgeIslandCommandCenter'));
const NbaNflArena = lazy(() => import('./components/NbaNflArena'));

/** Default daily time the AI builds the slate (local time, "HH:MM"). */
const AI_GEN_DEFAULT_TIME = '10:00';

interface BackendProfile {
  id: string;
  age_confirmed_at?: string | null;
  jurisdiction_confirmed_at?: string | null;
  jurisdiction?: string | null;
}

type BackendParlayLeg = {
  id?: string | number | null;
  event_id?: string | number | null;
  game_id?: string | number | null;
  game_pk?: string | number | null;
  market?: string | null;
  market_code?: string | null;
  selection?: string | null;
  odds_decimal?: number | string | null;
  status?: string | null;
  actual?: number | string | null;
  game_start_time?: string | null;
  player_id?: string | number | null;
};

type BackendParlay = {
  id: string;
  title?: string | null;
  status?: string | null;
  mode?: string | null;
  sport?: string | null;
  legs?: BackendParlayLeg[];
  combined_odds?: number | string | null;
  odds_decimal?: number | string | null;
  stake_units?: number | string | null;
  wager_amount?: number | string | null;
  ai_generated?: boolean | null;
  source?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  resolved_at?: string | null;
  game_date?: string | null;
  game_start_time?: string | null;
};

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

const PUBLIC_SECTIONS = new Set([
  'welcome',
  'vouchedge_intro',
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
  'mlb_stats',
]);

const SIGNED_IN_HOME = 'today';

/** Only poll live games while a view that consumes them is active. */
const SECTIONS_USING_LIVE_GAMES = new Set([
  'build',
  'live_parlays',
  'ai_engine',
  'live_games',
  'research',
  'game_research',
  'player_research',
]);

function getSavedActiveSection(): string | null {
  try {
    return localStorage.getItem('vouchedge_active_section');
  } catch {
    return null;
  }
}

/** Signed-in users must never land on the public intro terminal. */
function resolveAuthenticatedSection(section: string): string {
  if (!hasRealAuthToken()) return section;
  if (section !== 'vouchedge_intro') return section;
  const saved = getSavedActiveSection();
  if (saved && saved !== 'vouchedge_intro') return saved;
  return SIGNED_IN_HOME;
}

function replaceLandingUrl(homeSection = SIGNED_IN_HOME) {
  if (typeof window === 'undefined') return;
  const pathname = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase().replace(/^#/, '');
  const onLandingPath =
    pathname === '/' ||
    pathname === '/vouchedge' ||
    pathname === '/vouchedge-intro' ||
    hash === 'vouchedge_intro' ||
    hash === 'vouchedge' ||
    hash === 'vouchedge-intro' ||
    hash === '';
  if (onLandingPath) {
    window.history.replaceState(null, '', `/${homeSection}`);
  }
}

function hasRealAuthToken() {
  try {
    // Only trust Supabase's real auth storage — never old demo/local keys.
    // Our client persists its session under the custom storageKey
    // "vouchedge.auth" (see lib/supabaseClient.ts); sessions saved before
    // that key existed live under Supabase's default "sb-<ref>-auth-token".
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key) continue;
      const isSupabaseSessionKey =
        key === 'vouchedge.auth' ||
        (key.startsWith('sb-') && key.includes('auth-token'));
      if (!isSupabaseSessionKey) continue;

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
        // Malformed entry under this key — keep scanning the others
        // instead of declaring the user logged out.
        continue;
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
  if (typeof window === 'undefined') return null;

  const pathname = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase().replace(/^#/, '');
  const target = hash || pathname;

  if (target === '' || target === '/') {
    return hasRealAuthToken() ? SIGNED_IN_HOME : 'vouchedge_intro';
  }

  if (target === 'vouchres/vouchedge' || target === '/vouchres/vouchedge') {
    const section = hasRealAuthToken() ? SIGNED_IN_HOME : 'vouchedge_intro';
    window.history.replaceState(null, '', hasRealAuthToken() ? `/${section}` : '/vouchedge');
    return section;
  }

  if (
    target === 'vouchedge-intro' || target === '/vouchedge-intro' ||
    target === 'vouchedge' || target === '/vouchedge'
  ) {
    if (hasRealAuthToken()) {
      window.history.replaceState(null, '', `/${SIGNED_IN_HOME}`);
      return SIGNED_IN_HOME;
    }
    return 'vouchedge_intro';
  }

  if (target === 'today' || target === '/today') {
    return 'today';
  }

  if (
    target === 'welcome' || target === '/welcome' ||
    target === 'island' || target === '/island'
  ) {
    return 'welcome';
  }

  if (
    target === 'daily-hr-watch-new' || target === '/daily-hr-watch-new' ||
    target === 'hr-board' || target === '/hr-board' ||
    target === 'daily-hr-board' || target === '/daily-hr-board'
  ) {
    return 'hr_board';
  }

  if (target === 'daily-players' || target === '/daily-players') {
    return 'daily_players';
  }

  if (target === 'mlb-stat-hub' || target === '/mlb-stat-hub' || target === 'mlb-stats' || target === '/mlb-stats') {
    return 'mlb_stats';
  }

  if (target === 'intel' || target === '/intel' || target === 'mlb-intelligence' || target === '/mlb-intelligence') {
    return 'intel';
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

function mapBackendVouch(row: any): Vouch {
  const status = ((): Vouch['status'] => {
    const s = String(row.status || 'pending').toLowerCase();
    if (s === 'won') return 'WON';
    if (s === 'lost') return 'LOST';
    if (s === 'void' || s === 'push') return 'VOID';
    return 'PENDING';
  })();

  return {
    id: row.id,
    vouchSource: row.vouch_source,
    userNote: row.user_note || '',
    market: row.market,
    sport: row.sport,
    playerOrTeam: row.player_or_team || undefined,
    gameName: row.game_name,
    odds: row.odds,
    status,
    savedCount: row.saved_count ?? 0,
    vouchedCount: row.vouched_count ?? 0,
    createdAt: row.created_at,
    isSavedByUser: true,
    line: row.line || undefined,
    selection: row.selection || undefined,
    aiConfidence: row.ai_confidence ?? undefined,
    capperConfidence: row.capper_confidence ?? undefined,
    riskTier: row.risk_tier || undefined,
    isLocked: row.is_locked,
    lockTime: row.lock_time || undefined,
    longerBreakdown: row.longer_breakdown || undefined,
    cardTheme: row.card_theme || undefined,
    visibility: row.visibility,
    backendVouchId: row.id,
    backendSyncState: 'synced',
    backendSyncedAt: row.updated_at || row.created_at,
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
    const raw = locationSection
      ?? (DEV_BYPASS_AUTH && hasRealAuthToken() ? 'hr_board' : 'vouchedge_intro');
    return resolveAuthenticatedSection(raw);
  });
  const activeSectionRef = useRef(activeSection);
  const [loggingOut, setLoggingOut] = useState(false);
  const gradingRef = useRef(false);
  const [, setIsGrading] = useState(false);
  const [, setGradingLastChecked] = useState<Date | null>(null);
  const backendParlaySyncRef = useRef(false);
  const backendProfileRef = useRef<BackendProfile | null | undefined>(undefined);
  const savedSlipsRef = useRef<Parlay[]>([]);
  const savedVouchesRef = useRef<Vouch[]>([]);
  const postsRef = useRef<FeedPost[]>([]);
  const profileRef = useRef<CreatorProofProfile | null>(null);
  const [isPendingRoute, startTransition] = useTransition();

  // The Edge Island — quick-launch popup dock, opened from the floating
  // launcher button (mounted globally, under the notification bell).
  const [edgeIslandOpen, setEdgeIslandOpen] = useState(false);
  const [profileViewUserId, setProfileViewUserId] = useState<string | null>(null);

  const navigateToUserProfile = (userId: string) => {
    if (!userId) return;
    setProfileViewUserId(userId);
    navigateSection('profile');
  };

  const commitSection = useCallback((target: string) => {
    startTransition(() => {
      saveActiveSection(target);
      setActiveSection(target);
    });
  }, []);

  const navigateSection = useCallback((section: string) => {
    if (section !== 'profile') {
      setProfileViewUserId(null);
    }
    const target = resolveAuthenticatedSection(section);
    if (target !== section) {
      replaceLandingUrl(target);
      commitSection(target);
      return;
    }

    if (PUBLIC_SECTIONS.has(target)) {
      commitSection(target);
      return;
    }

    if (requiresLogin(target) && !hasRealAuthToken()) {
      try {
        localStorage.setItem('vouchedge_after_auth_destination', target);
      } catch {
        // ignore storage failures
      }

      commitSection('welcome');
      return;
    }

    commitSection(target);
  }, [commitSection]);

  const handleLoginSuccess = () => {
    try {
      localStorage.setItem('vouchedge_after_auth_mode', 'welcome');
    } catch {
      // ignore storage failures
    }
    navigateSection('welcome');
  };

  const handleLogoutComplete = () => {
    setLoggingOut(true);
    window.setTimeout(() => {
      window.history.replaceState(null, '', '/');
      commitSection('welcome');
      setLoggingOut(false);
    }, 900);
  };
  
  useEffect(() => {
    activeSectionRef.current = activeSection;
  }, [activeSection]);

  // Signed-in users must never stay on the public intro terminal.
  useEffect(() => {
    if (!hasRealAuthToken()) return;
    if (activeSection !== 'vouchedge_intro') return;
    const next = resolveAuthenticatedSection(activeSection);
    replaceLandingUrl(next);
    commitSection(next);
  }, [activeSection, commitSection]);

  useEffect(() => {
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
  const needsLiveGames = SECTIONS_USING_LIVE_GAMES.has(activeSection);
  const { data: liveGamesPayload } = useLiveGames({ enabled: needsLiveGames });
  const liveGames = liveGamesPayload?.games ?? [];
  const { data: backendParlayRows } = useMyParlays();
  const { data: backendVouchRows } = useMyVouches();
  const canSeeThemeStore = canAccessThemeStore(profile);

  useEffect(() => {
    if (activeSection === 'themestore' && !canSeeThemeStore) {
      commitSection('profile');
    }
  }, [activeSection, canSeeThemeStore, commitSection]);

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
    }
  }, []);

  // Merge backend parlays from React Query with local-only slips.
  useEffect(() => {
    if (!backendParlayRows?.length) return;

    const backendParlays = backendParlayRows.map(mapBackendParlay);
    const backendPickIds = new Set(
      backendParlays
        .map((p) => p.backendPickId || p.id)
        .filter(Boolean)
        .map(String)
    );

    const localSlips = savedSlipsRef.current;
    const localOnly = localSlips.filter((p) => {
      if (!p.backendPickId) return true;
      return !backendPickIds.has(String(p.backendPickId));
    });

    const merged = [...backendParlays, ...localOnly];
    const seen = new Set<string>();
    const deduped = merged.filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });

    syncSlips(deduped);
  }, [backendParlayRows]);

  // Merge backend vouches from React Query with local-only vouches.
  useEffect(() => {
    if (!backendVouchRows?.length) return;

    const backendVouches = backendVouchRows.map(mapBackendVouch);
    const backendVouchIds = new Set(
      backendVouches.map((v) => v.backendVouchId || v.id).filter(Boolean).map(String)
    );

    const localOnly = savedVouchesRef.current.filter((v) => {
      if (!v.backendVouchId) return true;
      return !backendVouchIds.has(String(v.backendVouchId));
    });

    const merged = [...backendVouches, ...localOnly];
    const seen = new Set<string>();
    const deduped = merged.filter((v) => {
      if (seen.has(v.id)) return false;
      seen.add(v.id);
      return true;
    });

    syncVouches(deduped);
  }, [backendVouchRows]);

  // Sync state modifications helper
  function syncPosts(newPosts: FeedPost[]) {
    setPosts(newPosts);
    localStorage.setItem('vouchedge_posts', JSON.stringify(newPosts));
  }

  function syncSlips(newSlips: Parlay[]) {
    savedSlipsRef.current = newSlips;
    setSavedSlips(newSlips);
    localStorage.setItem('vouchedge_slips', JSON.stringify(newSlips));
  }

  function syncVouches(newVouches: Vouch[]) {
    setSavedVouches(newVouches);
    localStorage.setItem('vouchedge_vouches', JSON.stringify(newVouches));
  }

  function syncProfile(newProfile: CreatorProofProfile) {
    profileRef.current = newProfile;
    setProfile(newProfile);
    localStorage.setItem('vouchedge_profile', JSON.stringify(newProfile));
  }

  const fetchBackendProfile = async (): Promise<BackendProfile | null> => {
    if (!isSupabaseConfigured) return null;
    if (backendProfileRef.current !== undefined) return backendProfileRef.current;

    try {
      const me = await queryClient.fetchQuery({
        queryKey: queryKeys.authMe(),
        queryFn: fetchAuthMe,
        staleTime: 5 * 60_000,
      });
      backendProfileRef.current = me;
      return me;
    } catch (error) {
      console.warn('[parlays] backend profile lookup failed', error);
      backendProfileRef.current = null;
      return null;
    }
  };

  const _syncParlayToBackend = async (parlay: Parlay): Promise<Parlay> => {
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
  useEffect(() => {
    savedSlipsRef.current = savedSlips;
  }, [savedSlips]);

  useEffect(() => {
    savedVouchesRef.current = savedVouches;
  }, [savedVouches]);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  useEffect(() => {
    postsRef.current = posts;
  }, [posts]);

  // Legacy AI parlay auto-sync is intentionally quarantined.
  // New save truth must flow through pushParlayToBackend() -> /api/me/parlays
  // and consume the enriched backend response. Leaving this heartbeat active
  // caused old localStorage/parlay feature code to compete with Command Center
  // hydration and refresh truth.
  useEffect(() => {
    backendParlaySyncRef.current = false;
  }, []);

  // Interaction: Create post
  const handlePostCreated = useCallback((postData: Partial<FeedPost>) => {
    const profile = profileRef.current ?? INITIAL_PROFILE;
    const posts = postsRef.current;
    const savedVouches = savedVouchesRef.current;
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
    let vouchForBackend: Vouch | undefined;
    if (newPost.postType === 'VOUCH' && newPost.vouch) {
      const exists = savedVouches.some((v) => v.id === newPost.vouch?.id);
      if (!exists) {
        vouchForBackend = { ...newPost.vouch, isSavedByUser: true };
        syncVouches([...savedVouches, vouchForBackend]);
      } else {
        vouchForBackend = savedVouches.find((v) => v.id === newPost.vouch?.id);
      }
    }

    // If posting a result, update profile statistics dynamically for real transparency!
    if (newPost.postType === 'RESULT' && newPost.result) {
      const res = newPost.result;
      const isWin = res.status === 'WON';
      const isLoss = res.status === 'LOST';

      if (isWin || isLoss) {
        const additionalProfit = isWin ? res.profit ?? 0.0 : -res.units;

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

    // Best-effort backend sync — never blocks the optimistic UI update above.
    // Guests keep the existing local-only behavior (no network call, no error).
    if (newPost.content.trim()) {
      (async () => {
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
            setPosts((prev) => {
              const next = prev.map((p) =>
                p.id === newPost.id ? { ...p, backendPostId: created.id } : p,
              );
              localStorage.setItem('vouchedge_posts', JSON.stringify(next));
              return next;
            });
          }
        } catch (err) {
          console.warn('[posts] backend save failed (kept in localStorage)', err);
        }
      })();
    }
  }, []);

  // Interaction: Like toggle
  const handleLikePost = useCallback((postId: string) => {
    const updated = postsRef.current.map((p) => {
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
  }, []);

  // Interaction: Tailing pick (vouching)
  const handleVouchPost = useCallback((postId: string) => {
    const updated = postsRef.current.map((p) => {
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
  }, []);

  // Interaction: Repost toggle
  const handleRepostPost = useCallback((postId: string) => {
    const updated = postsRef.current.map((p) => {
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
  }, []);

  const handleDeletePost = useCallback((postId: string) => {
    const posts = postsRef.current;
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
  }, []);

  // Interaction: Save Vouch to Board (either from feed or right-hand matchups)
  const handleSaveVouch = useCallback((vouch: Vouch) => {
    const savedVouches = savedVouchesRef.current;
    const existing = savedVouches.find((v) => v.id === vouch.id);

    if (existing) {
      syncVouches(savedVouches.filter((v) => v.id !== vouch.id));
      if (existing.backendVouchId) {
        apiClient.delete(`/api/vouches/${encodeURIComponent(existing.backendVouchId)}`)
          .catch((err) => console.warn('[vouches] backend hide failed', err));
      }
      return;
    }

    const newVouch: Vouch = { ...vouch, isSavedByUser: true };
    syncVouches([...savedVouches, newVouch]);
    void pushVouchToBackend(newVouch);
  }, []);

  const handleRemoveVouchFromBoard = (vouchId: string) => {
    const existing = savedVouches.find((v) => v.id === vouchId);
    syncVouches(savedVouches.filter((v) => v.id !== vouchId));
    if (existing?.backendVouchId) {
      apiClient.delete(`/api/vouches/${encodeURIComponent(existing.backendVouchId)}`)
        .catch((err) => console.warn('[vouches] backend hide failed', err));
    }
  };

  // Interaction: Write comment
  const handleAddComment = useCallback((postId: string, commentContent: string) => {
    const profile = profileRef.current ?? INITIAL_PROFILE;
    const updated = postsRef.current.map((p) => {
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
  }, []);

  // Update saved parlay from Parlay Hub
  const _handleUpdateParlaySlip = (updatedParlay: Parlay) => {
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

      const result = await apiClient.post<BackendParlay & { deduped?: boolean }>('/api/me/parlays', payload);

      if (result?.id) {
        const backendTruth = mapBackendParlay(result);
        syncSlips(
          savedSlipsRef.current.map((p) =>
            p.id === parlay.id
              ? {
                  ...backendTruth,
                  backendPickId: result.id,
                  backendSyncedAt: new Date().toISOString(),
                  backendSyncState: 'synced',
                  backendSyncError: undefined,
                }
              : p
          )
        );
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

  // Background backend sync for a saved vouch — mirrors pushParlayToBackend.
  // Never throws: the vouch always survives in localStorage regardless of
  // backend outcome. Returns the backend-assigned id on success.
  const pushVouchToBackend = async (vouch: Vouch): Promise<string | undefined> => {
    if (!isSupabaseConfigured) return undefined;

    if (vouch.backendVouchId && vouch.backendSyncState === 'synced') {
      return vouch.backendVouchId;
    }

    const markState = (state: Vouch['backendSyncState'], extra?: Partial<Vouch>) => {
      setSavedVouches((prev) => {
        const next = prev.map((v) =>
          v.id === vouch.id ? { ...v, backendSyncState: state, ...extra } : v
        );
        localStorage.setItem('vouchedge_vouches', JSON.stringify(next));
        return next;
      });
    };

    try {
      const token = await getAuthToken();
      if (!token) {
        markState('auth_required', {
          backendSyncError: 'Sign in to sync this vouch to your account.',
        });
        return undefined;
      }

      markState('saving', { backendSyncError: undefined });

      const payload = {
        vouch_source: vouch.vouchSource,
        user_note: vouch.userNote,
        market: vouch.market,
        sport: vouch.sport,
        player_or_team: vouch.playerOrTeam,
        game_name: vouch.gameName,
        odds: vouch.odds,
        line: vouch.line,
        selection: vouch.selection,
        ai_confidence: vouch.aiConfidence,
        capper_confidence: vouch.capperConfidence,
        risk_tier: vouch.riskTier,
        longer_breakdown: vouch.longerBreakdown,
        card_theme: vouch.cardTheme,
        visibility: vouch.visibility,
      };

      const result = await apiClient.post<{ id: string }>('/api/vouches', payload);

      if (result?.id) {
        markState('synced', {
          backendVouchId: result.id,
          backendSyncedAt: new Date().toISOString(),
        });
        return result.id;
      }

      markState('failed', { backendSyncError: 'Backend did not return a vouch id.' });
      return undefined;
    } catch (err: any) {
      console.warn('[vouches] backend save failed (kept in localStorage)', err);
      markState('failed', {
        backendSyncError: err?.error || err?.message || 'Backend save failed.',
      });
      return undefined;
    }
  };

  const handleSaveParlaySlip = async (newParlay: Parlay | CanonicalParlaySlip) => {
    const normalizedUiStatus =
      newParlay.status === 'won'
        ? 'WON'
        : newParlay.status === 'lost'
          ? 'LOST'
          : newParlay.status === 'void'
            ? 'VOID'
            : 'PENDING';

    const savedParlay: Parlay = {
      id: newParlay.id || `parlay-${Date.now()}`,
      title: newParlay.title,
      legs: Array.isArray(newParlay.legs) ? (newParlay.legs as unknown as Leg[]) : [],
      status: normalizedUiStatus,
      mode: newParlay.mode || 'PRACTICE',
      createdAt: newParlay.createdAt || new Date().toISOString(),
      totalOdds: "totalOdds" in newParlay ? String(newParlay.totalOdds || "") : "",
      oddsValue: "oddsValue" in newParlay ? Number(newParlay.oddsValue || 0) : 0,
      riskTier: "riskTier" in newParlay ? newParlay.riskTier : "LOW",
      lockNotified: false,
      backendSyncState: 'saving',
      aiGenerated: "aiGenerated" in newParlay ? Boolean(newParlay.aiGenerated) : false,
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

    useParlayCommandStore.getState().setActivePanel('vai_ledger');
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
  const _handleRetryParlaySync = async (parlayId: string) => {
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
      const { gradePendingParlays } = await import('./lib/parlayGrading');
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

    const created = await (await import('./lib/aiParlayGenerator')).generateAiParlays({ sport: 'mlb' });
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
  const _handleGenerateAiParlaysNow = async () => {
    if (gradingRef.current) return;
    const created = await (await import('./lib/aiParlayGenerator')).generateAiParlays({ sport: 'mlb' });
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

  const savedVouchIds = useMemo(() => savedVouches.map((v) => v.id), [savedVouches]);

  const resolvePlayerResearchMarket = (market: string, spec: string) => {
    const text = `${market} ${spec}`.toLowerCase();

    const parseTarget = (fallback = 1) => {
      const plus = text.match(/(\d+)\s*\+/);
      if (plus) return Number.parseInt(plus[1], 10);

      const leading = text.match(/^\s*(\d+)\b/);
      if (leading) return Number.parseInt(leading[1], 10);

      return fallback;
    };

    if (/home\s*run|\bhr\b/.test(text)) {
      return { marketCode: "ANYTIME_HR", statTarget: 1, threshold: 1, comparator: ">=" };
    }

    if (/stolen\s*base|\bsb\b/.test(text)) {
      return { marketCode: "STOLEN_BASE", statTarget: 1, threshold: 1, comparator: ">=" };
    }

    if (/total\s*bases|\btb\b/.test(text)) {
      const target = parseTarget(1);
      return { marketCode: "TOTAL_BASES", statTarget: target, threshold: target, comparator: ">=" };
    }

    if (/\brbi\b|runs?\s+batted\s+in/.test(text)) {
      const target = parseTarget(1);
      return { marketCode: "RBI", statTarget: target, threshold: target, comparator: ">=" };
    }

    if (/\btriple\b/.test(text)) {
      return { marketCode: "TRIPLE", statTarget: 1, threshold: 1, comparator: ">=" };
    }

    if (/\bdouble\b/.test(text)) {
      return { marketCode: "DOUBLE", statTarget: 1, threshold: 1, comparator: ">=" };
    }

    if (/\bsingle\b/.test(text)) {
      return { marketCode: "SINGLE", statTarget: 1, threshold: 1, comparator: ">=" };
    }

    if (/\bhits?\b/.test(text)) {
      const target = parseTarget(1);
      return { marketCode: "HIT", statTarget: target, threshold: target, comparator: ">=" };
    }

    const fallback = resolveMarket("mlb", market, spec);
    return {
      marketCode: fallback.marketCode,
      statTarget: fallback.threshold,
      threshold: fallback.threshold,
      comparator: ">=",
    };
  };

  const buildPlayerResearchEventKey = (parts: {
    sport: string;
    gamePk?: string;
    playerId?: string | number | null;
    marketCode?: string | null;
    statTarget?: string | number | null;
    comparator?: string | null;
  }) => {
    const gamePart = parts.gamePk ?? "GAME_TBD";
    const playerPart = parts.playerId ?? "PLAYER_TBD";
    const marketPart = parts.marketCode ?? "MARKET_TBD";
    const targetPart = parts.statTarget ?? "TARGET_TBD";
    const comparatorPart = String(parts.comparator ?? ">=").replace(/[^a-zA-Z0-9]+/g, "");
    return `${parts.sport}_${gamePart}_${playerPart}_${marketPart}_${targetPart}_${comparatorPart}`;
  };

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
    const { marketCode, statTarget, threshold, comparator } = resolvePlayerResearchMarket(prop.market, prop.spec);
    const gamePk = prop.gamePk != null ? String(prop.gamePk) : (matchedGame?.gamePk != null ? String(matchedGame.gamePk) : undefined);
    // Capture the MLB player id for headshots (prop.playerId, the player record,
    // or parsed from prop.id like "hr-665487"). Never guessed from the name.
    const playerId = normalizePlayerId(prop.playerId ?? player.id ?? prop.id);
    const teamId = (player as { teamId?: string | number | null }).teamId ?? null;
    const eventKey = buildPlayerResearchEventKey({
      sport: "MLB",
      gamePk,
      playerId,
      marketCode,
      statTarget,
      comparator,
    });
    const popularityKey = `MLB_${playerId ?? "PLAYER_TBD"}_${marketCode || "MARKET_TBD"}_${statTarget ?? "TARGET_TBD"}`;
    const makeTag = (value: unknown) => {
      const raw = String(value ?? "")
        .trim()
        .replace(/[^a-zA-Z0-9]+/g, "");

      return raw ? `#${raw}` : null;
    };

    const marketTag =
      prop.market.toLowerCase().includes("home run") || prop.market.toLowerCase().includes("hr")
        ? "#HR"
        : makeTag(prop.market);

    const draftTags = [
      makeTag("MLB"),
      makeTag(player.team),
      makeTag(player.name),
      marketTag,
      makeTag("PlayerProp"),
      makeTag("Research"),
    ].filter((tag): tag is string => Boolean(tag));

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
      statTarget,
      threshold,
      comparator,
      eventKey,
      popularityKey,
      externalProvider: "vouchedge_player_research",
      playerId,
      teamId,
    };
    setActiveLegs([...activeLegs, newLeg]);
    useParlayCommandStore.getState().addDraftLeg({
      id: newLeg.id,
      source: "manual",
      sport: newLeg.sport,
      game: newLeg.game,
      selection: newLeg.selection,
      odds: newLeg.odds ?? undefined,
      marketCode: newLeg.marketCode,
      marketLabel: newLeg.market,
      playerId: newLeg.playerId,
      playerName: player.name,
      teamLabel: player.team,
      statTarget: newLeg.statTarget ?? newLeg.threshold,
      comparator: newLeg.comparator,
      externalProvider: newLeg.externalProvider ?? "vouchedge_player_research",
      eventKey: newLeg.eventKey,
      teamId: newLeg.teamId,
      gamePk: newLeg.gamePk,
      tags: draftTags,
    });
    alert(`🎯 Added "${prop.spec}" to your active parlay slip context and Command Center Build Slip!`);
  };

  // Render content depending on left sidebar active item
  const handleHideSavedParlay = async (parlayId: string) => {
    const target = savedSlipsRef.current.find((slip) => {
      const realId = String((slip as any).id ?? (slip as any).sourceId ?? '');
      const publicId = String((slip as any).publicId ?? '');
      return realId === String(parlayId) || publicId === String(parlayId);
    });

    if (!target) {
      throw new Error('Could not find this saved parlay. Refresh My Parlay Board and try again.');
    }

    const status = String((target as any).status ?? '').toLowerCase();
    if (['pending', 'live', 'open', 'active', 'in_progress'].includes(status)) {
      throw new Error('Pending or live parlays are locked to protect grading truth.');
    }

    const realId = String((target as any).id ?? (target as any).sourceId ?? parlayId);
    const isBackendSynced = Boolean((target as any).synced) && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(realId);

    if (isBackendSynced) {
      await apiClient.delete(`/api/parlays/${encodeURIComponent(realId)}`);
    }

    const nextSlips = savedSlipsRef.current.filter((slip) => {
      const slipRealId = String((slip as any).id ?? (slip as any).sourceId ?? '');
      const slipPublicId = String((slip as any).publicId ?? '');
      return slipRealId !== realId && slipRealId !== String(parlayId) && slipPublicId !== String(parlayId);
    });

    syncSlips(nextSlips);
  };


  const renderMainView = () => {
    switch (activeSection) {
      case 'vouchedge_intro':
        if (hasRealAuthToken()) {
          return <TodayDashboard onSectionChange={navigateSection} savedSlips={savedSlips} profile={profile} isLoggedIn={hasRealAuthToken()} />;
        }
        return (
          <VouchEdgeTerminalPage
            onAuthed={handleLoginSuccess}
          />
        );
      case 'welcome':
      case 'island':
        return (
          <EdgeIslandPage
            onSectionChange={navigateSection}
            savedSlips={savedSlips}
            profile={profile}
            isLoggedIn={hasRealAuthToken()}
          />
        );
      case 'today':
        return <TodayDashboard onSectionChange={navigateSection} savedSlips={savedSlips} profile={profile} isLoggedIn={hasRealAuthToken()} />;
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
            onDeletePost={handleDeletePost}
            profile={profile}
            onSectionChange={navigateSection}
          />
        );
      case 'build':
        return (
          <ParlayCommandCenter
            savedSlips={savedSlips}
            liveGames={liveGames}
            onSectionChange={navigateSection}
            onAddLegToParlay={handleAddLegFromResearch}
            onSaveVouch={handleSaveVouch}
            onPostCreated={handlePostCreated}
            initialPanel="build"
            onSaveParlay={handleSaveParlaySlip}
            onHideParlay={handleHideSavedParlay}
          />
        );
      case 'ai_pilot':
        return (
          <AiPilotPage
            onSectionChange={navigateSection}
            onSaveParlay={handleSaveParlaySlip}
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

      // 'daily_hr_watch_new' was the legacy HR page's section id. Kept here
      // (rather than removed outright) so any stale bookmark/localStorage
      // value from before this merge still resolves to the real page
      // instead of hitting the "View not found" fallback below.
      case 'daily_hr_watch_new':
      case 'hr_board':
        return (
          <HomeRunIntelligencePage />
        );
      case 'mlb_stats':
        return (
          <Suspense fallback={null}>
            <MlbStatHubPage />
          </Suspense>
        );
      case 'daily_players':
        return <DailyPlayersPage onSectionChange={navigateSection} />;
      case 'live_parlays':
        return (
          <ParlayCommandCenter
            key="live_parlays"
            savedSlips={savedSlips}
            liveGames={liveGames}
            onSectionChange={navigateSection}
            onAddLegToParlay={handleAddLegFromResearch}
            onSaveVouch={handleSaveVouch}
            onPostCreated={handlePostCreated}
            initialPanel="live"
            onSaveParlay={handleSaveParlaySlip}
            onHideParlay={handleHideSavedParlay}
          />
        );
      case 'live_game_lab':
        return (
          <ProAccessGate profile={profile} featureName="Live Game Lab" onNavigatePremium={() => navigateSection('premium')}>
            <LiveGameLabPage />
          </ProAccessGate>
        );
      case 'pro_command_center':
        return (
          <ProAccessGate
            profile={profile}
            featureName="VouchEdge Pro Command Center"
            onNavigatePremium={() => navigateSection('premium')}
          >
            <ProCommandCenterPage />
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
      case 'hitter_matchup_zones':
        return (
          <ProAccessGate profile={profile} featureName="Hitter Matchup Zones" onNavigatePremium={() => navigateSection('premium')}>
            <HitterMatchupZonesPage />
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
            onDeletePost={handleDeletePost}
            savedParlays={savedSlips}
            viewUserId={profileViewUserId}
            onClearViewUser={() => setProfileViewUserId(null)}
            onSectionChange={navigateSection}
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
              onDeletePost={handleDeletePost}
              savedParlays={savedSlips}
              viewUserId={profileViewUserId}
              onClearViewUser={() => setProfileViewUserId(null)}
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

  const isPublicFrontPage =
    (activeSection === 'welcome' && !hasRealAuthToken())
    || (activeSection === 'vouchedge_intro' && !hasRealAuthToken());
  const showGlobalAppChrome = !isPublicFrontPage;

  return (
    <ThemeProvider profile={profile} onUpdateProfile={handleUpdateProfile}>
      <VouchEdgeBootGate enabled={!['welcome', 'vouchedge_intro'].includes(activeSection) && hasRealAuthToken()}>
        <div className="z8-app-shell ve-motion-shell ve-theme-transition font-z8">
        <div className="ve-motion-bg" aria-hidden="true">
          <div className="ve-motion-grid" />
          <div className="ve-motion-noise" />
          <div className="ve-motion-spotlight" />
          <div className="ve-motion-orb ve-motion-orb-a" />
          <div className="ve-motion-orb ve-motion-orb-b" />
          <div className="ve-motion-orb ve-motion-orb-c" />
        </div>

        <div className="ve-motion-content">
          {loggingOut && <GoodbyeScreen />}
          <AppErrorBoundary resetKey={activeSection} onBackHome={() => navigateSection('today')}>
        {/* Desktop only — on mobile this is rendered inline inside each page's
            own compact header (see HomeFeedLayout.tsx) instead of floating
            fixed over content, since a fixed corner badge collided with
            whatever page content happened to scroll underneath it. */}
        <div className="hidden md:block">
          <AuthStatusBadge
            hideGuest={activeSection === 'welcome' || activeSection === 'vouchedge_intro'}
            onLoginSuccess={handleLoginSuccess}
            onLogoutComplete={handleLogoutComplete}
          />
        </div>
        <HomeFeedLayout
          activeSection={activeSection}
          onSectionChange={navigateSection}
          posts={posts}
          profile={profile}
          savedVouchIds={savedVouchIds}
          onSaveVouch={handleSaveVouch}
          activeLegs={activeLegs}
          savedSlips={savedSlips}
          onAuthLoginSuccess={handleLoginSuccess}
          onAuthLogoutComplete={handleLogoutComplete}
          isRouteSwitching={isPendingRoute}
          isPublicFrontPage={isPublicFrontPage}
        >
          <Suspense fallback={<div className="ve-route-suspense-fallback" aria-hidden="true" />}>
            {renderMainView()}
          </Suspense>
        </HomeFeedLayout>
        {/* Mobile Home + Edge Island launcher cluster */}
        {showGlobalAppChrome && (
          <div className="ve-mobile-fab-cluster fixed z-[60] flex items-center gap-2.5 md:bottom-8 md:right-8 md:gap-0">
            <button
              type="button"
              onClick={() => navigateSection('feed')}
              aria-label="Go to Home Feed"
              title="Home Feed"
              className={`ve-edge-island-trigger z8-interactive flex h-11 w-11 items-center justify-center rounded-full md:hidden ${
                activeSection === 'feed' ? 'border-vouch-emerald/70' : ''
              }`}
            >
              <Home className="ve-edge-island-trigger-icon h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => navigateSection('board')}
              aria-label="Go to Vouch Board"
              title="Vouch Board"
              className={`ve-edge-island-trigger z8-interactive flex h-11 w-11 items-center justify-center rounded-full md:hidden ${
                activeSection === 'board' ? 'border-vouch-emerald/70' : ''
              }`}
            >
              <Plus className="ve-edge-island-trigger-icon h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setEdgeIslandOpen(true)}
              aria-label="Open The Edge Island"
              title="The Edge Island"
              className="ve-edge-island-trigger z8-interactive flex h-11 w-11 items-center justify-center rounded-full md:h-12 md:w-12"
            >
              <EdgeIslandIcon className="ve-edge-island-trigger-icon h-4 w-4 md:h-5 md:w-5" />
            </button>
          </div>
        )}

        {showGlobalAppChrome && (
          <Suspense fallback={null}>
            <EdgeIslandCommandCenter
              open={edgeIslandOpen}
              onClose={() => setEdgeIslandOpen(false)}
              onSectionChange={navigateSection}
              onNavigateProfile={navigateToUserProfile}
              savedSlips={savedSlips}
              profile={profile}
              isLoggedIn={hasRealAuthToken()}
            />
          </Suspense>
        )}
          </AppErrorBoundary>
        </div>
        </div>
      </VouchEdgeBootGate>
    </ThemeProvider>
  );
}
