import { hasPersistedAuthSession } from '../lib/supabaseClient';

export const DEV_BYPASS_AUTH =
  import.meta.env.DEV && import.meta.env.VITE_DEV_BYPASS_AUTH === 'true';

export const PUBLIC_SECTIONS = new Set([
  'welcome',
  'vouchedge_intro',
  'legacy_studio',
  'feed',
  'following',
  'home',
  'daily_players',
  'live_games',
  'hr_board',
  'daily_hr_watch_new',
  'hr_max',
  'aurora_hr_hq',
  'aurora_daily_slate',
  'game_research',
  'research',
  'player_research',
  'top_cappers',
  'subscribers_club',
  'subscriber_club',
  'mlb_stats',
  'most_vouched_today',
  'most_vouched',
  // ParlayOS supports guest practice-mode building; saving prompts sign-in
  // (see backendSyncState: 'auth_required' in domain/parlayActions.ts).
  'build',
]);

export const SIGNED_IN_HOME = 'today';
export const FORCE_PUBLIC_LANDING_PATHS = new Set(['/vouchedge-preview', '/preview/vouchedge']);

export function shouldForcePublicLanding() {
  if (typeof window === 'undefined') return false;
  return FORCE_PUBLIC_LANDING_PATHS.has(window.location.pathname.toLowerCase());
}

/** Only poll live games while a view that consumes them is active. */
export const SECTIONS_USING_LIVE_GAMES = new Set([
  'today',
  'build',
  'live_parlays',
  'ai_engine',
  'live_games',
  'research',
  'game_research',
  'player_research',
]);

const PROTECTED_SECTIONS = new Set(['billing', 'admin']);

export function getSavedActiveSection(): string | null {
  try {
    return localStorage.getItem('vouchedge_active_section');
  } catch {
    return null;
  }
}

/** Retired alias ids */
const RETIRED_HR_PAGE_IDS = new Set([
  'hr_intel_v2',
  'hr_aurora_max',
]);

export function canonicalizeSection(section: string): string {
  if (RETIRED_HR_PAGE_IDS.has(section)) return 'hr_board';
  return section;
}

/** Logged-out users always land on the terminal intro — not Edge Island welcome. */
export function resolvePublicSection(section: string): string {
  section = canonicalizeSection(section);
  if (shouldForcePublicLanding()) return 'vouchedge_intro';
  if (hasRealAuthToken()) return section;
  if (section === 'welcome' || section === 'island') return 'vouchedge_intro';
  return section;
}

/** Signed-in users must never land on the public intro terminal. */
export function resolveAuthenticatedSection(section: string): string {
  section = canonicalizeSection(section);
  if (shouldForcePublicLanding()) return 'vouchedge_intro';
  if (DEV_BYPASS_AUTH) return section === 'vouchedge_intro' ? SIGNED_IN_HOME : section;
  if (!hasRealAuthToken()) return resolvePublicSection(section);
  if (section !== 'vouchedge_intro') return section;
  const saved = getSavedActiveSection();
  if (saved && saved !== 'vouchedge_intro') return canonicalizeSection(saved);
  return SIGNED_IN_HOME;
}

