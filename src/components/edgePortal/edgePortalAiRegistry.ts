import type { EdgeAiTool } from './edgePortalTypes';

export const EDGE_AI_TOOLS: EdgeAiTool[] = [
  {
    id: 'summarize_today',
    title: "Summarize Today's Edge",
    description: 'Explain the slate, players, pitchers, and best board to open.',
    group: 'today',
    enabled: true,
    safeActionOnly: true,
  },
  {
    id: 'explain_page',
    title: 'Explain This Page',
    description: 'Help the user understand the current section.',
    group: 'today',
    enabled: true,
    safeActionOnly: true,
  },
  {
    id: 'open_feature',
    title: 'Guide Me Somewhere',
    description: 'Recommend and open the right VouchEdge tool.',
    group: 'build',
    enabled: true,
    safeActionOnly: true,
  },
  {
    id: 'build_parlay_plan',
    title: 'Build Parlay Plan',
    description: 'Suggest a safer parlay structure before saving.',
    group: 'build',
    enabled: true,
    requiresPro: true,
    safeActionOnly: true,
  },
];
