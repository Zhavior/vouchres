export type AppSectionId =
  | 'hr_board'
  | 'daily_players'
  | 'live_parlays'
  | 'live_game_lab'
  | 'player_edge_lab'
  | 'team_matchup_lab'
  | 'pro_graphs_lab';

const SECTION_HASH: Record<AppSectionId, string> = {
  hr_board: '#hr-board',
  daily_players: '#daily-players',
  live_parlays: '#live-parlays',
  live_game_lab: '#live-game-lab',
  player_edge_lab: '#player-edge-lab',
  team_matchup_lab: '#team-matchup-lab',
  pro_graphs_lab: '#pro-graphs-lab',
};

export function navigateToSection(section: AppSectionId) {
  window.location.hash = SECTION_HASH[section];
}