export function replaceLandingUrl(homeSection = SIGNED_IN_HOME) {
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

export function hasRealAuthToken() {
  return hasPersistedAuthSession();
}

export function saveActiveSection(section: string) {
  try {
    localStorage.setItem('vouchedge_active_section', canonicalizeSection(section));
  } catch {
    // ignore storage failures
  }
}

function requiresLogin(section: string) {
  if (PUBLIC_SECTIONS.has(section)) return false;
  return PROTECTED_SECTIONS.has(section);
}

export function resolveDevSectionFromLocation() {
  if (typeof window === 'undefined') return null;

  const pathname = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase().replace(/^#/, '');
  const target = hash || pathname;

  if (target === '' || target === '/') {
    return DEV_BYPASS_AUTH || hasRealAuthToken() ? SIGNED_IN_HOME : 'vouchedge_intro';
  }

  if (target === 'vouchres/vouchedge' || target === '/vouchres/vouchedge') {
    const section = DEV_BYPASS_AUTH || hasRealAuthToken() ? SIGNED_IN_HOME : 'vouchedge_intro';
    window.history.replaceState(null, '', DEV_BYPASS_AUTH || hasRealAuthToken() ? `/${section}` : '/vouchedge');
    return section;
  }

  if (
    target === 'vouchedge-preview' || target === '/vouchedge-preview' ||
    target === 'preview/vouchedge' || target === '/preview/vouchedge'
  ) {
    return 'vouchedge_intro';
  }

  if (
    target === 'vouchedge-intro' || target === '/vouchedge-intro' ||
    target === 'vouchedge' || target === '/vouchedge'
  ) {
    if (DEV_BYPASS_AUTH || hasRealAuthToken()) {
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
    if (!DEV_BYPASS_AUTH && !hasRealAuthToken()) {
      window.history.replaceState(null, '', '/');
      return 'vouchedge_intro';
    }
    return 'welcome';
  }

  if (
    target === 'legacy/welcome' || target === '/legacy/welcome' ||
    target === 'legacy/edge-island' || target === '/legacy/edge-island'
  ) {
    return 'vouchedge_intro';
  }

  if (target === 'legacy/studio' || target === '/legacy/studio') {
    return 'legacy_studio';
  }

  if (
    target === 'daily-hr-watch-new' || target === '/daily-hr-watch-new' ||
    target === 'hr-board' || target === '/hr-board' ||
    target === 'daily-hr-board' || target === '/daily-hr-board' ||
    target === 'hr_board' || target === '/hr_board' ||
    target === 'daily_hr_watch_new' || target === '/daily_hr_watch_new'
  ) {
    return 'hr_board';
  }

  if (
    target === 'hr-max' || target === '/hr-max' ||
    target === 'hr_max' || target === '/hr_max' ||
    target === 'hr-command-desk' || target === '/hr-command-desk'
  ) {
    return 'hr_max';
  }

  if (
    target === 'aurora-hr-hq' || target === '/aurora-hr-hq' ||
    target === 'aurora_hr_hq' || target === '/aurora_hr_hq'
  ) {
    return 'aurora_hr_hq';
  }

  if (
    target === 'aurora-daily-slate' || target === '/aurora-daily-slate' ||
    target === 'aurora_daily_slate' || target === '/aurora_daily_slate' ||
    target === 'daily-slate' || target === '/daily-slate'
  ) {
    return 'aurora_daily_slate';
  }

  if (target === 'daily-players' || target === '/daily-players') {
    return 'daily_players';
  }

  if (target === 'mlb-stat-hub' || target === '/mlb-stat-hub' || target === 'mlb-stats' || target === '/mlb-stats') {
    return 'mlb_stats';
  }

  if (
    target === 'player-research' || target === '/player-research' ||
    target === 'player_research' || target === '/player_research' ||
    target === 'aurora-max' || target === '/aurora-max'
  ) {
    return 'research';
  }

  if (target === 'intel' || target === '/intel' || target === 'mlb-intelligence' || target === '/mlb-intelligence') {
    return 'intel';
  }

  if (target === 'live-parlays' || target === '/live-parlays') {
    return 'live_parlays';
  }

  if (target === 'build' || target === '/build') {
    return 'build';
  }

  const proofMatch = pathname.match(/^\/p\/([0-9a-f-]{36})$/i);
  if (proofMatch?.[1]) {
    try {
      sessionStorage.setItem('vouchedge_proof_pick_id', proofMatch[1]);
    } catch {
      // ignore
    }
    return 'parlay_proof';
  }

  if (target === 'notifications' || target === '/notifications' || target === 'alerts' || target === '/alerts') {
    return 'notifications';
  }

  if (target === 'player-edge-lab' || target === '/player-edge-lab') {
    return 'player_edge_lab';
  }

  if (
    target === 'pitcher-matchup' || target === '/pitcher-matchup' ||
    target === 'pitcher-matchup-intelligence' || target === '/pitcher-matchup-intelligence' ||
    target === 'team-matchup-lab' || target === '/team-matchup-lab'
  ) {
    return 'pitcher_matchup_intelligence';
  }

  if (target === 'pro-graphs-lab' || target === '/pro-graphs-lab') {
    return 'ai_pilot';
  }

  if (target === 'brain-picks' || target === '/brain-picks' || target === 'brain_picks' || target === '/brain_picks') {
    return 'brain_picks';
  }

  if (target === 'brain-performance' || target === '/brain-performance' || target === 'brain_performance' || target === '/brain_performance') {
    return 'brain_performance';
  }

  if (target === 'live_games' || target === '/live_games' || target === 'live-projections' || target === '/live-projections') {
    return 'live_games';
  }

  // General fallback normalization for all valid section route names
  const clean = target.replace(/^\//, '').replace(/-/g, '_');
  if (clean === 'hr_intel_v2' || clean === 'hr_aurora_max') {
    return 'hr_board';
  }
  const validSections = new Set([
    'today', 'feed', 'following', 'build', 'ai_pilot', 'ai_engine', 'intel',
    'hr_board', 'daily_hr_watch_new', 'hr_max', 'aurora_hr_hq', 'aurora_daily_slate', 'brain_picks', 'brain_performance', 'mlb_stats', 'daily_players',
    'live_parlays', 'parlay_proof', 'pro_command_center', 'player_edge_lab',
    'pitcher_matchup_intelligence', 'team_matchup_lab', 'hitter_matchup_zones',
    'ai_pilot', 'live_games', 'research', 'board', 'leaderboard', 'results',
    'notifications', 'profile', 'nba_nfl', 'most_vouched_today', 'most_vouched',
    'premium', 'themestore', 'subscriber_hub', 'settings', 'customize', 'admin',
  ]);
  if (validSections.has(clean)) {
    return clean;
  }

  return null;
}

export function isPublicFrontPage(activeSection: string, isLoggedIn: boolean) {
  if (isLoggedIn) return false;
  return (
    activeSection === 'vouchedge_intro'
    || activeSection === 'edge_island_preview'
    || activeSection === 'legacy_studio'
  );
}

export { requiresLogin };
