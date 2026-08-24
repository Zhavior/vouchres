/**
 * Live telemetry for the public V4 landing.
 *
 * The landing advertises itself as `LIVE MODEL // MLB HR INTELLIGENCE` but
 * every number under that banner was a hardcoded literal — Elite_Candidates
 * read 14 while the board was returning 27. Both endpoints below already
 * answer unauthenticated, so no new backend surface was needed.
 *
 * Nothing here falls back to a placeholder number. A value is either what the
 * API returned or `null`, which the UI renders as a dash. A landing whose whole
 * claim is "we record what the model actually knew" cannot print a figure the
 * model did not produce.
 */
import { useEffect, useState } from 'react';

export interface LandingCandidate {
  playerId: number;
  playerName: string;
  teamAbbrev: string;
  opponent: string;
  venue: string | null;
  hrScore: number | null;
  confidenceTier: string | null;
  dataConfidence: number | null;
  barrelRate: number | null;
  avgExitVelo: number | null;
}

export interface LandingTelemetry {
  gamesActive: number | null;
  lineupsSynced: string | null;
  eliteCandidates: number | null;
  modelStatus: string | null;
  generatedAt: string | null;
  contractVersion: string | null;
  topCandidates: LandingCandidate[];
  isLoading: boolean;
  isError: boolean;
}

const EMPTY: Omit<LandingTelemetry, 'isLoading' | 'isError'> = {
  gamesActive: null,
  lineupsSynced: null,
  eliteCandidates: null,
  modelStatus: null,
  generatedAt: null,
  contractVersion: null,
  topCandidates: [],
};

function num(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

type Snapshot = { data: typeof EMPTY; isError: boolean };

/*
 * Both the telemetry strip and the command carousel read this, and they mount
 * together in the hero. Without a shared promise that is four requests for two
 * answers, and the two panels can disagree if the board ticks between them.
 */
let inFlight: Promise<Snapshot> | null = null;
let cached: Snapshot | null = null;

async function fetchSnapshot(): Promise<Snapshot> {
  {
    {
      try {
        // Settled rather than awaited together: one feed being down should not
        // blank the numbers the other one can still answer for.
        const [lineup, board] = await Promise.allSettled([
          fetch('/api/mlb/lineup/today').then((r) => r.json()),
          fetch('/api/mlb/hr-board/today').then((r) => r.json()),
        ]);

        const l = lineup.status === 'fulfilled' && lineup.value?.ok ? lineup.value : null;
        const b = board.status === 'fulfilled' && board.value?.ok ? board.value : null;

        const rawCandidates: unknown[] = Array.isArray(b?.candidates) ? b.candidates : [];
        const elite = rawCandidates.filter(
          (c) => (c as { confidenceTier?: string })?.confidenceTier === 'elite',
        );

        const topCandidates: LandingCandidate[] = [...rawCandidates]
          .sort((a, z) => (num((z as any)?.hrScore) ?? 0) - (num((a as any)?.hrScore) ?? 0))
          .slice(0, 4)
          .map((c) => {
            const r = c as Record<string, unknown>;
            return {
              playerId: num(r.playerId) ?? 0,
              playerName: str(r.playerName) ?? 'Unknown',
              teamAbbrev: str(r.teamAbbrev) ?? '',
              opponent: str(r.opponent) ?? '',
              venue: str(r.venue),
              hrScore: num(r.hrScore),
              confidenceTier: str(r.confidenceTier),
              dataConfidence: num(r.dataConfidence),
              barrelRate: num(r.barrelRate),
              avgExitVelo: num(r.avgExitVelo),
            };
          });

        const totalGames = num(l?.totalGames) ?? num(b?.gameCount);
        const totalPlayers = num(l?.totalPlayers);

        const data = {
          gamesActive: totalGames,
          // The board only treats a batter as confirmed once the official
          // lineup is posted, so this is a real ratio, not a decoration.
          lineupsSynced:
            totalPlayers != null && totalGames != null
              ? `${totalPlayers}/${totalGames * 18}`
              : null,
          eliteCandidates: b ? elite.length : null,
          modelStatus: str(b?.dataQuality)?.toUpperCase() ?? null,
          generatedAt: str(b?.generatedAt),
          contractVersion: str(b?.contractVersion),
          topCandidates,
        };
        return { data, isError: !l && !b };
      } catch {
        return { data: EMPTY, isError: true };
      }
    }
  }
}

export function useLandingTelemetry(): LandingTelemetry {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(cached);
  const [isLoading, setIsLoading] = useState(cached == null);

  useEffect(() => {
    if (cached) return;
    let alive = true;

    inFlight ??= fetchSnapshot().then((result) => {
      cached = result;
      inFlight = null;
      return result;
    });

    void inFlight.then((result) => {
      if (!alive) return;
      setSnapshot(result);
      setIsLoading(false);
    });

    return () => {
      alive = false;
    };
  }, []);

  return { ...(snapshot?.data ?? EMPTY), isLoading, isError: snapshot?.isError ?? false };
}
