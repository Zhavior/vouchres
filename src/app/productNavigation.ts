export const PRODUCT_WORKSPACE_IDS = ['today', 'intelligence', 'players', 'parlays', 'profile'] as const;

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
    description: 'Live slate, games, and daily decisions',
    defaultSection: 'today',
    sections: ['today', 'live_games', 'feed', 'following'],
  },
  {
    id: 'intelligence',
    label: 'HR Intelligence',
    description: 'Models, matchups, and verified evidence',
    defaultSection: 'hr_board',
    sections: [
      'hr_board', 'judge_home', 'brain_picks', 'brain_performance', 'mlb_stats', 'intel', 'player_edge_lab', 'team_matchup_lab',
      'hitter_matchup_zones', 'pro_graphs_lab', 'ai_pilot', 'ai_engine',
    ],
  },
  {
    id: 'players',
    label: 'Players',
    description: 'Search, compare, and monitor players',
    defaultSection: 'daily_players',
    sections: ['daily_players', 'research', 'player_research', 'game_research'],
  },
  {
    id: 'parlays',
    label: 'Parlays',
    description: 'Build, synchronize, track, and verify',
    defaultSection: 'live_parlays',
    sections: ['live_parlays', 'build', 'board', 'results', 'notifications', 'parlay_proof'],
  },
  {
    id: 'profile',
    label: 'Profile',
    description: 'Trust record, community, and account',
    defaultSection: 'profile',
    sections: ['profile', 'leaderboard', 'subscriber_hub', 'premium', 'settings', 'customize', 'themestore'],
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
