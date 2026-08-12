import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PregameAiReadPanel } from './live/command/PregameAiReadPanel';
import { FinalGameRecapPanel } from './live/command/FinalGameRecapPanel';
import {
  Flame, AlertTriangle, ChevronRight, X, Gavel, Activity, CloudSun, Plus, Zap, Clock, CheckCircle2, Trophy, ShieldAlert, Heart
} from 'lucide-react';
import { vouchedgeApi } from '../api/vouchedgeApi';
import { useLiveGames } from '../hooks/queries/useLiveGames';
import { useDailyHrBoard } from '../features/hr/hooks/useDailyHrBoard';
import { todayISO } from '../hooks/queries/hrBoardQuery';
import type { GameMatchup, HrWatch, LiveScore } from '../types/matchup';
import type { MLBPlayer } from '../types';
import type { HrBoardResponse } from '../types/hrBoard';
import { logoByTeamId, logoByTeamName } from '../lib/teamLogos';
import { parseAmericanOdds } from '../lib/odds';
import LiveAtBatView from './live/LiveAtBatView';
import PlayerHeadshot from './parlays/PlayerHeadshot';
import { LineScoreTable } from './live/LineScoreTable';
import { TeamLogo } from './live/LiveTeamLogo';
import {
  LiveGamesHeader,
  type LiveGamesFeedState,
  type LiveGamesFilterTab,
} from './live/LiveGamesHeader';
import StadiumWindVectorWidget from './stadium/StadiumWindVectorWidget';
import { AuroraMaxControl, AuroraMaxFallback, AuroraMaxPanel, AuroraMaxRankedWorkspace, AuroraMaxTruthBadge } from './aurora-max/AuroraMaxPrimitives';
import './live/live-games-lens.css';

interface Props {
  onAddLegToParlay: (player: MLBPlayer, prop: { id: string; market: string; odds: number | null; spec: string }) => void;
}

function vulnColor(v: number): string {
  if (v >= 70) return '#f87171';
  if (v >= 55) return '#fbbf24';
  return '#34d399';
}

function gradeColor(g: string): string {
  return g === 'A+' || g === 'A' ? '#34d399' : g === 'B' ? '#22d3ee' : g === 'C' ? '#fbbf24' : '#f87171';
}

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
  const value = String(status ?? '').toLowerCase();
  return (
    /progress|live|in play|warmup|delayed/i.test(value) ||
    /\b(top|bottom|middle|end)\s+\d/.test(value) ||
    /\b\d+(st|nd|rd|th)\s+inning\b/.test(value)
  );
}

