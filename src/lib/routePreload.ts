import { routeModules } from './routeModules';

const preloaded = new Set<string>();

/**
 * Cheap intent-based preload for likely next lazy routes.
 *
 * Section aliases live here; actual module paths live exclusively in
 * routeModules.ts so preloading cannot drift from routed modules.
 */
const SECTION_LOADERS: Record<string, () => Promise<unknown>> = {
  feed: routeModules.homeFeed,
  following: routeModules.following,

  today: routeModules.todayDashboard,
  welcome: routeModules.todayDashboard,
  island: routeModules.todayDashboard,

  vouchedge_intro: routeModules.vouchEdgeTerminal,
  legacy_studio: routeModules.aisLanding,

  hr_board: routeModules.hrBoard,
  daily_hr_watch_new: routeModules.hrBoard,
  hr_aurora_max: () => Promise.resolve(),

  brain_picks: routeModules.brainPicks,
  brain_performance: routeModules.brainPerformance,

  mlb_stats: routeModules.mlbStats,
  daily_players: routeModules.dailyPlayers,
  live_games: routeModules.liveGames,

  intel: routeModules.brainEdge,
  pro_graphs_lab: routeModules.brainEdge,

  live_parlays: routeModules.parlayOs,
  build: routeModules.parlayOs,

  board: routeModules.vouchBoard,
  research: routeModules.research,
  profile: routeModules.profile,

  ai_engine: routeModules.smartAiEngine,
  ai_pilot: routeModules.aiPilot,

  notifications: routeModules.notifications,
  results: routeModules.results,
  leaderboard: routeModules.leaderboard,

  settings: routeModules.settings,
  premium: routeModules.premium,
  customize: routeModules.customize,

  subscriber_hub: routeModules.subscriberHub,
  nba_nfl: routeModules.nbaNflArena,

  pro_command_center: routeModules.proCommandCenter,
  player_edge_lab: routeModules.playerEdgeLab,

  team_matchup_lab: routeModules.pitcherMatchup,
  pitcher_matchup_intelligence: routeModules.pitcherMatchup,
  pitcher_matchup: routeModules.pitcherMatchup,

  hitter_matchup_zones: routeModules.hitterMatchup,
  hitter_matchup: routeModules.hitterMatchup,

  most_vouched_today: routeModules.mostVouchedToday,
  most_vouched: routeModules.mostVouchedToday,
};

const WARM_NEIGHBORS: Record<string, string[]> = {
  feed: ['today', 'hr_board'],
  following: ['feed'],
  today: ['hr_board'],
  hr_board: ['daily_players'],
  brain_picks: ['brain_performance'],
  brain_performance: ['brain_picks'],
  mlb_stats: ['hr_board'],
  daily_players: ['hr_board'],
  live_parlays: ['build'],
  build: ['live_parlays'],
  ai_engine: ['ai_pilot'],
  pro_command_center: ['player_edge_lab'],
  profile: ['settings'],
  settings: ['profile'],
};

/** Heavy first-paint routes — do not compete with their own chunk/network work. */
const HEAVY_ROUTES = new Set([
  'hr_board',
  'daily_players',
  'research',
  'live_games',
  'mlb_stats',
  'pitcher_matchup_intelligence',
  'hitter_matchup_zones',
  'live_parlays',
  'build',
]);

const MAIN_ROUTER_KEY = '__main_router__';

function scheduleIdle(task: () => void, timeout = 2800): void {
  if (typeof window === 'undefined') return;
  const ric = window.requestIdleCallback;
  if (typeof ric === 'function') {
    ric(() => task(), { timeout });
    return;
  }
  window.setTimeout(task, Math.min(timeout, 600));
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
  const run = () => {
    scheduleIdle(() => {
      if (!canWarmRoutes()) return;
      preloadMainRouter();
      if (activeSection && HEAVY_ROUTES.has(activeSection)) return;

      const neighbors = activeSection ? WARM_NEIGHBORS[activeSection] ?? [] : [];
      const defaults = activeSection === 'today' ? ['hr_board'] : activeSection ? [] : ['today'];
      const candidates = [...new Set([...neighbors, ...defaults])]
        .filter((section) => section !== activeSection)
        .slice(0, 2);
      for (const section of candidates) {
        preloadSection(section);
      }
    }, 3200);
  };

  if (typeof window !== 'undefined' && document.readyState !== 'complete') {
    window.addEventListener('load', run, { once: true });
    return;
  }
  run();
}
