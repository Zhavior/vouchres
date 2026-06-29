import React, { useState, useEffect, useCallback } from 'react';
import {
  Tv, RefreshCw, Flame, AlertTriangle, ChevronRight, X, Gavel, Activity, CloudSun, Plus, Radio,
} from 'lucide-react';
import { vouchedgeApi } from '../api/vouchedgeApi';
import type { GameMatchup, HrWatch } from '../types/matchup';
import type { MLBPlayer } from '../types';
import type { HrBoardResponse } from '../types/hrBoard';
import { logoByTeamId, logoByTeamName } from '../lib/teamLogos';

interface Props {
  onSectionChange: (section: string) => void;
  onAddLegToParlay: (player: MLBPlayer, prop: { id: string; market: string; odds: number; spec: string }) => void;
}

const REFRESH_MS = 3 * 60_000;

function americanToDecimal(am: string): number {
  const n = parseInt(am, 10);
  if (isNaN(n)) return 2.0;
  return n > 0 ? 1 + n / 100 : 1 + 100 / Math.abs(n);
}
function vulnColor(v: number): string {
  if (v >= 70) return '#f87171';
  if (v >= 55) return '#fbbf24';
  return '#34d399';
}
function gradeColor(g: string): string {
  return g === 'A+' || g === 'A' ? '#34d399' : g === 'B' ? '#22d3ee' : g === 'C' ? '#fbbf24' : '#f87171';
}
const FORM_COLOR: Record<string, string> = { Hot: '#fb7185', Average: '#94a3b8', Cold: '#60a5fa', Slump: '#64748b' };

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
  const sourceRows = Array.isArray(board.candidates) && board.candidates.length > 0
    ? board.candidates
    : Array.isArray(board.projectedCandidates)
      ? board.projectedCandidates
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
  return <img src={src} alt={alt} width={size} height={size} loading="lazy"
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

const GameCard: React.FC<{ m: GameMatchup; onOpen: () => void }> = ({ m, onOpen }) => {
  const winProbability = m.winProbability ?? { away: 0, home: 0 };
  const topHrWatch = Array.isArray(m.topHrWatch) ? m.topHrWatch : [];
  const homeFav = winProbability.home >= winProbability.away;
  return (
    <button onClick={onOpen}
      className={`text-left rounded-2xl border p-4 transition-all hover:scale-[1.01] w-full ${m.isLive ? 'border-red-500/30 bg-gradient-to-br from-red-950/20 via-[#0b1120] to-[#0b1120] shadow-[0_0_24px_rgba(239,68,68,0.12)]' : 'border-slate-800 bg-gradient-to-br from-slate-900/40 to-[#0b1120]'}`}>
      <div className="flex items-center justify-between mb-3">
        <StatusBadge m={m} />
        <span className="text-[10px] text-slate-500 font-mono truncate max-w-[55%]">{m.venue}</span>
      </div>

      {/* Teams */}
      {[m.away, m.home].map((t, i) => {
        const pct = i === 0 ? winProbability.away : winProbability.home;
        const fav = i === 0 ? !homeFav : homeFav;
        const score = i === 0 ? m.score?.away : m.score?.home;
        return (
          <div key={`${t.teamId}-${t.name}`} className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <TeamLogo src={t.logo} alt={t.name} />
              <div className="min-w-0">
                <p className={`text-sm font-black truncate ${fav ? 'text-slate-100' : 'text-slate-300'}`}>{t.name}</p>
                <p className="text-[10px] text-slate-500 font-mono">{t.record ? `${t.record.wins}-${t.record.losses}` : '—'} · {safePct(pct)} win</p>
              </div>
            </div>
            <span className="text-xl font-mono font-black text-white">{(m.isLive || m.isFinal) ? score : ''}</span>
          </div>
        );
      })}

      {/* Win prob bar */}
      <div className="mt-1 h-1.5 rounded-full overflow-hidden bg-slate-800 flex">
        <div style={{ width: `${winProbability.away}%`, background: '#64748b' }} />
        <div style={{ width: `${winProbability.home}%`, background: '#0ea5e9' }} />
      </div>

      {/* Run env + top HR watch */}
      <div className="flex items-center justify-between mt-3">
        {m.runEnvironment && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded border" style={{ color: ENV_COLOR[m.runEnvironment.tier] ?? '#94a3b8', borderColor: (ENV_COLOR[m.runEnvironment.tier] ?? '#94a3b8') + '44' }}>
            🔥 {m.runEnvironment.tier} RUN ENV
          </span>
        )}
        <span className="flex items-center gap-1 text-[10px] text-sky-400 font-bold">AI Breakdown <ChevronRight className="w-3 h-3" /></span>
      </div>

      {topHrWatch.length > 0 && (
        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-800/60">
          <span className="text-[9px] text-slate-500 font-mono uppercase mr-1">HR Watch</span>
          {topHrWatch.slice(0, 3).map((w) => (
            <span key={w.playerId} className="flex items-center gap-1">
              <img src={w.headshot} alt={w.playerName} loading="lazy" referrerPolicy="no-referrer" className="w-5 h-5 rounded-full object-cover bg-slate-900 border border-slate-700" />
              <span className="text-[10px] text-slate-300 truncate max-w-[70px]">{w.playerName.split(' ').slice(-1)[0]}</span>
              <span className="text-[9px] font-mono font-bold" style={{ color: gradeColor(w.grade) }}>{w.hrEdge}</span>
            </span>
          ))}
        </div>
      )}
    </button>
  );
};

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
      <div className="relative w-full max-w-lg h-full bg-[#0b1120] border-l border-slate-800 overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#0b1120]/95 backdrop-blur border-b border-slate-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TeamLogo src={m.away.logo} alt={m.away.name} size={26} />
            <span className="text-sm font-black text-slate-100">{m.away.abbreviation} @ {m.home.abbreviation}</span>
            <TeamLogo src={m.home.logo} alt={m.home.name} size={26} />
            <StatusBadge m={m} />
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-4 space-y-5">
          {/* Win probability */}
          <Section icon={Activity} title="Win probability (model)">
            <div className="flex items-center justify-between text-sm font-black mb-1.5">
              <span className={!homeFav ? 'text-sky-400' : 'text-slate-300'}>{m.away.abbreviation} {safePct(winProbability.away)}</span>
              <span className={homeFav ? 'text-sky-400' : 'text-slate-300'}>{safePct(winProbability.home)} {m.home.abbreviation}</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden bg-slate-800 flex mb-2">
              <div style={{ width: `${winProbability.away}%`, background: '#64748b' }} />
              <div style={{ width: `${winProbability.home}%`, background: '#0ea5e9' }} />
            </div>
            <ul className="space-y-0.5">{(m.winProbModel ?? []).map((r, i) => <li key={i} className="text-[11px] text-slate-400">• {r}</li>)}</ul>
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
                  <img src={w.headshot} alt={w.playerName} loading="lazy" referrerPolicy="no-referrer" className="w-9 h-9 rounded-lg object-cover bg-slate-900 border border-slate-800 flex-shrink-0" />
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

