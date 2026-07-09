const preloaded = new Set<string>();

/** Cheap intent-based preload for likely next lazy routes. */
const SECTION_LOADERS: Record<string, () => Promise<unknown>> = {
  feed: () => import('../social/feed/HomeFeedPage'),
  today: () => import('../components/TodayDashboard'),
  welcome: () => import('../pages/EdgeIslandPage'),
  hr_board: () => import('../features/hr/pages/HomeRunIntelligencePage'),
  daily_hr_watch_new: () => import('../features/hr/pages/HomeRunIntelligencePage'),
  mlb_stats: () => import('../features/mlb-stats/pages/MlbStatHubPage'),
  daily_players: () => import('../pages/DailyPlayersPage'),
  live_games: () => import('../components/LiveGamesPro'),
  intel: () => import('../components/MlbIntelligenceHub'),
  live_parlays: () => import('../components/parlay/ParlayCommandCenter'),
  build: () => import('../components/parlay/ParlayCommandCenter'),
  board: () => import('../components/VouchBoard'),
  research: () => import('../components/PlayerResearchHub'),
  profile: () => import('../components/ProfilePage'),
  ai_engine: () => import('../components/SmartAiEngine'),
  ai_pilot: () => import('../features/ai/pages/AiPilotPage'),
  notifications: () => import('../components/notifications/NotificationsPage'),
};

export function preloadSection(section: string): void {
  const loader = SECTION_LOADERS[section];
  if (!loader || preloaded.has(section)) return;
  preloaded.add(section);
  void loader();
}