function isFinalStatus(status: unknown): boolean {
  return /final|game over|completed/i.test(String(status ?? ''));
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = window.setTimeout(() => reject(new Error(`${label} timed out`)), ms);
    promise.then((value) => {
      window.clearTimeout(id);
      resolve(value);
    }).catch((error) => {
      window.clearTimeout(id);
      reject(error);
    });
  });
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
  const awayAbbr = teamAbbr(awayName);
  const homeAbbr = teamAbbr(homeName);

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
      abbreviation: awayAbbr,
      logo: logoByTeamName(awayName) ?? '',
      record: null,
      seasonWinPct: 0,
      probablePitcher: null,
    },
    home: {
      teamId: 0,
      name: homeName,
      abbreviation: homeAbbr,
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

function sortBySchedule(games: GameMatchup[]): GameMatchup[] {
  return [...games].sort((a, b) => {
    // Live games first, then by schedule
    if (a.isLive && !b.isLive) return -1;
    if (!a.isLive && b.isLive) return 1;
    const timeDelta = Date.parse(a.gameTime || '') - Date.parse(b.gameTime || '');
    if (Number.isFinite(timeDelta) && timeDelta !== 0) return timeDelta;
    return String(a.gamePk).localeCompare(String(b.gamePk));
  });
}

export function mergeMatchups(base: GameMatchup[], enrichments: GameMatchup[]): GameMatchup[] {
  const byGame = new Map<string, GameMatchup>();
  base.forEach((game) => byGame.set(String(game.gamePk), game));

  enrichments.forEach((rich) => {
    const key = String(rich.gamePk);
    const existing = byGame.get(key);
    if (!existing) {
      byGame.set(key, rich);
      return;
    }

    const isFinal = existing.isFinal || rich.isFinal || isFinalStatus(existing.status) || isFinalStatus(rich.status);
    byGame.set(key, {
      ...rich,
      status: existing.status || rich.status,
      isLive: !isFinal && (existing.isLive || rich.isLive || isLiveStatus(existing.status) || isLiveStatus(rich.status)),
      isFinal,
      score: existing.score ?? rich.score,
      gameTime: existing.gameTime || rich.gameTime,
      venue: rich.venue || existing.venue,
      away: { ...rich.away, logo: rich.away.logo || existing.away.logo },
      home: { ...rich.home, logo: rich.home.logo || existing.home.logo },
    });
  });

  return sortBySchedule(Array.from(byGame.values()));
}

/** Merge live scores into matchup list by gamePk. Final status always clears live. */
export function applyScores(matchups: GameMatchup[], scores: LiveScore[]): GameMatchup[] {
  if (!scores.length) return matchups;
  const map = new Map(scores.map((s) => [String(s.gamePk), s]));
  return matchups.map((m) => {
    const s = map.get(String(m.gamePk));
    if (!s) return m;
    const isFinal = s.isFinal || isFinalStatus(s.status);
    return {
      ...m,
      score: s.score,
      isFinal,
      isLive: !isFinal && (s.isLive || isLiveStatus(s.status)),
      status: s.status,
    };
  });
}

export function mergeOfficialLiveUpdates(enriched: GameMatchup[], official: GameMatchup[]): GameMatchup[] {
  if (official.length === 0) return enriched;

  const officialByPk = new Map(official.map((game) => [String(game.gamePk), game]));
  const seen = new Set<string>();

  // Preserve the caller's schedule order so polling cannot reshuffle the slate.
  const merged = enriched.map((game) => {
    const key = String(game.gamePk);
    seen.add(key);
    const next = officialByPk.get(key);
    if (!next) return game;

    const isFinal = next.isFinal || isFinalStatus(next.status);
    return {
      ...game,
      status: next.status || game.status,
      isLive: !isFinal && (next.isLive || isLiveStatus(next.status)),
      isFinal,
      score: next.score ?? game.score,
      gameTime: next.gameTime || game.gameTime,
    };
  });

  for (const game of official) {
    const key = String(game.gamePk);
    if (!seen.has(key)) merged.push(game);
  }

  return merged;
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

function StatusBadge({ m }: { m: GameMatchup }) {
  if (m.isLive) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] font-black font-mono uppercase text-rose-300 px-2.5 py-1 rounded-full border border-rose-500/40 bg-rose-500/15 shadow-[0_0_12px_rgba(244,63,94,0.3)]">
        <span className="relative flex items-center justify-center w-2 h-2">
          <span className="absolute w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          <span className="relative w-1.5 h-1.5 rounded-full bg-rose-400" />
        </span>
        LIVE
      </span>
    );
  }
  if (m.isFinal) {
    return (
      <span className="text-[10px] font-black font-mono uppercase text-slate-300 px-2.5 py-1 rounded-full border border-white/12 bg-black/40">
        FINAL
      </span>
    );
  }
  const t = m.gameTime ? new Date(m.gameTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'Scheduled';
  return (
    <span className="text-[10px] font-mono font-bold text-sky-400 px-2.5 py-1 rounded-full border border-sky-500/30 bg-sky-500/10">
      {t}
    </span>
  );
}

