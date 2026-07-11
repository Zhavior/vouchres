import { apiUrl } from "./apiBase";
import { unwrapApiPayload } from "./apiEnvelope";

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

/** Direct MLB Stats API fallback is dev-only unless explicitly enabled. */
export function isMlbDirectFallbackAllowed(): boolean {
  return import.meta.env.DEV || import.meta.env.VITE_ALLOW_MLB_DIRECT_FALLBACK === "true";
}

export async function fetchSportsDataGatewayStatus(): Promise<SportsDataGatewayStatus> {
  const res = await fetch(apiUrl("/api/mlb/gateway/status"));
  if (!res.ok) throw new Error(`GET /api/mlb/gateway/status -> ${res.status}`);
  return unwrapApiPayload<SportsDataGatewayStatus>(await res.json());
}
