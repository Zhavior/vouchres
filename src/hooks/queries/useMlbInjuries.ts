/**
 * League-wide injury report, joined against the slate.
 *
 * The wire can tell you an injury story exists; it cannot tell you whether the
 * player is on your board, because wire mentions carry ESPN athlete ids rather
 * than MLBAM ids. `/api/mlb/injuries` carries a team abbreviation and a
 * position next to the name, which is enough to match a slate row.
 *
 * The match is deliberately strict: normalised full name AND team abbreviation
 * must both agree. A name-only match would attach the wrong Rodriguez to a
 * board row, and a wrong IL flag on a candidate is worse than no flag.
 */
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { apiClient } from '../../lib/apiClient';
import { visibilityAwareInterval } from '../../lib/queryVisibility';

export type InjuryAvailability = 'OUT' | 'IL' | 'DAY_TO_DAY' | 'QUESTIONABLE' | 'UNKNOWN';

export interface MlbInjuryRecord {
  id: string;
  playerName: string;
  position: string | null;
  teamAbbrev: string | null;
  teamName: string | null;
  status: string;
  designation: string | null;
  availability: InjuryAvailability;
  reportedAt: string | null;
  shortComment: string | null;
  longComment: string | null;
}

interface MlbInjuryResponse {
  injuries?: MlbInjuryRecord[];
  teamsReporting?: number;
  source?: string;
  fetchedAt?: string;
}

/** Lowercase, unaccented, punctuation-free. "Ronald Acuña Jr." -> "ronald acuna jr". */
export function normalizeInjuryName(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function joinKey(name: string, teamAbbrev: string | null | undefined): string {
  return `${normalizeInjuryName(name)}|${(teamAbbrev ?? '').toUpperCase()}`;
}

export function useMlbInjuries() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['mlb', 'injuries'],
    queryFn: () => apiClient.get<MlbInjuryResponse>('/api/mlb/injuries'),
    staleTime: 10 * 60_000,
    gcTime: 30 * 60_000,
    refetchInterval: () => visibilityAwareInterval(10 * 60_000),
  });

  const injuries = useMemo(() => data?.injuries ?? [], [data]);

  /** name+team -> record, for an O(1) lookup per board row. */
  const byPlayer = useMemo(() => {
    const map = new Map<string, MlbInjuryRecord>();
    for (const record of injuries) {
      map.set(joinKey(record.playerName, record.teamAbbrev), record);
    }
    return map;
  }, [injuries]);

  /**
   * The injury record for one slate row, or null. Both name and team must
   * match — see the strictness note at the top of this file.
   */
  const lookup = useMemo(
    () =>
      (playerName: string | null | undefined, teamAbbrev: string | null | undefined) => {
        if (!playerName || !teamAbbrev) return null;
        return byPlayer.get(joinKey(playerName, teamAbbrev)) ?? null;
      },
    [byPlayer],
  );

  return {
    injuries,
    lookup,
    teamsReporting: data?.teamsReporting ?? 0,
    isLoading,
    error: error instanceof Error ? error : null,
  };
}
