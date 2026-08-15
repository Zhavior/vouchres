export const PRODUCT_WORKSPACE_IDS = ['today', 'research', 'track_record', 'account'] as const;

export type ProductWorkspaceId = (typeof PRODUCT_WORKSPACE_IDS)[number];

export type ProductWorkspace = {
  id: ProductWorkspaceId;
  label: string;
  description: string;
  defaultSection: string;
  sections: readonly string[];
};

export const PRODUCT_WORKSPACES: readonly ProductWorkspace[] = [
  {
    id: 'today',
    label: 'Today',
    description: 'The daily decision brief',
    defaultSection: 'today',
    sections: ['today', 'welcome', 'vouchedge_intro', 'island', 'legacy_studio'],
  },
  {
    id: 'research',
    label: 'Research',
    description: 'Verified MLB evidence and matchup context',
    defaultSection: 'research',
    sections: [
      'aurora_hr_hq', 'aurora_daily_slate', 'hr_board', 'hr_max', 'daily_hr_watch_new', 'daily_players', 'mlb_stats', 'research', 'player_research',
      'game_research', 'live_games', 'intel', 'player_edge_lab', 'pitcher_matchup',
      'pitcher_matchup_intelligence', 'team_matchup_lab', 'hitter_matchup', 'hitter_matchup_zones',
      'pro_graphs_lab', 'ai_pilot', 'ai_engine', 'brain_picks', 'brain_performance', 'nba_nfl',
      'pro_command_center',
    ],
  },
  {
    id: 'track_record',
    label: 'Track Record',
    description: 'Saved decisions and certified outcomes',
    defaultSection: 'results',
    sections: [
      'results', 'build', 'live_parlays', 'parlay_proof', 'notifications', 'board', 'feed',
      'following', 'leaderboard', 'most_vouched_today', 'most_vouched',
    ],
  },
  {
    id: 'account',
    label: 'Account',
    description: 'Profile, billing, privacy, and support',
    defaultSection: 'profile',
    sections: ['profile', 'subscriber_hub', 'premium', 'settings', 'customize', 'themestore', 'epic_themes'],
  },
] as const;

const WORKSPACE_BY_SECTION = new Map(
  PRODUCT_WORKSPACES.flatMap((workspace) => workspace.sections.map((section) => [section, workspace] as const)),
);

export function getProductWorkspace(section: string): ProductWorkspace {
  return WORKSPACE_BY_SECTION.get(section) ?? PRODUCT_WORKSPACES[0];
}

export function getPrimaryProductNavigation() {
  return PRODUCT_WORKSPACES.map(({ id, label, description, defaultSection }) => ({
    id,
    label,
    description,
    section: defaultSection,
  }));
}
