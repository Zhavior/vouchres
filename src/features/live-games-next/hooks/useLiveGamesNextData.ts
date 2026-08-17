import { useCallback, useEffect, useMemo, useState } from 'react';
import { vouchedgeApi } from '../../../api/vouchedgeApi';
import { useLiveGames } from '../../../hooks/queries/useLiveGames';
import { useDailyHrBoard } from '../../hr/hooks/useDailyHrBoard';
import { todayISO } from '../../../hooks/queries/hrBoardQuery';
import type { GameMatchup, HrWatch } from '../../../types/matchup';
import type { MLBPlayer } from '../../../types';
import type { HrBoardResponse } from '../../../types/hrBoard';
import { logoByTeamId, logoByTeamName } from '../../../lib/teamLogos';
import { parseAmericanOdds } from '../../../lib/odds';
import {
  mergeMatchups,
  mergeOfficialLiveUpdates,
} from '../utils/liveGameMerge';

/*
 * Live Games — canonical data pipeline.
 * Same contracts as the Live Games page: official MLB live feed is the base,
 * the HR board enriches with signal rows, and the test-locked merge helpers
 * guarantee polling never reshuffles the slate and final always clears live.
 */

export type LiveGamesFilterTab = 'all' | 'live' | 'upcoming' | 'final';
export type LiveGamesFeedState = 'live' | 'reconnecting' | 'down';

type LiveGameApiCard = Awaited<ReturnType<typeof vouchedgeApi.liveGames>>['games'][number];

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {};
}

function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function num(value: unknown, fallback = 0): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function isLiveStatus(status: unknown): boolean {
  const value = String(status ?? '');
  return (
    /progress|live|in play|warmup|delayed/i.test(value) ||
    /\b(top|bottom|middle|end)\s+\d/.test(value) ||
    /\b\d+(st|nd|rd|th)\s+inning\b/.test(value)
  );
}

function isFinalStatus(status: unknown): boolean {
  return /final|game over|completed/i.test(String(status ?? ''));
}

function teamAbbr(name: string): string {
  const logo = logoByTeamName(name);
  if (logo) {
    const parts = name.split(/\s+/).filter(Boolean);
    return parts.length > 1 ? parts.map((part) => part[0]).join('').slice(0, 4).toUpperCase() : name.slice(0, 4).toUpperCase();
  }
  return name.split(/\s+/).filter(Boolean).map((part) => part[0]).join('').slice(0, 4).toUpperCase() || 'TBD';
}

function matchupFromLiveGame(game: LiveGameApiCard): GameMatchup {
  const status = text(game.status, 'Scheduled');
  const live = typeof game.isLive === 'boolean' ? game.isLive : isLiveStatus(status);
  const final = typeof game.isFinal === 'boolean' ? game.isFinal : isFinalStatus(status);
  const awayName = text(game.awayTeam, 'Away Team');
  const homeName = text(game.homeTeam, 'Home Team');

  return {
    gamePk: num(game.id, 0),
    status,
    isLive: live,
    isFinal: final,
    gameTime: text(game.gameDate, ''),
    venue: text(game.venue, 'Venue pending'),
    away: {
      teamId: 0,
      name: awayName,
      abbreviation: text(game.awayAbbr, teamAbbr(awayName)),
      logo: logoByTeamName(awayName) ?? '',
      record: null,
      seasonWinPct: 0,
      probablePitcher: null,
    },
    home: {
      teamId: 0,
      name: homeName,
      abbreviation: text(game.homeAbbr, teamAbbr(homeName)),
      logo: logoByTeamName(homeName) ?? '',
      record: null,
      seasonWinPct: 0,
      probablePitcher: null,
    },
    score: {
      away: num(game.awayScore, 0),
      home: num(game.homeScore, 0),
    },
    winProbability: { away: 0, home: 0 },
    winProbModel: ['Official MLB live stream active.'],
    runEnvironment: null,
    topHrWatch: [],
    keyFactors: ['Official MLB live schedule card.'],
    whatToWatch: live ? ['Game is live in progress.'] : ['Game scheduled.'],
    aiVerdict: game.predictionsAvailable ? 'Live predictions model synced.' : 'Official live card active.',
    dataQuality: 'limited',
  };
}

