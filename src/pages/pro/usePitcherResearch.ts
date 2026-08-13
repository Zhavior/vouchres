import { useEffect, useState } from "react";
import { safeJsonFetch } from "../../api/safeApiClient";
import type { PitchMixRow } from "./usePlayerEdgeResearch";

export type PitcherSeasonLine = {
  homeRunsPer9: number;
  era: number;
  inningsPitched: number;
  strikeOuts: number;
  baseOnBalls: number;
  gamesStarted: number;
  gamesPitched: number;
  whip: number | null;
};

export type PitcherResearchPayload = {
  playerId: number;
  season: PitcherSeasonLine | null;
  pitchMix: PitchMixRow[];
  warnings: string[];
  dataSource: string;
  updatedAt: string;
};

type ResearchState = {
  data: PitcherResearchPayload | null;
  loading: boolean;
  error: string | null;
  source: "network" | "fallback";
};

const EMPTY: PitcherResearchPayload = {
  playerId: 0,
  season: null,
  pitchMix: [],
  warnings: [],
  dataSource: "official_mlb",
  updatedAt: "",
};

export function usePitcherResearch(playerId: string | number | null | undefined) {
  const [state, setState] = useState<ResearchState>({
    data: null,
    loading: false,
    error: null,
    source: "fallback",
  });

  const id = playerId != null && String(playerId).trim() !== "" ? String(playerId) : null;

  useEffect(() => {
    if (!id || id === "undefined" || id === "null") {
      setState({ data: null, loading: false, error: null, source: "fallback" });
      return;
    }

    let cancelled = false;
    const url = `/api/mlb/players/${encodeURIComponent(id)}/pitcher-research`;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    safeJsonFetch<PitcherResearchPayload>(url, {
      fallbackData: EMPTY,
      timeoutMs: 15000,
    }).then((result) => {
      if (cancelled) return;
      setState({
        data: result.ok && result.data.playerId > 0 ? result.data : null,
        loading: false,
        error: result.ok ? null : result.error || "Pitcher research feed unavailable",
        source: result.source,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [id]);

  return state;
}
