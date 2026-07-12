import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PregameAiReadPanel } from './live/command/PregameAiReadPanel';
import { FinalGameRecapPanel } from './live/command/FinalGameRecapPanel';
import {
  Tv, RefreshCw, Flame, AlertTriangle, ChevronRight, X, Gavel, Activity, CloudSun, Plus, Radio,
} from 'lucide-react';
import { vouchedgeApi } from '../api/vouchedgeApi';
import { useLiveGames } from '../hooks/queries/useLiveGames';
import { useHrBoardToday } from '../hooks/queries/useHrBoardToday';
import type { GameMatchup, HrWatch, LiveScore } from '../types/matchup';
import type { MLBPlayer } from '../types';
import type { HrBoardResponse } from '../types/hrBoard';
import { logoByTeamId, logoByTeamName } from '../lib/teamLogos';
import { parseAmericanOdds } from '../lib/odds';
import LiveAtBatView from './live/LiveAtBatView';
import PlayerHeadshot from './parlays/PlayerHeadshot';
import { Z8_ACTIVE, Z8_IDLE, Z8_LABEL, Z8_PAGE, Z8_PAGE_PAD_X, Z8_PAGE_PAD_Y, Z8_PANEL_PREMIUM, Z8_SECTION_HEADER, Z8_STAT_CHIP, Z8_SURFACE } from '../theme/z8Tokens';

interface Props {
  onAddLegToParlay: (player: MLBPlayer, prop: { id: string; market: string; odds: number | null; spec: string }) => void;
}

const REFRESH_MS = 3 * 60_000;
function vulnColor(v: number): string {
  if (v >= 70) return '#f87171';
  if (v >= 55) return '#fbbf24';
  return '#34d399';
}
function gradeColor(g: string): string {
  return g === 'A+' || g === 'A' ? '#34d399' : g === 'B' ? '#22d3ee' : g === 'C' ? '#fbbf24' : '#f87171';
}
const FORM_COLOR: Record<string, string> = { Hot: '#fb7185', Average: '#94a3b8', Cold: '#60a5fa', Slump: '#64748b' };

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
    winProbModel: ['Official MLB schedule is connected. Projection probabilities are pending a backed model.'],
    runEnvironment: null,
    topHrWatch: [],
    keyFactors: ['Official MLB live schedule row. No synthetic projections added.'],
    whatToWatch: live ? ['Game is live according to MLB schedule status.'] : ['Game is not live yet according to MLB schedule status.'],
    aiVerdict: game.predictionsAvailable
      ? 'Projection model connected.'
      : 'Official live game card is available. Projection probabilities require a backed model before they will be shown.',
    dataQuality: 'limited',
  };
}

function mergeMatchups(base: GameMatchup[], enrichments: GameMatchup[]): GameMatchup[] {
  const byGame = new Map<string, GameMatchup>();
  base.forEach((game) => byGame.set(String(game.gamePk), game));

  enrichments.forEach((rich) => {
    const key = String(rich.gamePk);
    const existing = byGame.get(key);
    if (!existing) {
      byGame.set(key, rich);
      return;
    }

    byGame.set(key, {
      ...rich,
      status: existing.status || rich.status,
      isLive: existing.isLive || rich.isLive || isLiveStatus(existing.status) || isLiveStatus(rich.status),
      isFinal: existing.isFinal || rich.isFinal || isFinalStatus(existing.status) || isFinalStatus(rich.status),
      score: existing.score ?? rich.score,
      gameTime: existing.gameTime || rich.gameTime,
      venue: rich.venue || existing.venue,
      away: { ...rich.away, logo: rich.away.logo || existing.away.logo },
      home: { ...rich.home, logo: rich.home.logo || existing.home.logo },
    });
  });

  return Array.from(byGame.values()).sort((a, b) => {
    const liveDelta = Number(b.isLive) - Number(a.isLive);
    if (liveDelta) return liveDelta;
    return Date.parse(a.gameTime || '') - Date.parse(b.gameTime || '');
  });
}