function watchFromCandidate(candidate: Record<string, unknown>): HrWatch {
  const playerId = num(candidate.playerId ?? candidate.id, 0);
  const playerName = text(candidate.playerName ?? candidate.name, 'Unknown Player');
  return {
    playerId,
    playerName,
    headshot: text(candidate.headshot, `https://img.mlbstatic.com/mlb-photos/image/upload/w_120,q_auto:best/v1/people/${playerId}/headshot/67/current`),
    team: text(candidate.team, 'TBD'),
    teamAbbr: text(candidate.teamAbbrev ?? candidate.team, 'TBD'),
    hrEdge: num(candidate.hrScore ?? candidate.hrEdge, 0),
    grade: text(candidate.grade ?? candidate.riskTier, 'B'),
    formTag: text(candidate.formTag, 'Average'),
    opposingPitcher: text(candidate.opponentPitcherName ?? candidate.opponentPitcher ?? candidate.pitcherName, 'Pitcher pending'),
    reason: Array.isArray(candidate.reasons) ? text(candidate.reasons[0], '') : '',
    impliedOdds: text(candidate.impliedOdds ?? candidate.bestOdds, 'Manual only'),
  };
}

function buildMatchupsFromHrBoard(board: HrBoardResponse): GameMatchup[] {
  const sourceRows = Array.isArray(board.rows) && board.rows.length > 0
    ? board.rows
    : Array.isArray(board.confirmedCandidates) && board.confirmedCandidates.length > 0
      ? board.confirmedCandidates
      : Array.isArray(board.projectedCandidates) && board.projectedCandidates.length > 0
        ? board.projectedCandidates
        : Array.isArray(board.allProjectedCandidates)
          ? board.allProjectedCandidates
          : [];
  const groups = new Map<string, Record<string, unknown>[]>();

  sourceRows.forEach((raw) => {
    const row = asRecord(raw);
    const key = String(row.gamePk ?? row.game_id ?? `${text(row.team, 'TBD')}-${text(row.opponent, 'TBD')}`);
    groups.set(key, [...(groups.get(key) ?? []), row]);
  });

  return Array.from(groups.entries()).map(([key, rows]) => {
    const first = rows[0] ?? {};
    const team = text(first.team, 'TBD');
    const opponent = text(first.opponent, 'TBD');
    const teamId = num(first.teamId, 0);
    const opponentTeamId = num(first.opponentTeamId, 0);
    const topHrWatch = rows
      .map(watchFromCandidate)
      .sort((a, b) => b.hrEdge - a.hrEdge)
      .slice(0, 6);

    return {
      gamePk: num(first.gamePk ?? key, Math.abs(key.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0))),
      status: text(first.status ?? first.gameStatus, text(first.lineupStatus, 'Projection preview')),
      isLive: /progress|live|in play/i.test(text(first.status ?? first.gameStatus, '')),
      isFinal: /final|game over/i.test(text(first.status ?? first.gameStatus, '')),
      gameTime: text(first.gameTime ?? first.gameDate ?? board.generatedAt, ''),
      venue: text(first.venue, 'Venue pending'),
      away: {
        teamId,
        name: team,
        abbreviation: text(first.teamAbbrev ?? first.team, team),
        logo: logoByTeamId(teamId) ?? logoByTeamName(team) ?? '',
        record: null,
        seasonWinPct: 0,
        probablePitcher: null,
      },
      home: {
        teamId: opponentTeamId,
        name: opponent,
        abbreviation: opponent,
        logo: logoByTeamId(opponentTeamId) ?? logoByTeamName(opponent) ?? '',
        record: null,
        seasonWinPct: 0,
        probablePitcher: null,
      },
      score: { away: 0, home: 0 },
      winProbability: { away: 0, home: 0 },
      winProbModel: ['Win probability feed connected.'],
      runEnvironment: null,
      topHrWatch,
      keyFactors: ['Verified HR Board live signal rows.'],
      whatToWatch: topHrWatch[0] ? [`Top HR watch: ${topHrWatch[0].playerName} (${topHrWatch[0].team}).`] : ['HR watch active.'],
      aiVerdict: 'Live Game Signal stream connected.',
      dataQuality: 'limited' as const,
    };
  });
}

