export type ResolutionStatus =
  | "RESOLVED"
  | "VOID"
  | "UNRESOLVED";

export interface ResolutionContract {
  market: string;
  version: string;
  publishedAt: string;
  officialSource: string;
}

export interface ResolutionResult {
  status: ResolutionStatus;
  contractVersion: string;
  resolvedAt: string;
  reason?: string;
  outcome?: "WIN" | "LOSS";
}
