import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { vouchedgeApi } from '../../api/vouchedgeApi';
import { useLiveGames, type LiveGamesPayload } from '../../hooks/queries/useLiveGames';
import { useHrBoardToday } from '../../hooks/queries/useHrBoardToday';
import { logoByTeamId, logoByTeamName, teamAbbrByName, teamIdByName } from '../../lib/teamLogos';
import type { GameMatchup, HrWatch, LiveScore, MatchupTeam } from '../../types/matchup';
import type { HrBoardResponse } from '../../types/hrBoard';

export type LiveLensFilter = 'all' | 'live' | 'upcoming' | 'final';
export type LiveLensTruth = 'confirmed' | 'projected' | 'unavailable';

export interface LiveLensGame extends GameMatchup {
  hrWatchTruth: LiveLensTruth;
  source: 'official-live' | 'matchup-fallback';
}

type OfficialGame = LiveGamesPayload['games'][number];
type Candidate = Record<string, unknown>;

function record(value: unknown): Candidate {
  return value && typeof value === 'object' ? value as Candidate : {};
}

function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function number(value: unknown, fallback = 0): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function isLiveStatus(value: unknown): boolean {
  const status = String(value ?? '').toLowerCase();
  return /progress|live|in play|warmup|delayed/.test(status) || /\b(top|bottom|middle|end)\s+\d/.test(status);
}

function isFinalStatus(value: unknown): boolean {
  return /final|game over|completed/.test(String(value ?? '').toLowerCase());
}

function abbreviation(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  return words.length > 1
    ? words.map((word) => word[0]).join('').slice(0, 4).toUpperCase()
    : name.slice(0, 4).toUpperCase();
}

function officialTeam(name: string, side: 'away' | 'home'): MatchupTeam {
  const teamId = teamIdByName(name) ?? 0;
  return {
    teamId,
    name,
    abbreviation: teamAbbrByName(name) ?? abbreviation(name),
    logo: logoByTeamName(name) ?? '',
    record: null,
    seasonWinPct: 0,
    probablePitcher: null,
  };
}

function fromOfficial(game: OfficialGame): LiveLensGame | null {
  const gamePk = number(game.id, 0);
  if (!gamePk) return null;
  const status = text(game.status, 'Scheduled');
  const awayName = text(game.awayTeam, 'Away Team');
  const homeName = text(game.homeTeam, 'Home Team');
  return {
    gamePk,
    status,
    isLive: game.isLive ?? isLiveStatus(status),
    isFinal: game.isFinal ?? isFinalStatus(status),
    gameTime: text(game.gameDate),
    venue: text(game.venue, 'Venue pending'),
    away: officialTeam(awayName, 'away'),
    home: officialTeam(homeName, 'home'),
    score: { away: number(game.awayScore), home: number(game.homeScore) },
    winProbability: { away: 0, home: 0 },
    winProbModel: [],
    runEnvironment: null,
    topHrWatch: [],
    keyFactors: [],
    whatToWatch: [],
    aiVerdict: 'Official MLB game identity loaded. Additional research appears only when backed data is available.',
    dataQuality: 'limited',
    hrWatchTruth: 'unavailable',
    source: 'official-live',
  };
}

function candidateRows(board: HrBoardResponse | undefined) {
  if (!board) return { confirmed: [] as Candidate[], projected: [] as Candidate[] };
  const confirmed = Array.isArray(board.confirmedCandidates) ? board.confirmedCandidates.map(record) : [];
  const projectedSource = Array.isArray(board.projectedCandidates)
    ? board.projectedCandidates
    : Array.isArray(board.allProjectedCandidates) ? board.allProjectedCandidates : [];
  return { confirmed, projected: projectedSource.map(record) };
}

