import { useEffect, useState } from 'react';
import { safeJsonFetch } from '../../api/safeApiClient';

export type PlayerGameLogRow = {
  date: string;
  opponentAbbr: string;
  opponentName: string;
  ab: number;
  hits: number;
  homeRuns: number;
  rbi: number;
  doubles: number;
  triples: number;
  totalBases: number;
  strikeOuts: number;
};

export type BatterVsPitcherRow = {
  ab: number;
  h: number;
  doubles: number;
  triples: number;
  hr: number;
  bb: number;
  k: number;
  avg: number | null;
  slg: number | null;
  ops: number | null;
  sampleSize: number;
};

export type StatcastQuality = {
  playerId: number;
  pa: number | null;
  xwoba: number | null;
  barrelPct: number | null;
  hardHitPct: number | null;
  avgExitVelo: number | null;
};

export type PlayerEdgeResearchPayload = {
  playerId: number;
  gameLog: PlayerGameLogRow[];
  batterVsPitcher: BatterVsPitcherRow | null;
  vsOpponent: PlayerGameLogRow[];
  statcast: StatcastQuality | null;
  warnings: string[];
  dataSource: string;
  updatedAt: string;
};

type ResearchState = {
  data: PlayerEdgeResearchPayload | null;
  loading: boolean;
  error: string | null;
  source: 'network' | 'fallback';
};

const EMPTY: PlayerEdgeResearchPayload = {
  playerId: 0,
  gameLog: [],
  batterVsPitcher: null,
  vsOpponent: [],
  statcast: null,
  warnings: [],
  dataSource: 'official_mlb',
  updatedAt: '',
};

export function usePlayerEdgeResearch(
  playerId: string | number | null | undefined,
  options?: { pitcherId?: number | null; opponent?: string | null },
) {
  const [state, setState] = useState<ResearchState>({
    data: null,
    loading: false,
    error: null,
    source: 'fallback',
  });

  const pitcherId = options?.pitcherId && options.pitcherId > 0 ? options.pitcherId : null;
  const opponent = options?.opponent?.trim() || null;
  const id = playerId != null && String(playerId).trim() !== '' ? String(playerId) : null;

  useEffect(() => {
    if (!id || id === 'undefined' || id === 'null') {
      setState({ data: null, loading: false, error: null, source: 'fallback' });
      return;
    }

    let cancelled = false;
    const params = new URLSearchParams();
    if (pitcherId) params.set('pitcherId', String(pitcherId));
    if (opponent) params.set('opponent', opponent);
    const qs = params.toString();
    const url = `/api/mlb/players/${encodeURIComponent(id)}/edge-research${qs ? `?${qs}` : ''}`;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    safeJsonFetch<PlayerEdgeResearchPayload>(url, {
      fallbackData: EMPTY,
      timeoutMs: 15000,
    }).then((result) => {
      if (cancelled) return;
      setState({
        data: result.ok ? result.data : null,
        loading: false,
        error: result.ok ? null : result.error || 'Player research feed unavailable',
        source: result.source,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [id, pitcherId, opponent]);

  return state;
}
