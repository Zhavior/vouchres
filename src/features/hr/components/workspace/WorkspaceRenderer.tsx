import type { ReactNode } from "react";
import type { WorkspaceView } from "./types";

import OverviewView from "./views/OverviewView";
import EdgeDeskView from "./views/EdgeDeskView";
import SlateStacksView from "./views/SlateStacksView";
import ProjectionMatrixView from "./views/ProjectionMatrixView";
import MatchupExtremesView from "./views/MatchupExtremesView";

export interface WorkspaceRendererProps {
  workspace: WorkspaceView;
  children: ReactNode;
}

export default function WorkspaceRenderer({
  workspace,
  children,
}: WorkspaceRendererProps) {
  switch (workspace) {
    case "overview":
      return <OverviewView>{children}</OverviewView>;

    case "edge":
      return <EdgeDeskView />;

    case "stacks":
      return <SlateStacksView />;

    case "matrix":
      return <ProjectionMatrixView />;

    case "extremes":
      return <MatchupExtremesView />;

    default:
      return <OverviewView>{children}</OverviewView>;
  }
}
