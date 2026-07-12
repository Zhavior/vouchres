const preloaded = new Set<string>();

/** Cheap intent-based preload for likely next lazy routes. Paths must match MainViewRouter lazy() imports. */
const SECTION_LOADERS: Record<string, () => Promise<unknown>> = {
  feed: () => import('../social/feed/HomeFeedPage'),
  following: () => import('../pages/FollowingHubPage'),
  today: () => import('../components/TodayDashboard'),
  welcome: () => import('../components/TodayDashboard'),
  island: () => import('../components/TodayDashboard'),
  vouchedge_intro: () => import('../pages/VouchEdgeTerminalPage'),
  legacy_studio: () => import('../components/AisLandingPage'),
  hr_board: () => import('../features/hr/pages/HomeRunIntelligencePage'),
  daily_hr_watch_new: () => import('../features/hr/pages/HomeRunIntelligencePage'),
  mlb_stats: () => import('../features/mlb-stats/pages/MlbStatHubPage'),
  daily_players: () => import('../pages/DailyPlayersPage'),
  live_games: () => import('../components/LiveGamesPro'),
  intel: () => import('../components/MlbIntelligenceHub'),
  live_parlays: () => import('../components/parlay/ParlayOsWorkspace'),
  build: () => import('../components/parlay/ParlayOsWorkspace'),
  board: () => import('../components/VouchBoard'),
  research: () => import('../components/PlayerResearchHub'),
  profile: () => import('../components/ProfilePage'),
  ai_engine: () => import('../components/SmartAiEngine'),
  ai_pilot: () => import('../features/ai/pages/AiPilotPage'),
  notifications: () => import('../components/notifications/NotificationsPage'),
  results: () => import('../components/results/ResultsStudio'),
  leaderboard: () => import('../components/Leaderboard'),
  settings: () => import('../components/SettingsPage'),
  premium: () => import('../components/PremiumSubPage'),
  customize: () => import('../components/CustomizePage'),
  subscriber_hub: () => import('../components/SubscriberHub'),
  nba_nfl: () => import('../components/NbaNflArena'),
  pro_command_center: () => import('../pages/pro/ProCommandCenterPage'),
  player_edge_lab: () => import('../pages/pro/PlayerEdgeLabPage'),
  team_matchup_lab: () => import('../pages/pro/TeamMatchupLabPage'),
  hitter_matchup_zones: () => import('../pages/pro/HitterMatchupZonesPage'),
  pro_graphs_lab: () => import('../pages/pro/ProGraphsLabPage'),
};

const WARM_NEIGHBORS: Record<string, string[]> = {
  feed: ['today', 'hr_board', 'live_parlays', 'following'],
  following: ['feed', 'subscriber_hub'],
  today: ['feed', 'hr_board', 'intel'],
  hr_board: ['today', 'mlb_stats', 'daily_players'],
  mlb_stats: ['hr_board', 'daily_players'],
  daily_players: ['hr_board', 'live_games'],
  live_parlays: ['build', 'ai_engine'],
  build: ['live_parlays', 'ai_engine'],
  ai_engine: ['ai_pilot', 'build'],
  pro_command_center: ['player_edge_lab', 'team_matchup_lab'],
  profile: ['settings', 'customize'],
  settings: ['profile', 'customize'],
};

const MAIN_ROUTER_KEY = '__main_router__';

function scheduleIdle(task: () => void): void {
  if (typeof window === 'undefined') return;
  const ric = window.requestIdleCallback;
  if (typeof ric === 'function') {
    ric(() => task(), { timeout: 1800 });
    return;
  }
  window.setTimeout(task, 250);
}

function canWarmRoutes(): boolean {
  if (typeof navigator === 'undefined' || document.visibilityState === 'hidden') return false;
  const connection = (navigator as Navigator & {
    connection?: { effectiveType?: string; saveData?: boolean };
  }).connection;
  if (connection?.saveData) return false;
  return !['slow-2g', '2g', '3g'].includes(connection?.effectiveType ?? '');
}

export function preloadSection(section: string): void {
  const loader = SECTION_LOADERS[section];
  if (!loader || preloaded.has(section)) return;
  preloaded.add(section);
  void loader().catch(() => {
    // Allow a later retry if the chunk fetch failed (deploy race / offline).
    preloaded.delete(section);
  });
}

/** Warm the MainViewRouter chunk so route switches don't wait on the router shell. */
export function preloadMainRouter(): void {
  if (preloaded.has(MAIN_ROUTER_KEY)) return;
  preloaded.add(MAIN_ROUTER_KEY);
  void import('../components/routing/MainViewRouter').catch(() => {
    preloaded.delete(MAIN_ROUTER_KEY);
  });
}

/** Idle-warm likely next routes from the current section (and a small default set). */
export function warmLikelyRoutes(activeSection?: string): void {
  scheduleIdle(() => {
    if (!canWarmRoutes()) return;
    preloadMainRouter();
    const neighbors = activeSection ? WARM_NEIGHBORS[activeSection] ?? [] : [];
    const defaults = ['feed', 'today', 'hr_board'];
    const candidates = [...new Set([...neighbors, ...defaults])]
      .filter((section) => section !== activeSection)
      .slice(0, 3);
    for (const section of candidates) {
      preloadSection(section);
    }
  });
}