function watchFromCandidate(candidate: Candidate): HrWatch {
  const playerId = number(candidate.playerId ?? candidate.id, 0);
  const playerName = text(candidate.playerName ?? candidate.name, 'Unknown Player');
  return {
    playerId,
    playerName,
    headshot: text(candidate.headshot ?? candidate.headshotUrl, `https://img.mlbstatic.com/mlb-photos/image/upload/w_120,q_auto:best/v1/people/${playerId}/headshot/67/current`),
    team: text(candidate.team, 'TBD'),
    teamAbbr: text(candidate.teamAbbrev ?? candidate.team, 'TBD'),
    hrEdge: number(candidate.hrScore ?? candidate.hrEdge),
    grade: text(candidate.grade ?? candidate.riskTier, 'Watch'),
    formTag: text(candidate.formTag, 'Average'),
    opposingPitcher: text(candidate.opponentPitcherName ?? candidate.opponentPitcher ?? candidate.pitcherName, 'Pitcher pending'),
    reason: Array.isArray(candidate.reasons) ? text(candidate.reasons[0]) : text(candidate.reason),
    impliedOdds: text(candidate.impliedOdds ?? candidate.bestOdds, 'Odds TBD'),
  };
}

function groupWatches(rows: Candidate[]): Map<string, HrWatch[]> {
  const grouped = new Map<string, HrWatch[]>();
  for (const row of rows) {
    const gamePk = number(row.gamePk ?? row.game_id, 0);
    if (!gamePk) continue;
    const watch = watchFromCandidate(row);
    if (!watch.playerId || watch.playerName === 'Unknown Player') continue;
    const key = String(gamePk);
    const list = grouped.get(key);
    if (list) list.push(watch);
    else grouped.set(key, [watch]);
  }
  for (const list of grouped.values()) list.sort((a, b) => b.hrEdge - a.hrEdge);
  return grouped;
}

function mergeTeamIdentity(official: MatchupTeam, enrichment: MatchupTeam | undefined): MatchupTeam {
  return {
    ...official,
    teamId: enrichment?.teamId || official.teamId,
    logo: official.logo || enrichment?.logo || logoByTeamId(enrichment?.teamId ?? 0) || '',
    record: enrichment?.record ?? official.record,
    seasonWinPct: enrichment?.seasonWinPct ?? official.seasonWinPct,
    probablePitcher: enrichment?.probablePitcher ?? official.probablePitcher,
  };
}

function overlayGame(
  base: LiveLensGame,
  enrichment: GameMatchup | undefined,
  score: LiveScore | undefined,
  confirmed: Map<string, HrWatch[]>,
  projected: Map<string, HrWatch[]>,
): LiveLensGame {
  const key = String(base.gamePk);
  const confirmedWatches = confirmed.get(key) ?? [];
  const projectedWatches = projected.get(key) ?? [];
  const watches = confirmedWatches.length > 0
    ? confirmedWatches
    : projectedWatches.length > 0 ? projectedWatches : enrichment?.topHrWatch ?? [];
  const truth: LiveLensTruth = confirmedWatches.length > 0
    ? 'confirmed'
    : projectedWatches.length > 0 ? 'projected' : 'unavailable';
  const status = score?.status || base.status || enrichment?.status || 'Scheduled';

  return {
    ...base,
    status,
    isLive: score ? score.isLive || isLiveStatus(score.status) : base.isLive || enrichment?.isLive || isLiveStatus(status),
    isFinal: score ? score.isFinal || isFinalStatus(score.status) : base.isFinal || enrichment?.isFinal || isFinalStatus(status),
    score: score?.score ?? base.score,
    venue: enrichment?.venue || base.venue,
    away: mergeTeamIdentity(base.away, enrichment?.away),
    home: mergeTeamIdentity(base.home, enrichment?.home),
    winProbability: enrichment?.winProbability ?? base.winProbability,
    winProbModel: enrichment?.winProbModel ?? [],
    runEnvironment: enrichment?.runEnvironment ?? null,
    topHrWatch: watches.slice(0, 8),
    keyFactors: enrichment?.keyFactors ?? [],
    whatToWatch: enrichment?.whatToWatch ?? [],
    aiVerdict: enrichment?.aiVerdict ?? base.aiVerdict,
    dataQuality: enrichment?.dataQuality ?? base.dataQuality,
    hrWatchTruth: truth,
  };
}

