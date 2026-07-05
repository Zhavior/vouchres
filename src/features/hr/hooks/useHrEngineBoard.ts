import { useMemo } from "react";
import { computeHrBoard } from "../lib/hr/computeHrBoard";

export function useHrEngineBoard(players: any[]) {
  return useMemo(() => {
    if (!players?.length) {
      return {
        elite: [],
        strong: [],
        watchlist: [],
      };
    }

    return computeHrBoard(players);
  }, [players]);
}
