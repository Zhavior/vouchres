import { apiClient } from "./apiClient";
export { isMlbDirectFallbackAllowed } from "./mlbDirectFallbackPolicy";

export type DataProviderStatus = {
  id: string;
  label: string;
  configured: boolean;
};

export type SportsDataGatewayStatus = {
  gateway: string;
  providers: DataProviderStatus[];
  sportsHttp: {
    cacheSize?: number;
    maxCacheEntries?: number;
    inflight?: number;
  };
};

export async function fetchSportsDataGatewayStatus(): Promise<SportsDataGatewayStatus> {
  return apiClient.get<SportsDataGatewayStatus>("/api/mlb/gateway/status");
}
