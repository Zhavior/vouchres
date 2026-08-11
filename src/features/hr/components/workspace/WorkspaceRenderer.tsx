import type { WorkspaceView } from "./types";
import type { HrWatchRow } from "../../types/hrWatch";
import type { HrCardResult } from "../Cards/HrPlayerCard";

import OverviewView from "./views/OverviewView";
import EdgeDeskView from "./views/EdgeDeskView";
import SlateStacksView from "./views/SlateStacksView";
import ProjectionMatrixView from "./views/ProjectionMatrixView";
import MatchupExtremesView from "./views/MatchupExtremesView";

export interface WorkspaceRendererProps {
  workspace: WorkspaceView;
  rows: HrWatchRow[];
  getHrResult?: (playerId: string | number | null) => HrCardResult;
  children: React.ReactNode;
}

export default function WorkspaceRenderer({
  workspace,
  rows,
  getHrResult,
  children,
}: WorkspaceRendererProps) {
  const safeRows = rows || [];

  switch (workspace) {
    case "overview":
      return <OverviewView>{children}</OverviewView>;

    case "edge":
      return <EdgeDeskView rows={safeRows} getHrResult={getHrResult} />;

    case "stacks":
      return <SlateStacksView rows={safeRows} getHrResult={getHrResult} />;

    case "matrix":
      return <ProjectionMatrixView rows={safeRows} getHrResult={getHrResult} />;

    case "extremes":
      return <MatchupExtremesView rows={safeRows} getHrResult={getHrResult} />;

    default:
      return <OverviewView>{children}</OverviewView>;
  }
}
