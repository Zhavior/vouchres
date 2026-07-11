import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";

export type LiveProgressLegInput = {
  id: string;
  gamePk?: string | null;
  playerId?: string | number | null;
  marketCode?: string | null;
  statTarget?: number | null;
};

export type LiveProgressLegResult = {
  id?: string;
  current: number | null;
  target: number;
  label: string;
  gameStatus?: string | null;
};

export function useParlaySlipLiveProgress(
  legs: LiveProgressLegInput[],
  options?: { enabled?: boolean; refetchInterval?: number | false },
) {
  const gradable = legs.filter(
    (leg) => leg.gamePk && leg.playerId && leg.marketCode,
  );

  return useQuery({
    queryKey: ["parlay-slip-live-progress", gradable.map((l) => `${l.id}:${l.gamePk}:${l.playerId}:${l.marketCode}`).join("|")],
    queryFn: async () => {
      if (gradable.length === 0) return [] as LiveProgressLegResult[];
      const payload = await apiClient.post<{ legs: LiveProgressLegResult[] }>(
        "/api/mlb/parlay-leg-progress",
        {
          legs: gradable.map((leg) => ({
            id: leg.id,
            gamePk: String(leg.gamePk),
            playerId: leg.playerId,
            marketCode: leg.marketCode,
            statTarget: leg.statTarget ?? 1,
          })),
        },
      );
      return payload?.legs ?? [];
    },
    enabled: (options?.enabled ?? true) && gradable.length > 0,
    staleTime: 12_000,
    refetchInterval: options?.refetchInterval ?? 20_000,
  });
}

export function liveProgressMap(results: LiveProgressLegResult[] | undefined): Map<string, LiveProgressLegResult> {
  const map = new Map<string, LiveProgressLegResult>();
  for (const row of results ?? []) {
    if (row.id) map.set(row.id, row);
  }
  return map;
}
