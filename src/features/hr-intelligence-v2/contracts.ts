export const WORKSPACES = [
  { id: 'overview', label: 'Board', description: 'Ranked HR candidates' },
  { id: 'edge', label: 'Edge', description: 'Model vs market' },
  { id: 'stacks', label: 'Stacks', description: 'Team combinations' },
  { id: 'matrix', label: 'Matrix', description: 'Power vs matchup' },
  { id: 'extremes', label: 'Extremes', description: 'Slate outliers' },
] as const;

export type HrWorkspaceId = (typeof WORKSPACES)[number]['id'];

export const DISPLAY_TIERS = ['Elite', 'Strong', 'Watch', 'Sleepers'] as const;
export type DisplayTier = (typeof DISPLAY_TIERS)[number];

export const SOURCE_MODES = [
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'curated', label: 'Preview' },
  { id: 'all', label: 'All' },
] as const;
