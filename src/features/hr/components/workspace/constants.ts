import type { WorkspaceTab } from "./types";

export const WORKSPACE_TABS: WorkspaceTab[] = [
  {
    id: "overview",
    label: "Overview",
    enabled: true,
    description: "Daily HR candidates & board",
  },
  {
    id: "edge",
    label: "Edge Desk",
    enabled: true,
    description: "Vegas odds & model +EV edge",
  },
  {
    id: "stacks",
    label: "Slate Stacks",
    enabled: true,
    description: "Team HR stack combinations",
  },
  {
    id: "matrix",
    label: "Projection Matrix",
    enabled: true,
    description: "2D Power vs Matchup scatter",
  },
  {
    id: "extremes",
    label: "Extremes",
    enabled: true,
    description: "Peak slate signals & outliers",
  },
];

