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

  todayDashboard: () => import('../components/TodayDashboardZ8'),
  vouchEdgeTerminal: () => import('../pages/VouchEdgeTerminalPage'),
  vouchBoard: () => import('../components/VouchBoardZ8'),

  profile: () => import('../components/ProfilePageZ8'),
  settings: () => import('../components/SettingsPageZ8'),
  premium: () => import('../components/PremiumSubPage'),
  research: () => import('../components/PlayerResearchHub'),
  customize: () => import('../components/CustomizePage'),

  results: () => import('../components/results/ResultsStudio'),
  smartAiEngine: () => import('../components/SmartAiEngine'),

  brainEdge: () => import('../features/brain-edge/BrainEdgeLabPage'),
  leaderboard: () => import('../components/Leaderboard'),
  subscriberHub: () => import('../components/SubscriberHub'),

  brainPicks: () => import('../features/brain/BrainPicksPage'),
  brainPerformance: () =>
    import('../features/brain/BrainPerformancePage'),

  aiPilot: () => import('../features/ai/pages/AiPilotPage'),

  mlbStats: () =>
    import('../features/mlb-stats/pages/MlbStatHubPage'),

  dailyPlayers: () => import('../pages/DailyPlayersPageZ8'),
  liveGames: () => import('../components/LiveGamesProZ8'),

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
  hrV10: () => import('../features/hr-v2/pages/HrIntelligencePageV10').then(m => ({ default: m.HrIntelligencePageV10 })),
} as const;

export type RouteModuleKey = keyof typeof routeModules;
