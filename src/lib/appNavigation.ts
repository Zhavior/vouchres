export type AppSectionId =
  | 'hr_board'
  | 'live_game_lab'
  | 'player_edge_lab'
  | 'team_matchup_lab'
  | 'pro_graphs_lab';

const SECTION_HASH: Record<AppSectionId, string> = {
  hr_board: '#hr-board',
  live_game_lab: '#live-game-lab',
  player_edge_lab: '#player-edge-lab',
  team_matchup_lab: '#team-matchup-lab',
  pro_graphs_lab: '#pro-graphs-lab',
};

export function navigateToSection(section: AppSectionId) {
  window.location.hash = SECTION_HASH[section];
}