/** Overlay fresh official scores/status onto enriched rows without dropping model fields. */
function mergeOfficialLiveUpdates(enriched: GameMatchup[], official: GameMatchup[]): GameMatchup[] {
  if (official.length === 0) return enriched;

  const officialByPk = new Map(official.map((game) => [String(game.gamePk), game]));
  const seen = new Set<string>();

  const merged = enriched.map((game) => {
    const key = String(game.gamePk);
    seen.add(key);
    const next = officialByPk.get(key);
    if (!next) return game;

    return {
      ...game,
      status: next.status || game.status,
      isLive: next.isLive || game.isLive || isLiveStatus(next.status) || isLiveStatus(game.status),
      isFinal: next.isFinal || game.isFinal || isFinalStatus(next.status) || isFinalStatus(game.status),
      score: next.score ?? game.score,
      gameTime: next.gameTime || game.gameTime,
    };
  });

  for (const game of official) {
    const key = String(game.gamePk);
    if (!seen.has(key)) merged.push(game);
  }

  return merged.sort((a, b) => {
    const liveDelta = Number(b.isLive) - Number(a.isLive);
    if (liveDelta) return liveDelta;
    return Date.parse(a.gameTime || '') - Date.parse(b.gameTime || '');
  });
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
      winProbModel: ['Win probability feed not connected for this fast preview. No fake model edge shown.'],
      runEnvironment: null,
      topHrWatch,
      keyFactors: ['Fast preview uses the verified HR board payload only.'],
      whatToWatch: topHrWatch[0] ? [`Top HR watch: ${topHrWatch[0].playerName} (${topHrWatch[0].team}).`] : ['HR watch data unavailable.'],
      aiVerdict: 'Fast Live Projection preview. HR watch is connected; win probability, RBI, run, hit, and bullpen modules require verified feeds.',
      dataQuality: 'limited' as const,
    };
  });
}

function safePct(value: unknown): string {
  const n = num(value, NaN);
  return Number.isFinite(n) && n > 0 ? `${Math.round(n)}%` : 'Pending';
}

function TeamLogo({ src, alt, size = 32 }: { src: string; alt: string; size?: number }) {
  return <img src={src} alt={alt} width={size} height={size} loading="lazy" decoding="async"
    className="object-contain shrink-0" style={{ width: size, height: size }}
    onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }} />;
}

