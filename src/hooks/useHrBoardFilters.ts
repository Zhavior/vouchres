import { useCallback, useMemo, useState } from "react";
import type { HrBoardFilterState, HrBoardRow, SortKey } from "../types/hrBoard";

import type { HrBoardGame } from "../types/hrBoard";

const GRADE_RANK: Record<string, number> = { "A+": 6, A: 5, B: 4, C: 3, D: 2, F: 1 };

const DEFAULT_FILTERS: HrBoardFilterState = {
  team: "ALL",
  grade: "ALL",
  risk: "ALL",
  hotOnly: false,
  sneakyOnly: false,
  confirmedOnly: false,
  minPitcherVuln: 0,
  search: "",
  sortKey: "hrEdge",
};

function sortRows(rows: HrBoardRow[], key: SortKey): HrBoardRow[] {
  const arr = [...rows];

  switch (key) {
    case "grade":
      return arr.sort((a, b) => (GRADE_RANK[b.grade] ?? 0) - (GRADE_RANK[a.grade] ?? 0) || b.hrEdge - a.hrEdge);
    case "bestOdds":
      return arr.sort((a, b) => {
        const cleanOdds = (value: unknown) => {
          const parsed = Number.parseInt(String(value ?? "").replace(/[^-+0-9]/g, ""), 10);
          return Number.isFinite(parsed) ? parsed : -9999;
        };
        return cleanOdds(b.bestOdds) - cleanOdds(a.bestOdds);
      });
    case "lineupSpot":
      return arr.sort((a, b) => {
        const aSpot = typeof a.lineupSpot === "number" ? a.lineupSpot : 99;
        const bSpot = typeof b.lineupSpot === "number" ? b.lineupSpot : 99;
        return aSpot - bSpot;
      });
    case "vouchScore":
      return arr.sort((a, b) => b.vouchScore - a.vouchScore);
    case "pitcherVulnerability":
      return arr.sort((a, b) => b.pitcherVulnerability - a.pitcherVulnerability);
    case "dataConfidence":
      return arr.sort((a, b) => b.dataConfidence - a.dataConfidence);
    case "weatherBoost":
      return arr.sort((a, b) => b.weatherBoost - a.weatherBoost);
    default:
      return arr.sort((a, b) => b.hrEdge - a.hrEdge);
  }
}

export function useHrBoardFilters(games: HrBoardGame[], isVercelSafePartial: boolean) {
  const [filters, setFilters] = useState<HrBoardFilterState>(DEFAULT_FILTERS);

  const update = useCallback(
    (next: Partial<HrBoardFilterState>) => setFilters((f) => ({ ...f, ...next })),
    []
  );

  const filteredRows = useMemo(() => {
    const q = filters.search.trim().toLowerCase();

    return games
      .map((g) => {
        const rows = (g.rows ?? []).filter((r) => {
          if (filters.team !== "ALL" && r.team !== filters.team) return false;
          if (filters.grade !== "ALL" && r.grade !== filters.grade) return false;
          if (filters.risk !== "ALL" && r.riskLabel !== filters.risk) return false;
          if (!isVercelSafePartial && filters.hotOnly && r.formTag !== "Hot") return false;
          if (!isVercelSafePartial && filters.sneakyOnly && r.riskLabel !== "Sneaky") return false;
          if (!isVercelSafePartial && filters.confirmedOnly && r.projectionType !== "Confirmed") return false;
          if (r.pitcherVulnerability < filters.minPitcherVuln) return false;

          if (q && !`${r.playerName} ${r.team} ${r.opponent}`.toLowerCase().includes(q)) return false;

          return true;
        });

        return { ...g, rows: sortRows(rows, filters.sortKey) };
      })
      .filter((g) => (g.rows ?? []).length > 0);
  }, [filters, games, isVercelSafePartial]);

  return {
    filters,
    setFilters,
    update,
    filteredRows,
  };
}