export function useLiveGamesNextData(
  onAddLegToParlay: (player: MLBPlayer, prop: { id: string; market: string; odds: number | null; spec: string }) => void,
) {
  const liveGamesQuery = useLiveGames();
  const hrBoardQuery = useDailyHrBoard(todayISO());

  const [matchups, setMatchups] = useState<GameMatchup[]>([]);
  const [filterTab, setFilterTab] = useState<LiveGamesFilterTab>('all');
  const [activeGamePk, setActiveGamePk] = useState<number | null>(null);
  const [selectedGamePk, setSelectedGamePk] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sourceNote, setSourceNote] = useState('Connecting to live stream...');
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);

  // Build the official base and merge HR enrichments. Subsequent polls flow
  // through mergeOfficialLiveUpdates so schedule order is never reshuffled.
  useEffect(() => {
    const officialGames = liveGamesQuery.data?.games ?? [];
    if (officialGames.length === 0 && liveGamesQuery.isLoading) return;

    const officialBase = officialGames.map(matchupFromLiveGame);
    const hrBoardData = hrBoardQuery.data ?? null;
    const merged = hrBoardData
      ? mergeMatchups(officialBase, buildMatchupsFromHrBoard(hrBoardData))
      : officialBase;

    setMatchups((prev) => (prev.length ? mergeOfficialLiveUpdates(prev, merged) : merged));

    if (liveGamesQuery.isError && hrBoardQuery.error) {
      setError('Live stream temporarily unavailable.');
      setSourceNote('Backend reconnecting...');
    } else {
      setError(null);
      setSourceNote(officialGames.length > 0
        ? `Official MLB live stream active (${liveGamesQuery.dataUpdatedAt ? 'synced' : 'initial'}).`
        : 'Connecting to live stream...');
      setLastSyncTime(Date.now());
    }
  }, [liveGamesQuery.data, liveGamesQuery.isError, liveGamesQuery.isLoading, liveGamesQuery.dataUpdatedAt, hrBoardQuery.data, hrBoardQuery.error]);

  const feedState: LiveGamesFeedState = error
    ? 'down'
    : liveGamesQuery.isError || (liveGamesQuery.isLoading && matchups.length === 0)
      ? 'reconnecting'
      : 'live';

  const liveCount = useMemo(() => matchups.filter((m) => m.isLive).length, [matchups]);
  const upcomingCount = useMemo(() => matchups.filter((m) => !m.isLive && !m.isFinal).length, [matchups]);
  const finalCount = useMemo(() => matchups.filter((m) => m.isFinal).length, [matchups]);

  const filteredGames = useMemo(() => {
    if (filterTab === 'live') return matchups.filter((m) => m.isLive);
    if (filterTab === 'upcoming') return matchups.filter((m) => !m.isLive && !m.isFinal);
    if (filterTab === 'final') return matchups.filter((m) => m.isFinal);
    return matchups;
  }, [matchups, filterTab]);

  // Featured game: the selected gamePk if it's still on the board, else first
  // live game, else first game. Auto-seeds once matchups arrive.
  const activeGame = useMemo(() => {
    const byPk = activeGamePk != null ? matchups.find((m) => m.gamePk === activeGamePk) : undefined;
    return byPk ?? matchups.find((m) => m.isLive) ?? matchups[0] ?? null;
  }, [matchups, activeGamePk]);

  useEffect(() => {
    if (activeGamePk == null && matchups.length > 0) {
      setActiveGamePk(matchups.find((m) => m.isLive)?.gamePk ?? matchups[0].gamePk);
    }
  }, [matchups, activeGamePk]);

  const selectedGame = useMemo(
    () => (selectedGamePk != null ? matchups.find((m) => m.gamePk === selectedGamePk) ?? null : null),
    [matchups, selectedGamePk],
  );

  const handleManualRefresh = useCallback(() => {
    void liveGamesQuery.refetch();
    void hrBoardQuery.refresh();
    setLastSyncTime(Date.now());
  }, [liveGamesQuery, hrBoardQuery]);

  const addLeg = useCallback((w: HrWatch) => {
    onAddLegToParlay(
      { name: w.playerName, team: w.team } as MLBPlayer,
      {
        id: `hrwatch-${w.playerId}`,
        market: 'Anytime HR',
        odds: parseAmericanOdds(w.impliedOdds),
        spec: `${w.playerName} Anytime HR`,
      },
    );
  }, [onAddLegToParlay]);

  const lastSyncLabel = useMemo(() => {
    if (!lastSyncTime) return 'never';
    const seconds = Math.max(0, Math.round((Date.now() - lastSyncTime) / 1000));
    if (seconds < 10) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    return `${Math.floor(seconds / 60)}m ago`;
  }, [lastSyncTime]);

  return {
    matchups,
    filteredGames,
    activeGame,
    selectedGame,
    filterTab,
    setFilterTab,
    setActiveGamePk,
    setSelectedGamePk,
    liveCount,
    upcomingCount,
    finalCount,
    feedState,
    sourceNote,
    lastSyncLabel,
    error,
    isLoading: liveGamesQuery.isLoading && matchups.length === 0,
    handleManualRefresh,
    isSyncing: liveGamesQuery.isFetching,
    addLeg,
  };
}