function StatusBadge({ m }: { m: GameMatchup }) {
  if (m.isLive) return (
    <span className="inline-flex items-center gap-1 text-[10px] font-black font-mono uppercase text-red-400 px-2 py-0.5 rounded-full border border-red-500/40 bg-red-500/10">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> Live
    </span>
  );
  if (m.isFinal) return <span className="text-[10px] font-black font-mono uppercase text-slate-400 px-2 py-0.5 rounded-full border border-slate-700 bg-slate-800/50">Final</span>;
  const t = m.gameTime ? new Date(m.gameTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';
  return <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">{t}</span>;
}

const ENV_COLOR: Record<string, string> = { SHOOTOUT: '#f87171', HIGH: '#fb923c', MODERATE: '#fbbf24', LOW: '#64748b' };

function MatchupDrawer({ m, onClose, onAddLeg }: { m: GameMatchup; onClose: () => void; onAddLeg: (w: HrWatch) => void }) {
  const Section: React.FC<{ icon: any; title: string; tone?: string; children: React.ReactNode }> = ({ icon: Icon, title, tone = '#38bdf8', children }) => (
    <div>
      <div className="flex items-center gap-1.5 mb-2"><Icon className="w-3.5 h-3.5" style={{ color: tone }} /><h4 className="text-[11px] font-bold font-mono uppercase tracking-wider text-slate-400">{title}</h4></div>
      {children}
    </div>
  );
  const winProbability = m.winProbability ?? { away: 0, home: 0 };
  const topHrWatch = Array.isArray(m.topHrWatch) ? m.topHrWatch : [];
  const homeFav = winProbability.home >= winProbability.away;
  return (
    <div className="fixed inset-0 z-[120] flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg h-full bg-ve-storm border-l border-slate-800 overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 z-10 bg-ve-storm/95 backdrop-blur border-b border-slate-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TeamLogo src={m.away.logo} alt={m.away.name} size={26} />
            <span className="text-sm font-black text-slate-100">{m.away.abbreviation} @ {m.home.abbreviation}</span>
            <TeamLogo src={m.home.logo} alt={m.home.name} size={26} />
            <StatusBadge m={m} />
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-4 space-y-5">
          {/* Scoreboard */}
          <Section icon={Activity} title="Game scoreboard">
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-3">
                <p className="text-[10px] text-slate-500 font-mono">{m.away.abbreviation}</p>
                <p className="text-3xl font-black font-mono text-white">{(m.isLive || m.isFinal) ? (m.score?.away ?? 0) : '-'}</p>
                <p className="text-[10px] text-slate-500">{m.away.name}</p>
              </div>
              <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-3">
                <p className="text-[10px] text-slate-500 font-mono">{m.home.abbreviation}</p>
                <p className="text-3xl font-black font-mono text-white">{(m.isLive || m.isFinal) ? (m.score?.home ?? 0) : '-'}</p>
                <p className="text-[10px] text-slate-500">{m.home.name}</p>
              </div>
            </div>

            <div className="rounded-xl bg-slate-950/50 border border-slate-800 p-3">
              <p className="text-[10px] text-slate-500 font-mono uppercase">Status</p>
              <p className="text-sm font-black text-slate-200">
                {m.isFinal ? 'Final' : m.isLive ? 'Live now' : (m.status ?? 'Scheduled')}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Model win lean is still available below as research context, but score comes first on Live Games.
              </p>
            </div>
          </Section>

          {/* Pitcher matchups */}
          <Section icon={AlertTriangle} title="Starting pitcher matchups" tone="#fbbf24">
            <div className="grid grid-cols-2 gap-2">
              {[m.away, m.home].map((t) => (
                <div key={t.teamId} className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <p className="text-[10px] text-slate-500 font-mono">{t.abbreviation}</p>
                  <p className="text-xs font-bold text-slate-200 truncate">{t.probablePitcher?.name ?? 'TBD'}</p>
                  {t.probablePitcher && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="text-[9px] text-slate-500 font-mono">VULN</span>
                      <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden"><div className="h-full" style={{ width: `${t.probablePitcher.vulnerability}%`, background: vulnColor(t.probablePitcher.vulnerability) }} /></div>
                      <span className="text-[10px] font-mono font-bold" style={{ color: vulnColor(t.probablePitcher.vulnerability) }}>{t.probablePitcher.vulnerability}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>

          {/* Run environment */}
          {m.runEnvironment && (
            <Section icon={CloudSun} title="Run environment" tone="#34d399">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-black font-mono" style={{ color: ENV_COLOR[m.runEnvironment.tier] ?? '#94a3b8' }}>{m.runEnvironment.tier}</span>
                <span className="text-xs text-slate-400 font-mono">{m.runEnvironment.score}/100</span>
              </div>
              <ul className="space-y-0.5">{(m.runEnvironment.reasons ?? []).map((r, i) => <li key={i} className="text-[11px] text-slate-400">• {r}</li>)}</ul>
            </Section>
          )}

          {/* Players to watch */}
          <Section icon={Flame} title="Players to watch (HR)" tone="#fb923c">
            <div className="space-y-2">
              {topHrWatch.map((w) => (
                <div key={w.playerId} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/50 border border-slate-800">
                  <PlayerHeadshot name={w.playerName} playerId={w.playerId} headshotUrl={w.headshot} size={36} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-100 truncate flex items-center gap-1.5">
                      {w.playerName}
                      <span className="text-[9px] font-black font-mono px-1 rounded" style={{ color: gradeColor(w.grade), background: gradeColor(w.grade) + '20' }}>{w.grade}</span>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: FORM_COLOR[w.formTag] ?? '#94a3b8' }} />
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">{w.team} · HR edge {w.hrEdge} · {w.impliedOdds} · vs {w.opposingPitcher}</p>
                  </div>
                  <button onClick={() => onAddLeg(w)} className="flex items-center gap-1 text-[10px] font-bold text-sky-400 border border-sky-500/40 rounded-lg px-2 py-1 hover:bg-sky-500/10 flex-shrink-0">
                    <Plus className="w-3 h-3" /> Slip
                  </button>
                </div>
              ))}
            </div>
          </Section>

          {/* Key factors + what to watch */}
          <Section icon={Gavel} title="Key factors & what to watch">
            <ul className="space-y-1">
              {[...(m.keyFactors ?? []), ...(m.whatToWatch ?? [])].map((f, i) => <li key={i} className="text-[11px] text-slate-300">• {f}</li>)}
            </ul>
          </Section>

          {/* AI verdict */}
          <div className="p-3 rounded-xl bg-sky-500/5 border border-sky-500/20">
            <p className="text-[10px] font-black font-mono uppercase tracking-wider text-sky-400 mb-1">VouchEdge AI Verdict</p>
            <p className="text-xs text-slate-300 leading-relaxed">{m.aiVerdict}</p>
          </div>

          <p className="text-[10px] text-slate-600 text-center">Live game research for entertainment — not betting advice. Some lineups/weather may be projected until official feeds confirm.</p>
        </div>
      </div>
    </div>
  );
}

/** Merge live scores into matchup list by gamePk. */
function applyScores(matchups: GameMatchup[], scores: LiveScore[]): GameMatchup[] {
  if (!scores.length) return matchups;
  const map = new Map(scores.map((s) => [String(s.gamePk), s]));
  return matchups.map((m) => {
    const s = map.get(String(m.gamePk));
    if (!s) return m;
    return {
      ...m,
      score: s.score,
      isLive: s.isLive || isLiveStatus(s.status),
      isFinal: s.isFinal || isFinalStatus(s.status),
      status: s.status,
    };
  });
}

export default function LiveGamesPro({ onAddLegToParlay }: Props) {
  const liveGamesQuery = useLiveGames();
  const hrBoardQuery = useHrBoardToday(50);
  const [matchups, setMatchups] = useState<GameMatchup[]>([]);
  const [enriching, setEnriching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveOnly, setLiveOnly] = useState(false);
  const [selected, setSelected] = useState<GameMatchup | null>(null);
  const [activeGamePk, setActiveGamePk] = useState<number | string | null>(null);
  const [sourceNote, setSourceNote] = useState('Loading live games...');

  const liveGamesDataRef = useRef(liveGamesQuery.data);
  const hrBoardDataRef = useRef(hrBoardQuery.data);
  const matchupsCountRef = useRef(0);
  const enrichRequestRef = useRef(0);

  liveGamesDataRef.current = liveGamesQuery.data;
  hrBoardDataRef.current = hrBoardQuery.data;
  matchupsCountRef.current = matchups.length;

  const loading = (liveGamesQuery.isLoading || hrBoardQuery.isLoading) && matchups.length === 0;

  const mergeFromQueries = useCallback((officialBase: GameMatchup[], hrBoard: HrBoardResponse | undefined) => {
    let merged = officialBase;
    if (hrBoard) {
      const fastMatchups = buildMatchupsFromHrBoard(hrBoard);
      if (fastMatchups.length > 0) {
        merged = officialBase.length > 0 ? mergeMatchups(officialBase, fastMatchups) : fastMatchups;
      }
    }
    return merged;
  }, []);

  const buildOfficialBase = useCallback(() => {
    return (liveGamesDataRef.current?.games ?? [])
      .map(matchupFromLiveGame)
      .filter((game) => game.gamePk);
  }, []);

  // Fast path: react-query polls update scores/status without re-enriching the full model.
  useEffect(() => {
    const official = liveGamesQuery.data;
    let officialBase: GameMatchup[] = [];
    if (official?.games?.length) {
      officialBase = official.games.map(matchupFromLiveGame).filter((game) => game.gamePk);
      if (officialBase.length > 0) {
        setSourceNote((prev) => (prev === 'Backend unavailable.' ? prev : 'Official MLB live schedule loaded.'));
      }
    }

    const merged = mergeFromQueries(officialBase, hrBoardQuery.data);
    if (merged.length > 0) {
      setMatchups((prev) => (prev.length > 0 ? mergeOfficialLiveUpdates(prev, merged) : merged));
      setError(null);
    } else if (liveGamesQuery.isError && hrBoardQuery.isError) {
      setError('Live games unavailable right now. No fake games shown.');
      setSourceNote('Backend unavailable.');
    }
  }, [liveGamesQuery.data, liveGamesQuery.isError, hrBoardQuery.data, hrBoardQuery.isError, mergeFromQueries]);

  // Slow path: matchup model enrichment on an interval only — not on every live poll.
  useEffect(() => {
    let cancelled = false;

    const runEnrich = async (showBusy: boolean) => {
      const officialBase = buildOfficialBase();
      const merged = mergeFromQueries(officialBase, hrBoardDataRef.current);
      if (merged.length === 0) return;

      const requestId = ++enrichRequestRef.current;
      if (showBusy && matchupsCountRef.current === 0) setEnriching(true);

      try {
        const scoreResult = await vouchedgeApi.scoresToday().catch(() => null);
        let working = merged;
        if (Array.isArray(scoreResult?.scores) && scoreResult.scores.length > 0) {
          working = applyScores(working, scoreResult.scores);
        }

        const res = await withTimeout(vouchedgeApi.matchupsToday(), 9000, 'Live matchup model');
        const next = Array.isArray(res.matchups) ? res.matchups : [];

        if (cancelled || requestId !== enrichRequestRef.current) return;

        const latestOfficial = buildOfficialBase();
        const latestMerged = mergeFromQueries(latestOfficial, hrBoardDataRef.current);
        const enrichedBase = latestMerged.length > 0 ? latestMerged : working;

        if (next.length > 0) {
          setMatchups(mergeMatchups(enrichedBase, next));
          setSourceNote('Live game model loaded.');
        } else {
          setMatchups((prev) => (prev.length > 0 ? prev : working));
          setSourceNote('Live model returned no rows. Showing verified schedule preview.');
        }
        setError(null);
      } catch {
        if (cancelled || requestId !== enrichRequestRef.current) return;
        setMatchups((prev) => (prev.length > 0 ? prev : merged));
        setSourceNote('Live model is slow/unavailable. Showing verified game preview.');
        setError(null);
      } finally {
        if (!cancelled && requestId === enrichRequestRef.current && showBusy) {
          setEnriching(false);
        }
      }
    };

    void runEnrich(true);
    const id = window.setInterval(() => {
      void runEnrich(false);
    }, REFRESH_MS);

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [buildOfficialBase, mergeFromQueries, hrBoardQuery.data]);

  const load = useCallback(() => {
    void liveGamesQuery.refetch();
    void hrBoardQuery.refetch();
  }, [liveGamesQuery, hrBoardQuery]);

  const scoredMatchups = matchups;
  const liveCount = scoredMatchups.filter((m) => m.isLive).length;
  const shown = liveOnly ? scoredMatchups.filter((m) => m.isLive) : scoredMatchups;

  const preferredGame =
    shown.find((m) => m.isLive) ??
    shown.find((m) => String(m.status ?? '').toLowerCase().includes('scheduled')) ??
    shown[0] ??
    null;

  const activeGame =
    shown.find((m) => String(m.gamePk) === String(activeGamePk)) ??
    preferredGame;

  useEffect(() => {
    if (!activeGamePk && preferredGame?.gamePk) {
      setActiveGamePk(preferredGame.gamePk);
    }
  }, [activeGamePk, preferredGame?.gamePk]);

  const addLeg = (w: HrWatch) => {
    onAddLegToParlay({ name: w.playerName, team: w.team } as MLBPlayer, {
      id: `hrwatch-${w.playerId}`,
      market: 'Anytime HR',
      odds: parseAmericanOdds(w.impliedOdds),
      spec: `${w.playerName} Anytime HR`,
    });
  };

  return (
    <main className={`${Z8_PAGE} ve-page-shell min-w-0 overflow-x-hidden ve-safe-bottom max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-5 pb-24 md:pb-5`}>
      {/* Header */}
      <div className={`rounded-2xl ${Z8_PANEL_PREMIUM} bg-gradient-to-br from-vouch-cyan/10 via-obsidian-900 to-obsidian-900 p-4 sm:p-5 mb-4 sm:mb-5`}>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 text-xl font-black tracking-tight sm:text-2xl"><Tv className="h-5 w-5 shrink-0 text-vouch-emerald sm:h-6 sm:w-6" /> Live MLB games</h1>
            <p className="mt-1 max-w-xl text-sm leading-5 text-white/55">Official game state first. Matchup research appears only when a verified source is available.</p>
            <p className={`mt-2 ${Z8_LABEL} text-vouch-emerald`}>{sourceNote}</p>
          </div>
          <button onClick={load} className="z8-control flex shrink-0 items-center gap-1.5 self-start border border-white/10 bg-black/25 px-3 py-2 font-mono text-xs text-vouch-emerald transition-colors hover:border-vouch-emerald/50 sm:self-auto">
            <RefreshCw className={`w-3.5 h-3.5 ${loading || enriching ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
        <div className="flex items-center gap-2 mt-4">
          <button onClick={() => setLiveOnly(false)} className={`z8-control px-3 py-1.5 text-xs font-bold border transition-all ${!liveOnly ? `${Z8_ACTIVE}` : Z8_IDLE}`}>All games ({matchups.length})</button>
          <button onClick={() => setLiveOnly(true)} className={`z8-control flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border transition-all ${liveOnly ? 'bg-red-500/15 border-red-500/50 text-red-300' : Z8_IDLE}`}>
            <Radio className="w-3.5 h-3.5" /> Live only ({liveCount})
          </button>
        </div>
      </div>

      {error && <div className="z8-data-surface p-6 text-center text-sm text-red-300"><p>{error}</p><button type="button" onClick={load} className="z8-control mt-4 border border-red-300/30 px-4 text-white">Try again</button></div>}

      {loading && matchups.length === 0 && (
        <div className="grid sm:grid-cols-2 gap-3">{[0, 1, 2, 3].map((i) => <div key={i} className={`h-52 rounded-2xl ${Z8_SURFACE} animate-pulse`} />)}</div>
      )}

      {!error && matchups.length > 0 && (
        shown.length === 0 ? (
          <div className={`${Z8_PANEL_PREMIUM} p-10 text-center text-sm text-white/55`}><p>No games are live right now.</p><button type="button" onClick={() => setLiveOnly(false)} className="z8-control mt-4 border border-white/15 px-4 text-white">Show today&apos;s schedule</button></div>
        ) : (
          <div className="space-y-4 min-w-0">
            {activeGame && (
              <div className={`relative overflow-hidden rounded-2xl sm:rounded-3xl border border-vouch-cyan/30 bg-gradient-to-br from-obsidian-900 via-obsidian-800 to-vouch-cyan/10 p-3 sm:p-4 md:p-5 shadow-2xl ${Z8_PANEL_PREMIUM}`}>
                <div className="absolute -top-24 -right-20 h-56 w-56 rounded-full bg-vouch-cyan/20 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -left-20 h-56 w-56 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

                <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mb-4 sm:mb-5 min-w-0">
                  <div className="min-w-0">
                    <p className={`${Z8_LABEL} text-vouch-cyan`}>
                      Current game
                    </p>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight truncate">
                      {activeGame.away.abbreviation} @ {activeGame.home.abbreviation}
                    </h2>
                    <p className="text-[11px] sm:text-xs text-slate-400 mt-1 truncate">
                      {activeGame.venue ?? 'Venue TBD'} · {activeGame.status ?? 'Game status unavailable'}
                    </p>
                  </div>

                  <div className={`self-start sm:self-auto rounded-full px-3 py-1 text-[10px] font-black font-mono uppercase tracking-wider border shrink-0 ${
                    activeGame.isFinal
                      ? 'bg-emerald-500/10 border-emerald-400/40 text-emerald-300'
                      : activeGame.isLive
                        ? 'bg-red-500/10 border-red-400/40 text-red-300'
                        : 'bg-slate-800/80 border-slate-600 text-slate-300'
                  }`}>
                    {activeGame.isFinal ? 'Final' : activeGame.isLive ? 'Live' : 'Scheduled'}
                  </div>
                </div>

                <div className="relative grid grid-cols-1 min-[400px]:grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-xl sm:rounded-2xl border border-slate-700/70 bg-black/25 p-3 sm:p-4 min-w-0">
                  <div className="text-left min-w-0">
                    <div className="flex items-center gap-2 mb-1 sm:mb-2">
                      <TeamLogo src={activeGame.away.logo} alt={activeGame.away.name} size={28} />
                      <div className="min-w-0">
                        <p className="text-[10px] sm:text-xs text-slate-400 font-mono">AWAY</p>
                        <p className="text-base sm:text-lg font-black text-white">{activeGame.away.abbreviation}</p>
                      </div>
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 truncate">{activeGame.away.name}</p>
                  </div>

                  <div className="text-center px-1 sm:px-2 order-first min-[400px]:order-none">
                    <div className="flex items-center gap-2 sm:gap-3 justify-center">
                      <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black font-mono text-white tabular-nums">
                        {(activeGame.isLive || activeGame.isFinal) ? (activeGame.score?.away ?? 0) : '-'}
                      </span>
                      <span className="text-slate-600 text-xl sm:text-2xl font-black">–</span>
                      <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black font-mono text-white tabular-nums">
                        {(activeGame.isLive || activeGame.isFinal) ? (activeGame.score?.home ?? 0) : '-'}
                      </span>
                    </div>
                    <p className="text-[9px] sm:text-[10px] text-slate-500 font-mono uppercase mt-1 sm:mt-2">
                      {activeGame.isFinal ? 'Final score' : activeGame.isLive ? 'Live score' : 'Pregame'}
                    </p>
                  </div>

                  <div className="text-right min-w-0">
                    <div className="flex items-center justify-end gap-2 mb-1 sm:mb-2">
                      <div className="min-w-0">
                        <p className="text-[10px] sm:text-xs text-slate-400 font-mono">HOME</p>
                        <p className="text-base sm:text-lg font-black text-white">{activeGame.home.abbreviation}</p>
                      </div>
                      <TeamLogo src={activeGame.home.logo} alt={activeGame.home.name} size={28} />
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 truncate">{activeGame.home.name}</p>
                  </div>
                </div>

                <div className="relative grid grid-cols-2 lg:grid-cols-4 gap-2 mt-3 sm:mt-4">
                  <div className={`${Z8_STAT_CHIP} rounded-xl sm:rounded-2xl p-2.5 sm:p-3 min-w-0`}>
                    <p className="text-[10px] text-slate-500 font-mono uppercase">Game state</p>
                    <p className="text-sm font-black text-slate-100">{activeGame.isFinal ? 'Final' : activeGame.isLive ? 'Live now' : 'Scheduled'}</p>
                  </div>
                  <div className={`${Z8_STAT_CHIP} rounded-xl sm:rounded-2xl p-2.5 sm:p-3 min-w-0`}>
                    <p className="text-[10px] text-slate-500 font-mono uppercase">HR watch</p>
                    <p className="text-sm font-black text-slate-100">{activeGame.topHrWatch?.length ?? 0} players</p>
                  </div>
                  <div className={`${Z8_STAT_CHIP} rounded-xl sm:rounded-2xl p-2.5 sm:p-3 min-w-0`}>
                    <p className="text-[10px] text-slate-500 font-mono uppercase">Pitching</p>
                    <p className="text-sm font-black text-slate-100 truncate">{activeGame.away.probablePitcher?.name ?? activeGame.home.probablePitcher?.name ?? 'TBD'}</p>
                  </div>
                  <button
                    onClick={() => setSelected(activeGame)}
                    className="z8-control min-w-0 border border-vouch-emerald/40 bg-vouch-emerald/10 p-2.5 text-left transition hover:bg-vouch-emerald/15 sm:p-3"
                  >
                    <p className="text-[11px] font-mono uppercase text-vouch-emerald">Details</p>
                    <p className="text-sm font-black text-white">Open matchup</p>
                  </button>
                </div>

              </div>
            )}

            <div className="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {shown.map((m) => (
                <button
                  key={m.gamePk}
                  onClick={() => setActiveGamePk(m.gamePk)}
                  className={`z8-control min-w-0 text-left border p-2.5 transition-all sm:p-3 ${
                    String(activeGame?.gamePk) === String(m.gamePk)
                      ? 'bg-sky-500/15 border-sky-500/50'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-600'
                  }`}
                >
                  <p className="text-[10px] font-mono text-slate-500">{m.isLive ? 'LIVE' : (m.status ?? 'GAME')}</p>
                  <p className="text-sm font-black text-slate-100">{m.away.abbreviation} @ {m.home.abbreviation}</p>
                  <p className="text-[11px] text-slate-400 truncate">{m.venue ?? 'Venue TBD'}</p>
                </button>
              ))}
            </div>

            {activeGame && !activeGame.isLive && !activeGame.isFinal && (
              <div className="mt-6">
                <PregameAiReadPanel game={activeGame} />
              </div>
            )}

            {activeGame?.isFinal && (
              <div className="mt-6">
                <FinalGameRecapPanel game={activeGame} />
              </div>
            )}

            {/* Pitch-by-pitch sweat screen for the selected live game */}
            {activeGame?.isLive && activeGame.gamePk != null && (
              <div className="min-w-0 max-w-4xl mx-auto w-full">
                <LiveAtBatView gamePk={Number(activeGame.gamePk)} />
              </div>
            )}

          </div>
        )
      )}

      {selected && <MatchupDrawer m={selected} onClose={() => setSelected(null)} onAddLeg={addLeg} />}

    </main>
  );
}
