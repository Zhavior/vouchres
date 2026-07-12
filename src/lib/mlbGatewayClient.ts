import { apiClient } from "./apiClient";
export { isMlbDirectFallbackAllowed } from "./mlbDirectFallbackPolicy";

export type DataProviderStatus = {
  id: string;
  label: string;
  cost: string;
  authRequired: boolean;
  baseUrl?: string;
  capabilities: string[];
  trustNote?: string;
  configured: boolean;
};

export type SportsDataGatewayStatus = {
  gateway: string;
  mlbApiBase: string;
  providers: DataProviderStatus[];
  sportsHttp: Record<string, unknown>;
  architecture: {
    hrBoardCanonical: string;
    parlayReadModel: string;
    clientDirectMlbFallback: string;
  };
};

export async function fetchSportsDataGatewayStatus(): Promise<SportsDataGatewayStatus> {
  return apiClient.get<SportsDataGatewayStatus>("/api/mlb/gateway/status");
}
