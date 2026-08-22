/**
 * Canonical lazy module importers for routed application features.
 *
 * MainViewRouter owns rendering policy.
 * routePreload owns section aliases and warming policy.
 * This file owns the actual module paths so they cannot drift.
 */

export const routeModules = {
  following: () => import('../pages/FollowingHubPage'),
  homeFeed: () => import('../social/feed/HomeFeedPage'),
  news: () => import('../features/news/NewsHubPage'),
  nflTouchdown: () => import('../features/nfl-touchdown/pages/NflTouchdownPage'),

  todayDashboard: () => import('../components/TodayDashboardZ8'),
  vouchEdgeTerminal: () => import('../pages/VouchEdgeTerminalPage'),
  vouchBoard: () => import('../components/VouchBoardZ8'),

  profile: () => import('../components/ProfilePageZ8'),
  settings: () => import('../components/SettingsPageZ8'),
  premium: () => import('../components/PremiumSubPage'),
  research: () => import('../components/PlayerResearchHub'),
  customize: () => import('../components/CustomizePage'),

  smartAiEngine: () => import('../components/SmartAiEngine'),

  brainEdge: () => import('../features/brain-edge/BrainEdgeLabPage'),
  // Not a route of its own any more — this is the chunk behind Parlay OS's
  // Track Record tab, registered so the tab can be warmed with its page.
  results: () => import('../components/results/ResultsStudio'),
  leaderboard: () => import('../components/Leaderboard'),
  subscriberHub: () => import('../components/SubscriberHub'),


  brainPicks: () => import('../features/brain/BrainPicksPage'),
  brainPerformance: () =>
    import('../features/brain/BrainPerformancePage'),

  aiPilot: () => import('../features/ai/pages/AiPilotPage'),

  mlbStats: () =>
    import('../features/mlb-stats/pages/MlbStatHubPage'),

  dailyPlayers: () => import('../pages/DailyPlayersPageZ8'),
  liveGames: () => import('../features/live-games-next/pages/LiveGamesNextPage'),

  notifications: () =>
    import('../components/notifications/NotificationsPage'),

  playerEdgeLab: () =>
    import('../pages/pro/PlayerEdgeLabPageZ8'),

  pitcherMatchup: () =>
    import('../pages/pro/PitcherMatchupIntelligencePageZ8'),

  hitterMatchup: () =>
    import('../pages/pro/HitterMatchupZonesPageZ8'),

  proCommandCenter: () =>
    import('../pages/pro/ProCommandCenterPageZ8'),

  parlayOs: () =>
    import('../components/parlay/ParlayOsWorkspace'),

  parlayProof: () => import('../pages/ParlayProofPage'),

  nbaNflArena: () => import('../components/NbaNflArena'),
  aisLanding: () => import('../components/AisLandingPage'),

  mostVouchedToday: () =>
    import('../pages/MostVouchedTodayPageZ8'),

  auroraHq: () => import('../features/admin/AuroraHqShell'),
} as const;

export type RouteModuleKey = keyof typeof routeModules;
