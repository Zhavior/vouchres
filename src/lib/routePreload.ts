import { routeModules } from './routeModules';

const preloaded = new Set<string>();

/**
 * Cheap intent-based preload for likely next lazy routes.
 *
 * Section aliases live here; actual module paths live exclusively in
 * routeModules.ts so preloading cannot drift from routed modules.
 */
/**
 * A section maps to one loader, or to several when its page reveals a nested
 * lazy chunk immediately on open. Warming only the outer chunk there would show
 * the page shell first and the panel's skeleton a moment later.
 */
type SectionLoader = (() => Promise<unknown>) | Array<() => Promise<unknown>>;

const SECTION_LOADERS: Record<string, SectionLoader> = {
  feed: routeModules.homeFeed,
  following: routeModules.following,

  today: routeModules.todayDashboard,
  welcome: routeModules.todayDashboard,
  island: routeModules.todayDashboard,

  vouchedge_intro: routeModules.vouchEdgeTerminal,
  legacy_studio: routeModules.aisLanding,

  brain_picks: routeModules.brainPicks,
  brain_performance: routeModules.brainPerformance,


  mlb_stats: routeModules.mlbStats,
  daily_players: routeModules.dailyPlayers,
  live_games: routeModules.liveGames,

  intel: routeModules.brainEdge,
  pro_graphs_lab: routeModules.brainEdge,

  live_parlays: routeModules.parlayOs,
  build: routeModules.parlayOs,
  // Opens straight onto the Track Record tab, which lazy-loads ResultsStudio.
  // Both chunks warm together so the tab does not render a second skeleton.
  results: [routeModules.parlayOs, routeModules.results],

  board: routeModules.vouchBoard,
  research: routeModules.research,
  profile: routeModules.profile,

  ai_engine: routeModules.smartAiEngine,
  ai_pilot: routeModules.aiPilot,

  notifications: routeModules.notifications,
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

/** Statically composed in MainViewRouter — never prefetch or idle-warm these. */
export const EAGER_HR_SECTIONS = new Set(['hr_max', 'aurora_hr_hq', 'aurora_daily_slate', 'hr_v10', 'hr_board', 'daily_hr_watch_new']);

export function isEagerHrSection(section: string): boolean {
  return EAGER_HR_SECTIONS.has(section);
}

const WARM_NEIGHBORS: Record<string, string[]> = {
  feed: ['today'],
  following: ['feed'],
  today: [],
  brain_picks: ['brain_performance'],
  brain_performance: ['brain_picks'],
  // build / live_parlays / results are one page now — nothing to warm.
  ai_engine: ['ai_pilot'],
  pro_command_center: ['player_edge_lab'],
  profile: ['settings'],
  settings: ['profile'],
};

/** Heavy first-paint routes — do not compete with their own chunk/network work. */
const HEAVY_ROUTES = new Set([
  'hr_board',
  'hr_max',
  'aurora_hr_hq',
  'aurora_daily_slate',
  'hr_v10',
  'daily_players',
  'research',
  'live_games',
  'mlb_stats',
  'pitcher_matchup_intelligence',
  'hitter_matchup_zones',
  'live_parlays',
  'build',
]);

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
  if (isEagerHrSection(section)) return;
  const entry = SECTION_LOADERS[section];
  if (!entry || preloaded.has(section)) return;
  preloaded.add(section);

  const loaders = Array.isArray(entry) ? entry : [entry];
  void Promise.all(loaders.map((load) => load())).catch(() => {
    // Allow a later retry if any chunk fetch failed (deploy race / offline).
    preloaded.delete(section);
  });
}

/** Idle-warm likely next routes from the current section (and a small default set). */
export function warmLikelyRoutes(activeSection?: string): void {
  const run = () => {
    scheduleIdle(() => {
      if (!canWarmRoutes()) return;
      if (activeSection && HEAVY_ROUTES.has(activeSection)) return;

      const neighbors = activeSection ? WARM_NEIGHBORS[activeSection] ?? [] : [];
      const defaults = activeSection ? [] : ['today'];
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
