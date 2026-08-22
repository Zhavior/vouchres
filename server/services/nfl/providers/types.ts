import type { TdBoardV2Snapshot } from "../contracts/tdBoardV2";

export type TdProviderCapability =
  | "schedule"
  | "depth_charts"
  | "injuries"
  | "red_zone_usage"
  | "player_props"
  | "team_totals";

export type TdProviderStatus = {
  provider: string;
  configured: boolean;
  capabilities: Record<TdProviderCapability, boolean>;
  warning?: string;
};

export interface TdBoardProvider {
  status(): TdProviderStatus;
  fetchBoard(input: { date: string; signal?: AbortSignal }): Promise<TdBoardV2Snapshot>;
}
