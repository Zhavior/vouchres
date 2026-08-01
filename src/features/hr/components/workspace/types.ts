export type WorkspaceView =
  | "overview"
  | "edge"
  | "stacks"
  | "matrix"
  | "extremes";

export interface WorkspaceTab {
  id: WorkspaceView;
  label: string;
  enabled: boolean;
  description?: string;
}