export default function LiveGamesPro({ onSectionChange, onAddLegToParlay }: Props) {
  const [matchups, setMatchups] = useState<GameMatchup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liveOnly, setLiveOnly] = useState(false);
  const [selected, setSelected] = useState<GameMatchup | null>(null);
  const [activeGamePk, setActiveGamePk] = useState<number | string | null>(null);
  const [sourceNote, setSourceNote] = useState('Loading live games...');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSourceNote('Loading live games...');

    let fastLoaded = false;
    try {
      const board = await withTimeout(vouchedgeApi.hrBoardToday(50), 7000, 'HR board preview');
      const fastMatchups = buildMatchupsFromHrBoard(board);
      if (fastMatchups.length > 0) {
        fastLoaded = true;
        setMatchups(fastMatchups);
        setSourceNote('Live games loaded. Enriching game context...');
        setLoading(false);
      }
    } catch {
      setSourceNote('Live games preview unavailable. Trying matchup model...');
    }

    try {
      const res = await withTimeout(vouchedgeApi.matchupsToday(), 9000, 'Live matchup model');
      const next = Array.isArray(res.matchups) ? res.matchups : [];
      if (next.length > 0) {
        setMatchups(next);
        setError(null);
        setSourceNote('Live game model loaded.');
      } else if (!fastLoaded) {
        setError('No live game data available. No fake games shown.');
        setSourceNote('No verified live game rows returned.');
      }
    } catch {
      if (fastLoaded) {
        setError(null);
        setSourceNote('Live model is slow/unavailable. Showing verified game preview.');
      } else {
        setError('Live games unavailable right now. No fake games shown.');
        setMatchups([]);
        setSourceNote('Backend unavailable.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); const id = setInterval(load, REFRESH_MS); return () => clearInterval(id); }, [load]);

  const liveCount = matchups.filter((m) => m.isLive).length;
  const shown = liveOnly ? matchups.filter((m) => m.isLive) : matchups;

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
      odds: americanToDecimal(w.impliedOdds),
      spec: `${w.playerName} Anytime HR`,
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-5 text-slate-100">
      {/* Header */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-sky-950/30 via-[#0b1120] to-[#0b1120] p-5 mb-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2"><Tv className="w-6 h-6 text-sky-400" /> Live Games Center</h1>
            <p className="text-xs text-slate-400 mt-1 max-w-md">Real MLB game cards with scores, inning context, HR watch, pitcher matchups, and Pro live-stat upgrades. No fake live data.</p>
            <p className="mt-2 text-[10px] font-mono uppercase tracking-wider text-cyan-300">{sourceNote}</p>
          </div>
          <button onClick={load} className="flex items-center gap-1.5 text-xs font-mono px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-sky-500/50 transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
        <div className="flex items-center gap-2 mt-4">
          <button onClick={() => setLiveOnly(false)} className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${!liveOnly ? 'bg-sky-500/15 border-sky-500/50 text-sky-300' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>All games ({matchups.length})</button>
          <button onClick={() => setLiveOnly(true)} className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${liveOnly ? 'bg-red-500/15 border-red-500/50 text-red-300' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
            <Radio className="w-3.5 h-3.5" /> Live only ({liveCount})
          </button>
        </div>
      </div>

      {error && <div className="p-6 rounded-2xl bg-red-500/5 border border-red-500/20 text-center text-sm text-red-300">{error}</div>}

      {loading && matchups.length === 0 && (
        <div className="grid sm:grid-cols-2 gap-3">{[0, 1, 2, 3].map((i) => <div key={i} className="h-52 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse" />)}</div>
      )}

      {!error && matchups.length > 0 && (
        shown.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500 font-mono rounded-2xl bg-slate-900/40 border border-slate-800">No active live games right now. Switch to “All games”.</div>
        ) : (
          <div className="space-y-4">
            {activeGame && (
              <div className="rounded-2xl border border-sky-500/30 bg-sky-500/5 p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <p className="text-[10px] font-black font-mono uppercase tracking-wider text-sky-300">Selected live game</p>
                    <h2 className="text-xl font-black text-slate-100">
                      {activeGame.away.abbreviation} @ {activeGame.home.abbreviation}
                    </h2>
                    <p className="text-xs text-slate-400">
                      {activeGame.status ?? 'Game status unavailable'} · {activeGame.venue ?? 'Venue TBD'}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelected(activeGame)}
                    className="text-xs font-black rounded-xl px-3 py-2 bg-sky-500/15 border border-sky-500/40 text-sky-200 hover:bg-sky-500/25"
                  >
                    Open details
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="rounded-xl bg-slate-950/50 border border-slate-800 p-3">
                    <p className="text-[10px] text-slate-500 font-mono">AWAY</p>
                    <p className="text-lg font-black">{activeGame.away.abbreviation}</p>
                  </div>
                  <div className="rounded-xl bg-slate-950/50 border border-slate-800 p-3">
                    <p className="text-[10px] text-slate-500 font-mono">HOME</p>
                    <p className="text-lg font-black">{activeGame.home.abbreviation}</p>
                  </div>
                  <div className="rounded-xl bg-slate-950/50 border border-slate-800 p-3">
                    <p className="text-[10px] text-slate-500 font-mono">LIVE STATE</p>
                    <p className="text-sm font-black">{activeGame.isLive ? 'Live now' : 'Not live'}</p>
                  </div>
                  <div className="rounded-xl bg-slate-950/50 border border-slate-800 p-3">
                    <p className="text-[10px] text-slate-500 font-mono">HR WATCH</p>
                    <p className="text-sm font-black">{activeGame.hrWatch?.length ?? 0} players</p>
                  </div>
                </div>

                <div className="mt-3 rounded-xl bg-slate-950/40 border border-slate-800 p-3">
                  <p className="text-[10px] font-black font-mono uppercase tracking-wider text-amber-300 mb-1">Pro live stats coming next</p>
                  <p className="text-xs text-slate-400">
                    Stolen bases, RBI tracker, total bases, pitch mix, pitch velocity, bullpen fatigue, runner-on-base context, and live parlay impact.
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-2 overflow-x-auto pb-2">
              {shown.map((m) => (
                <button
                  key={m.gamePk}
                  onClick={() => setActiveGamePk(m.gamePk)}
                  className={`min-w-[180px] text-left rounded-xl border p-3 transition-all ${
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

            <div className="grid sm:grid-cols-2 gap-3">
              {shown.map((m) => (
                <GameCard
                  key={m.gamePk}
                  m={m}
                  onOpen={() => {
                    setActiveGamePk(m.gamePk);
                    setSelected(m);
                  }}
                />
              ))}
            </div>
          </div>
        )
      )}

      {selected && <MatchupDrawer m={selected} onClose={() => setSelected(null)} onAddLeg={addLeg} />}
    </div>
  );
}
