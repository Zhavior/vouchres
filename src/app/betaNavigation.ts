export const FOCUSED_BETA_SHELL_ENABLED =
  import.meta.env.VITE_FOCUSED_BETA_SHELL !== 'false';

export const BETA_PRIMARY_DESTINATIONS = [
  { id: 'today', label: 'Today', section: 'today' },
  { id: 'research', label: 'Research', section: 'hr_board' },
  { id: 'track_record', label: 'Track Record', section: 'results' },
  { id: 'account', label: 'Account', section: 'profile' },
] as const;

export type BetaDestinationId = (typeof BETA_PRIMARY_DESTINATIONS)[number]['id'];

export function isAuroraHqFamilySection(section: string): boolean {
  return section === 'aurora_hr_hq' || section === 'aurora_daily_slate';
}

const RESEARCH_SECTIONS = new Set([
  'aurora_hr_hq',
  'aurora_daily_slate',
  'hr_board',
  'hr_max',
  'hr_v10',
  'daily_hr_watch_new',
  'daily_players',
  'mlb_stats',
  'research',
  'player_research',
  'game_research',
  'live_games',
  'player_edge_lab',
  'pitcher_matchup',
  'pitcher_matchup_intelligence',
  'team_matchup_lab',
  'hitter_matchup',
  'hitter_matchup_zones',
  'intel',
  'pro_graphs_lab',
  'ai_pilot',
  'ai_engine',
  'brain_picks',
  'brain_performance',
  'nba_nfl',
  'pro_command_center',
]);

const TRACK_RECORD_SECTIONS = new Set([
  'results',
  'build',
  'live_parlays',
  'parlay_proof',
  'notifications',
  'board',
  'feed',
  'following',
  'leaderboard',
  'most_vouched_today',
  'most_vouched',
]);

const ACCOUNT_SECTIONS = new Set([
  'profile',
  'premium',
  'settings',
  'subscriber_hub',
  'customize',
  'themestore',
  'epic_themes',
  'admin',
  'admin_hr_next',
  'admin_model_quality',
]);

const FOCUSED_BETA_SIDEBAR_FEATURES = new Set([
  'today',
  'today_next',
  'hr_board',
  'live_games',
  'results',
  'premium',
  'admin',
  'admin_hr_next',
]);

const FOCUSED_BETA_COMMAND_SECTIONS = new Set([
  'today',
  'today_next',
  'hr_board',
  'live_games',
  'results',
  'premium',
  'profile',
  'settings',
  'admin',
  'aurora_daily_slate',
  'admin_hr_next',
]);

export function isBetaDestinationActive(
  activeSection: string,
  destination: BetaDestinationId,
): boolean {
  if (destination === 'today') return activeSection === 'today' || activeSection === 'welcome' || activeSection === 'today_next';
  if (destination === 'research') return RESEARCH_SECTIONS.has(activeSection);
  if (destination === 'track_record') return TRACK_RECORD_SECTIONS.has(activeSection);
  return ACCOUNT_SECTIONS.has(activeSection);
}

export function isFocusedBetaSidebarFeature(featureId: string): boolean {
  return FOCUSED_BETA_SIDEBAR_FEATURES.has(featureId);
}

export function isFocusedBetaCommandSection(section: string): boolean {
  return FOCUSED_BETA_COMMAND_SECTIONS.has(section);
}
