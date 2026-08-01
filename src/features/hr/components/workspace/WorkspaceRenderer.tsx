import type { ReactNode } from "react";
import type { WorkspaceView } from "./types";
import type { HrWatchRow } from "../../types/hrWatch";

import OverviewView from "./views/OverviewView";
import EdgeDeskView from "./views/EdgeDeskView";
import SlateStacksView from "./views/SlateStacksView";
import ProjectionMatrixView from "./views/ProjectionMatrixView";
import MatchupExtremesView from "./views/MatchupExtremesView";

export interface WorkspaceRendererProps {
  workspace: WorkspaceView;
  rows: HrWatchRow[];
  children: React.ReactNode;
}

export default function WorkspaceRenderer({
  workspace,
  rows,
  children,
}: WorkspaceRendererProps) {
  switch (workspace) {
    case "overview":
      return <OverviewView>{children}</OverviewView>;

    case "edge":
      return <EdgeDeskView rows={rows} />;

    case "stacks":
      return <SlateStacksView rows={rows} />;

    case "matrix":
      return <ProjectionMatrixView rows={rows} />;

    case "extremes":
      return <MatchupExtremesView rows={rows} />;

    default:
      return <OverviewView>{children}</OverviewView>;
  }
}