function MatchupDrawer({ m, onClose, onAddLeg }: { m: GameMatchup; onClose: () => void; onAddLeg: (w: HrWatch) => void }) {
  const topHrWatch = Array.isArray(m.topHrWatch) ? m.topHrWatch : [];
  return (
    <div className="fixed inset-0 z-[120] flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md transition-opacity" />
      <div
        className="aurora-max-panel relative w-full max-w-lg h-full border-l border-white/12 overflow-y-auto shadow-2xl space-y-4 p-4 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#071012]/95 backdrop-blur-xl border-b border-white/12 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TeamLogo src={m.away.logo} alt={m.away.name} size={28} />
            <span className="text-sm font-black text-white">{m.away.abbreviation} @ {m.home.abbreviation}</span>
            <TeamLogo src={m.home.logo} alt={m.home.name} size={28} />
            <StatusBadge m={m} />
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scoreboard */}
        <AuroraMaxPanel className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase text-slate-400">Live Scoreboard</span>
            <span className="text-[10px] font-mono text-vouch-cyan">{m.venue ?? 'Venue TBD'}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="border border-white/10 bg-white/[0.03] p-3 text-center">
              <p className="text-xs font-bold text-slate-400">{m.away.name}</p>
              <p className="text-3xl font-black font-mono text-white mt-1">{(m.isLive || m.isFinal) ? (m.score?.away ?? 0) : '-'}</p>
            </div>
            <div className="border border-white/10 bg-white/[0.03] p-3 text-center">
              <p className="text-xs font-bold text-slate-400">{m.home.name}</p>
              <p className="text-3xl font-black font-mono text-white mt-1">{(m.isLive || m.isFinal) ? (m.score?.home ?? 0) : '-'}</p>
            </div>
          </div>
          <div className="pt-2">
            <LineScoreTable game={m} />
          </div>
        </AuroraMaxPanel>

        {/* Stadium Wind Vector & Ballpark Physics */}
        <StadiumWindVectorWidget
          venue={m.venue ?? "Stadium Venue"}
          tempF={78}
          windMph={12}
          windCompass="NNE"
          status="forecast"
          parkFactor={m.runEnvironment?.score ? Math.round(m.runEnvironment.score * 10) : 105}
        />

        {/* Top HR Watch Targets */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black font-mono uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-400" /> Active HR Signals ({topHrWatch.length})
            </h4>
          </div>
          {topHrWatch.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No HR candidates flagged for this game yet.</p>
          ) : (
            <div className="space-y-2">
              {topHrWatch.map((w) => (
                <div key={w.playerId} className="flex items-center justify-between gap-3 border border-white/10 bg-black/40 p-3 hover:border-amber-400/40 transition">
                  <div className="flex items-center gap-3 min-w-0">
                    <PlayerHeadshot headshotUrl={w.headshot} name={w.playerName} size={36} />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-black text-white">{w.playerName}</p>
                      <p className="truncate text-[10px] text-slate-400">{w.teamAbbr} vs {w.opposingPitcher}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-xs font-black text-amber-400">{w.grade}</span>
                    <button
                      onClick={() => onAddLeg(w)}
                      className="aurora-max-control aurora-max-control--primary !min-h-0 !px-2.5 !py-1.5 !text-[10px] !text-[#02100d] !bg-[#00d9a0]"
                    >
                      <Plus className="w-3 h-3" /> Slip
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LiveGamesProZ8({ onAddLegToParlay }: Props) {
  const [matchups, setMatchups] = useState<GameMatchup[]>([]);
  const [activeGamePk, setActiveGamePk] = useState<number | string | null>(null);
  const [selectedGamePk, setSelectedGamePk] = useState<number | string | null>(null);
  const [filterTab, setFilterTab] = useState<LiveGamesFilterTab>('all');
  const [error, setError] = useState<string | null>(null);
  const [sourceNote, setSourceNote] = useState<string>('Connecting to live stream...');
  const [enriching, setEnriching] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Just now');

  const hrBoardQuery = useDailyHrBoard(todayISO());
  const liveGamesQuery = useLiveGames(); // Adaptive poll: ~12s live / ~60s idle, pauses when hidden

  const hrBoardDataRef = useRef(hrBoardQuery.data);
  hrBoardDataRef.current = hrBoardQuery.data;

  const matchupsCountRef = useRef(matchups.length);
  matchupsCountRef.current = matchups.length;

  const enrichRequestRef = useRef(0);

  const buildOfficialBase = useCallback((): GameMatchup[] => {
    const raw = liveGamesQuery.data?.games;
    if (!Array.isArray(raw) || raw.length === 0) return [];
    return raw.map(matchupFromLiveGame);
  }, [liveGamesQuery.data]);

  const mergeFromQueries = useCallback((officialBase: GameMatchup[], hrBoard?: HrBoardResponse | null): GameMatchup[] => {
    const hrMatchups = hrBoard ? buildMatchupsFromHrBoard(hrBoard) : [];
    if (officialBase.length === 0) return hrMatchups;
    if (hrMatchups.length === 0) return officialBase;
    return mergeMatchups(officialBase, hrMatchups);
  }, []);

  useEffect(() => {
    const officialBase = buildOfficialBase();
    if (liveGamesQuery.data?.games) {
      if (officialBase.length > 0) {
        setSourceNote('Official MLB live stream active (10s sync).');
        setLastSyncTime(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' }));
      }
    }

    const merged = mergeFromQueries(officialBase, hrBoardQuery.data);
    if (merged.length > 0) {
      setMatchups((prev) => (prev.length > 0 ? mergeOfficialLiveUpdates(prev, merged) : merged));
      setError(null);
    } else if (liveGamesQuery.isError && Boolean(hrBoardQuery.error)) {
      setError('Live stream temporarily unavailable.');
      setSourceNote('Backend reconnecting...');
    }
  }, [liveGamesQuery.data, liveGamesQuery.isError, hrBoardQuery.data, hrBoardQuery.error, buildOfficialBase, mergeFromQueries]);

  const handleManualRefresh = useCallback(() => {
    void liveGamesQuery.refetch();
    void hrBoardQuery.refresh();
    setLastSyncTime(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' }));
  }, [liveGamesQuery, hrBoardQuery]);

  const liveGamesList = matchups.filter((m) => m.isLive);
  const upcomingGamesList = matchups.filter((m) => !m.isLive && !m.isFinal);
  const finalGamesList = matchups.filter((m) => m.isFinal);
  const feedState: LiveGamesFeedState = error
    ? 'down'
    : liveGamesQuery.isError || (liveGamesQuery.isLoading && matchups.length === 0)
      ? 'reconnecting'
      : 'live';

  const filteredGames = filterTab === 'live'
    ? liveGamesList
    : filterTab === 'upcoming'
      ? upcomingGamesList
      : filterTab === 'final'
        ? finalGamesList
        : matchups;

  const activeGame = matchups.find((m) => String(m.gamePk) === String(activeGamePk))
    ?? liveGamesList[0]
    ?? matchups[0]
    ?? null;

  const selectedDrawerGame = selectedGamePk != null
    ? matchups.find((game) => String(game.gamePk) === String(selectedGamePk)) ?? null
    : null;

  useEffect(() => {
    if (!activeGamePk && activeGame?.gamePk) {
      setActiveGamePk(activeGame.gamePk);
    }
  }, [activeGamePk, activeGame?.gamePk]);

  const addLeg = (w: HrWatch) => {
    onAddLegToParlay({ name: w.playerName, team: w.team } as MLBPlayer, {
      id: `hrwatch-${w.playerId}`,
      market: 'Anytime HR',
      odds: parseAmericanOdds(w.impliedOdds),
      spec: `${w.playerName} Anytime HR`,
    });
  };

  return (
    <main className="aurora-max-live-games live-deck w-full max-w-full min-w-0 overflow-x-hidden px-3 sm:px-6 lg:px-8 pt-4 pb-24">
      <div className="deck-reveal mb-4 sm:mb-6">
        <LiveGamesHeader
          onRefresh={handleManualRefresh}
          isSyncing={liveGamesQuery.isFetching}
          feedState={feedState}
          feedNote={sourceNote}
          lastSyncLabel={lastSyncTime}
          totalCount={matchups.length}
          liveCount={liveGamesList.length}
          upcomingCount={upcomingGamesList.length}
          finalCount={finalGamesList.length}
          filterTab={filterTab}
          onFilterChange={setFilterTab}
        />
      </div>

      {error && (
        <AuroraMaxPanel className="mb-6 border-rose-500/30 bg-rose-500/10 p-6 text-center text-sm text-rose-300">
          <p>{error}</p>
          <AuroraMaxControl tone="danger" onClick={handleManualRefresh} className="mt-4">
            Try again
          </AuroraMaxControl>
        </AuroraMaxPanel>
      )}

      {liveGamesQuery.isLoading && matchups.length === 0 && (
        <div className="grid sm:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-56 border border-white/10 bg-white/[0.02] animate-pulse" />
          ))}
        </div>
      )}

      {!error && matchups.length > 0 && (
        filteredGames.length === 0 ? (
          <AuroraMaxFallback
            title={filterTab === 'live' ? 'No games are live right now.' : 'No games found for this filter tab.'}
            detail="The MLB schedule returned no records for this view. The live feed remains available for refresh."
            action={(
              <AuroraMaxControl tone="primary" onClick={() => setFilterTab('all')}>
              Show today&apos;s schedule
              </AuroraMaxControl>
            )}
          />
        ) : (
          <div className="space-y-6">

            {/* ── Featured Active Spotlight Hero Scoreboard ─────────────────── */}
            {activeGame && (
              <AuroraMaxPanel as="section" className="live-game-scoreboard relative overflow-hidden p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 border-b border-white/10 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-black uppercase text-vouch-cyan tracking-wider">Current game</span>
                    </div>
                    <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight mt-0.5">
                      {activeGame.away.abbreviation} vs {activeGame.home.abbreviation}
                    </h2>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                      {activeGame.venue ?? 'Venue TBD'} · {activeGame.status ?? 'Game scheduled'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <AuroraMaxTruthBadge state={activeGame.isLive ? 'live' : activeGame.isFinal ? 'confirmed' : 'projected'}>
                      {activeGame.isLive ? 'LIVE FEED' : activeGame.isFinal ? 'FINAL' : 'SCHEDULED'}
                    </AuroraMaxTruthBadge>
                    <AuroraMaxControl
                      tone="primary"
                      onClick={() => setSelectedGamePk(activeGame.gamePk)}
                      className="!min-h-0 !px-3 !py-1.5 !text-xs !text-[#02100d] !bg-[#00d9a0]"
                    >
                      Open matchup
                    </AuroraMaxControl>
                  </div>
                </div>

                {/* Scoreboard display */}
                <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4 bg-black/40 p-4 sm:p-6 border border-white/10">
                  <div className="flex items-center gap-3">
                    <TeamLogo src={activeGame.away.logo} alt={activeGame.away.name} size={44} />
                    <div>
                      <span className="font-mono text-[10px] font-bold text-slate-400 uppercase">Away</span>
                      <p className="text-base sm:text-xl font-black text-white">{activeGame.away.name}</p>
                    </div>
                  </div>

                  <div className="text-center py-2 border-y sm:border-y-0 sm:border-x border-white/10">
                    <div className="flex items-center justify-center gap-4">
                      <span className="font-mono text-4xl sm:text-5xl font-black text-white tabular-nums">
                        {(activeGame.isLive || activeGame.isFinal) ? (activeGame.score?.away ?? 0) : '-'}
                      </span>
                      <span className="text-slate-600 text-2xl font-black">–</span>
                      <span className="font-mono text-4xl sm:text-5xl font-black text-white tabular-nums">
                        {(activeGame.isLive || activeGame.isFinal) ? (activeGame.score?.home ?? 0) : '-'}
                      </span>
                    </div>
                    <p className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider mt-2">
                      {activeGame.isFinal ? 'Final Score' : activeGame.isLive ? 'Live In-Game Score' : 'Pregame Matchup'}
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-3 text-right">
                    <div>
                      <span className="font-mono text-[10px] font-bold text-slate-400 uppercase">Home</span>
                      <p className="text-base sm:text-xl font-black text-white">{activeGame.home.name}</p>
                    </div>
                    <TeamLogo src={activeGame.home.logo} alt={activeGame.home.name} size={44} />
                  </div>
                </div>

                {/* Inning-by-Inning Line Score Table */}
                <div className="mt-4">
                  <LineScoreTable game={activeGame} />
                </div>

                {/* In-Game HR Signal Spotlight */}
                {activeGame.topHrWatch && activeGame.topHrWatch.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-black font-mono uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                        <Flame className="w-4 h-4 text-amber-400" /> High-Confidence HR Signals ({activeGame.topHrWatch.length})
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {activeGame.topHrWatch.slice(0, 3).map((w) => (
                        <div key={w.playerId} className="flex items-center justify-between gap-3 border border-white/10 bg-black/40 p-2.5 hover:border-amber-400/40 transition">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <PlayerHeadshot headshotUrl={w.headshot} name={w.playerName} size={32} />
                            <div className="min-w-0">
                              <p className="truncate text-xs font-black text-white">{w.playerName}</p>
                              <p className="truncate text-[10px] text-slate-400">{w.teamAbbr} vs {w.opposingPitcher}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => addLeg(w)}
                            className="aurora-max-control aurora-max-control--primary !min-h-0 !px-2 !py-1 !text-[10px] !text-[#02100d] !bg-[#00d9a0]"
                          >
                            <Plus className="w-3 h-3" /> Slip
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </AuroraMaxPanel>
            )}

            {/* ── Multi-Game Slate Selector Grid ────────────────────────────── */}
            <AuroraMaxRankedWorkspace
              title={`Today’s MLB Game Slate (${filteredGames.length})`}
              subtitle="Dense game-state index with explicit feed status and matchup selection."
            >
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {filteredGames.map((m) => (
                  <button
                    key={m.gamePk}
                    onClick={() => setActiveGamePk(m.gamePk)}
                    className={`text-left p-3.5 border transition-all duration-200 ${
                      String(activeGame?.gamePk) === String(m.gamePk)
                        ? 'border-vouch-cyan bg-vouch-cyan/10 shadow-[0_0_15px_rgba(79,184,220,0.15)]'
                        : 'border-white/10 bg-black/40 hover:border-white/25 hover:bg-black/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className="font-mono text-[9px] font-bold text-slate-400 uppercase truncate">
                        {m.venue ? m.venue.split(' ')[0] : 'MLB'}
                      </span>
                      <StatusBadge m={m} />
                    </div>

                    <div className="flex items-center justify-between gap-2 my-1">
                      <div className="flex items-center gap-2">
                        <TeamLogo src={m.away.logo} alt={m.away.name} size={22} />
                        <span className="text-xs font-black text-white">{m.away.abbreviation}</span>
                      </div>
                      <span className="font-mono text-sm font-black text-white">{(m.isLive || m.isFinal) ? (m.score?.away ?? 0) : '-'}</span>
                    </div>

                    <div className="flex items-center justify-between gap-2 my-1">
                      <div className="flex items-center gap-2">
                        <TeamLogo src={m.home.logo} alt={m.home.name} size={22} />
                        <span className="text-xs font-black text-white">{m.home.abbreviation}</span>
                      </div>
                      <span className="font-mono text-sm font-black text-white">{(m.isLive || m.isFinal) ? (m.score?.home ?? 0) : '-'}</span>
                    </div>
                  </button>
                ))}
              </div>
            </AuroraMaxRankedWorkspace>

            {/* ── Live At-Bat Pitch-by-Pitch Sweat Stream Module ─────────────── */}
            {activeGame?.isLive && activeGame.gamePk != null && (
              <section className="mt-8 pt-6 border-t border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-vouch-cyan animate-pulse" />
                    <h3 className="text-sm font-black font-mono uppercase tracking-wider text-white">
                      Pitch-by-Pitch Sweat Stream
                    </h3>
                  </div>
                  <AuroraMaxTruthBadge state="live">6s Real-Time Sensor Stream</AuroraMaxTruthBadge>
                </div>

                <div className="min-w-0 max-w-4xl mx-auto w-full">
                  <LiveAtBatView gamePk={Number(activeGame.gamePk)} />
                </div>
              </section>
            )}

            {/* Pregame AI Read */}
            {activeGame && !activeGame.isLive && !activeGame.isFinal && (
              <div className="mt-6">
                <PregameAiReadPanel game={activeGame} />
              </div>
            )}

            {/* Final Game Recap */}
            {activeGame?.isFinal && (
              <div className="mt-6">
                <FinalGameRecapPanel game={activeGame} />
              </div>
            )}

          </div>
        )
      )}

      {selectedDrawerGame && (
        <MatchupDrawer
          m={selectedDrawerGame}
          onClose={() => setSelectedGamePk(null)}
          onAddLeg={addLeg}
        />
      )}

    </main>
  );
}
