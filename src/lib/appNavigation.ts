export type AppSectionId =
  | 'mlb_stats'
  | 'daily_players'
  | 'live_parlays'
  | 'player_edge_lab'
  | 'team_matchup_lab'
  | 'pro_graphs_lab';

const SECTION_HASH: Record<AppSectionId, string> = {
  mlb_stats: '#mlb-stat-hub',
  daily_players: '#daily-players',
  live_parlays: '#live-parlays',
  player_edge_lab: '#player-edge-lab',
  team_matchup_lab: '#team-matchup-lab',
  pro_graphs_lab: '#pro-graphs-lab',
};

export function navigateToSection(section: AppSectionId) {
  window.location.hash = SECTION_HASH[section];
}
