export const DEV_BYPASS_AUTH =
  import.meta.env.DEV && import.meta.env.VITE_DEV_BYPASS_AUTH === 'true';

/** Only the public marketing / login terminal is reachable while signed out. */
export const PUBLIC_SECTIONS = new Set(['vouchedge_intro']);

export const SIGNED_IN_HOME = 'today';

/** Only poll live games while a view that consumes them is active. */
export const SECTIONS_USING_LIVE_GAMES = new Set([
  'build',
  'live_parlays',
  'ai_engine',
  'live_games',
  'research',
  'game_research',
  'player_research',
]);

export function getSavedActiveSection(): string | null {
  try {
    return localStorage.getItem('vouchedge_active_section');
  } catch {
    return null;
  }
}

export function saveAfterAuthDestination(section: string) {
  try {
    localStorage.setItem('vouchedge_after_auth_destination', section);
  } catch {
    // ignore storage failures
  }
}

export function consumeAfterAuthDestination(): string | null {
  try {
    const dest = localStorage.getItem('vouchedge_after_auth_destination');
    localStorage.removeItem('vouchedge_after_auth_destination');
    return dest;
  } catch {
    return null;
  }
}

export function redirectToPublicIntro() {
  if (typeof window === 'undefined') return;
  window.history.replaceState(null, '', '/vouchedge');
}

/** Signed-out users are sent to the intro terminal; intended route is saved for post-login. */
export function gateSectionForAuth(section: string): string {
  if (hasRealAuthToken()) return section;
  if (PUBLIC_SECTIONS.has(section)) return section;
  saveAfterAuthDestination(section);
  redirectToPublicIntro();
  return 'vouchedge_intro';
}

/** Signed-in users must never land on the public intro terminal. */
export function resolveAuthenticatedSection(section: string): string {
  if (!hasRealAuthToken()) {
    return gateSectionForAuth(section);
  }
  if (section !== 'vouchedge_intro') return section;
  const saved = getSavedActiveSection();
  if (saved && saved !== 'vouchedge_intro') return saved;
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
  try {
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
        continue;
      }
    }
  } catch {
    return false;
  }

  return false;
}

export function saveActiveSection(section: string) {
  try {
    localStorage.setItem('vouchedge_active_section', section);
  } catch {
    // ignore storage failures
  }
}

export function requiresLogin(section: string) {
  return !PUBLIC_SECTIONS.has(section);
}

export function resolveDevSectionFromLocation() {
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
    return gateSectionForAuth('today');
  }

  if (
    target === 'welcome' || target === '/welcome' ||
    target === 'island' || target === '/island'
  ) {
    return gateSectionForAuth('welcome');
  }

  if (
    target === 'daily-hr-watch-new' || target === '/daily-hr-watch-new' ||
    target === 'hr-board' || target === '/hr-board' ||
    target === 'daily-hr-board' || target === '/daily-hr-board'
  ) {
    return gateSectionForAuth('hr_board');
  }

  if (target === 'daily-players' || target === '/daily-players') {
    return gateSectionForAuth('daily_players');
  }

  if (target === 'mlb-stat-hub' || target === '/mlb-stat-hub' || target === 'mlb-stats' || target === '/mlb-stats') {
    return gateSectionForAuth('mlb_stats');
  }

  if (target === 'intel' || target === '/intel' || target === 'mlb-intelligence' || target === '/mlb-intelligence') {
    return gateSectionForAuth('intel');
  }

  if (target === 'live-parlays' || target === '/live-parlays') {
    return gateSectionForAuth('live_parlays');
  }

  if (target === 'notifications' || target === '/notifications' || target === 'alerts' || target === '/alerts') {
    return gateSectionForAuth('notifications');
  }

  if (target === 'live-game-lab' || target === '/live-game-lab') {
    return gateSectionForAuth('live_game_lab');
  }

  if (target === 'player-edge-lab' || target === '/player-edge-lab') {
    return gateSectionForAuth('player_edge_lab');
  }

  if (target === 'team-matchup-lab' || target === '/team-matchup-lab') {
    return gateSectionForAuth('team_matchup_lab');
  }

  if (target === 'pro-graphs-lab' || target === '/pro-graphs-lab') {
    return gateSectionForAuth('pro_graphs_lab');
  }

  if (target === 'live_games' || target === '/live_games' || target === 'live-projections' || target === '/live-projections') {
    return gateSectionForAuth('live_games');
  }

  return null;
}

export function isPublicFrontPage(activeSection: string, isLoggedIn: boolean) {
  return activeSection === 'vouchedge_intro' && !isLoggedIn;
}