function asFallback(game: GameMatchup): LiveLensGame {
  return {
    ...game,
    hrWatchTruth: game.topHrWatch.length > 0 ? 'projected' : 'unavailable',
    source: 'matchup-fallback',
  };
}

export function filterLiveLensGames(games: LiveLensGame[], filter: LiveLensFilter) {
  if (filter === 'live') return games.filter((game) => game.isLive);
  if (filter === 'final') return games.filter((game) => game.isFinal);
  if (filter === 'upcoming') return games.filter((game) => !game.isLive && !game.isFinal);
  return games;
}

export function buildLiveLensGames({
  officialGames,
  enrichments,
  scores,
  hrBoard,
}: {
  officialGames: OfficialGame[];
  enrichments: GameMatchup[];
  scores: LiveScore[];
  hrBoard: HrBoardResponse | undefined;
}) {
  const official = officialGames.map(fromOfficial).filter((game): game is LiveLensGame => game !== null);
  const enrichmentMap = new Map(enrichments.map((game) => [String(game.gamePk), game]));
  const scoreMap = new Map(scores.map((score) => [String(score.gamePk), score]));
  const rows = candidateRows(hrBoard);
  const confirmed = groupWatches(rows.confirmed);
  const projected = groupWatches(rows.projected);
  const source = official.length > 0 ? official : enrichments.map(asFallback);

  return source
    .map((game) => overlayGame(game, enrichmentMap.get(String(game.gamePk)), scoreMap.get(String(game.gamePk)), confirmed, projected))
    .sort((a, b) => {
      const liveDelta = Number(b.isLive) - Number(a.isLive);
      if (liveDelta) return liveDelta;
      const finalDelta = Number(a.isFinal) - Number(b.isFinal);
      if (finalDelta) return finalDelta;
      return Date.parse(a.gameTime || '') - Date.parse(b.gameTime || '');
    });
}

export function useLiveGamesLens() {
  const liveQuery = useLiveGames();
  const hrQuery = useHrBoardToday(80);
  const matchupQuery = useQuery({
    queryKey: ['live-games-lens', 'matchups'],
    queryFn: () => vouchedgeApi.matchupsToday(),
    staleTime: 90_000,
    refetchInterval: 180_000,
    retry: 1,
  });
  const scoreQuery = useQuery({
    queryKey: ['live-games-lens', 'scores'],
    queryFn: () => vouchedgeApi.scoresToday(),
    staleTime: 5_000,
    refetchInterval: 12_000,
    retry: 1,
  });

  const games = useMemo(() => {
    return buildLiveLensGames({
      officialGames: liveQuery.data?.games ?? [],
      enrichments: matchupQuery.data?.matchups ?? [],
      scores: scoreQuery.data?.scores ?? [],
      hrBoard: hrQuery.data,
    });
  }, [hrQuery.data, liveQuery.data?.games, matchupQuery.data?.matchups, scoreQuery.data?.scores]);

  const refresh = useCallback(async () => {
    await Promise.allSettled([liveQuery.refetch(), hrQuery.refetch(), matchupQuery.refetch(), scoreQuery.refetch()]);
  }, [hrQuery, liveQuery, matchupQuery, scoreQuery]);

  return {
    games,
    refresh,
    isLoading: liveQuery.isLoading && matchupQuery.isLoading,
    isRefreshing: liveQuery.isFetching || hrQuery.isFetching || matchupQuery.isFetching || scoreQuery.isFetching,
    hasError: games.length === 0 && liveQuery.isError && matchupQuery.isError,
    sourceLabel: liveQuery.data?.games?.length
      ? 'Official MLB schedule · live score overlay'
      : matchupQuery.data?.matchups?.length ? 'Verified matchup fallback' : 'Waiting for MLB data',
  };
}
