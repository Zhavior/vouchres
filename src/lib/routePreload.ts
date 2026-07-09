const preloaded = new Set<string>();

/** Cheap intent-based preload for likely next lazy routes. Paths must match MainViewRouter lazy() imports. */
const SECTION_LOADERS: Record<string, () => Promise<unknown>> = {
  feed: () => import('../social/feed/HomeFeedPage'),
  today: () => import('../components/TodayDashboard'),
  welcome: () => import('../pages/EdgeIslandPage'),
  island: () => import('../pages/EdgeIslandPage'),
  vouchedge_intro: () => import('../pages/VouchEdgeTerminalPage'),
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
  results: () => import('../components/results/ResultsStudio'),
  leaderboard: () => import('../components/Leaderboard'),
  settings: () => import('../components/SettingsPage'),
  premium: () => import('../components/PremiumSubPage'),
  customize: () => import('../components/CustomizePage'),
  themestore: () => import('../components/ThemeStore'),
  epic_themes: () =>
    import('../components/vouchedge/EpicThemeShowcase').then((module) => ({
      default: module.EpicThemeShowcase,
    })),
  subscriber_hub: () => import('../components/SubscriberHub'),
  nba_nfl: () => import('../components/NbaNflArena'),
  live_game_lab: () => import('../pages/LiveGameLabPage'),
  pro_command_center: () => import('../pages/pro/ProCommandCenterPage'),
  player_edge_lab: () => import('../pages/pro/PlayerEdgeLabPage'),
  team_matchup_lab: () => import('../pages/pro/TeamMatchupLabPage'),
  hitter_matchup_zones: () => import('../pages/pro/HitterMatchupZonesPage'),
  pro_graphs_lab: () => import('../pages/pro/ProGraphsLabPage'),
};

export function preloadSection(section: string): void {
  const loader = SECTION_LOADERS[section];
  if (!loader || preloaded.has(section)) return;
  preloaded.add(section);
  void loader();
}
