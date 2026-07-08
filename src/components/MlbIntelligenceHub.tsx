import { cachedJsonFetch } from '../lib/clientApiCache';
import { apiClient } from '../lib/apiClient';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Brain,
  Flame,
  RefreshCw,
  ShieldCheck,
  Target,
  Zap,
} from 'lucide-react';
import PlayerHeadshot from './parlays/PlayerHeadshot';

type Props = {
  profile?: any;
  [key: string]: any;
};

type Candidate = {
  playerId?: number | string;
  playerName?: string;
  name?: string;
  headshotUrl?: string | null;
  headshot?: string | null;
  team?: string;
  opponent?: string;
  opponentTeam?: string;
  opponentPitcherName?: string;
  venue?: string;
  gamePk?: number | string;
  gameId?: number | string;
  hrScore?: number;
  riskTier?: string;
  confidenceTier?: string;
  estimatedHrProbability?: number;
  reasons?: string[];
  warnings?: string[];
  scoreBreakdown?: Record<string, number>;
};

type IntelligenceReport = {
  date: string;
  gameCount: number;
  dataQuality: string;
  disclaimer: string;
  candidates: Candidate[];
};

type AiJudgePick = {
  rank: number;
  playerId?: number | string | null;
  playerName: string;
  team: string;
  headshotUrl?: string | null;
  headshot?: string | null;
  opponent: string;
  opponentPitcherName?: string;
  venue?: string;
  pickType: string;
  market: string;
  hrScore: number;
  agentScore: number;
  confidenceTier?: string | null;
  riskTier?: string | null;
  availability?: {
    status: string;
    label: string;
    parlayEligible: boolean;
    reasons: string[];
  };
  parlayEligible?: boolean;
};

type AiJudge = {
  id: string;
  displayName: string;
  handle: string;
  tagline: string;
  persona: string;
  color: string;
  trustScore: number;
  winRate: number | null;
  record: {
    won: number;
    lost: number;
    pushed: number;
    graded: number;
    pending: number;
    netUnits: number;
  };
  topPicks: AiJudgePick[];
  parlayBuilder?: {
    judgeId: string;
    judgeName: string;
    suggestedParlayName: string;
    maxLegs: number;
    legs: unknown[];
  };
};

type AiJudgeLeaderboard = {
  status: string;
  date: string;
  candidateCount: number;
  leaderboard: AiJudge[];
};

type Tab = 'overview' | 'targets' | 'pitchers' | 'games' | 'judges' | 'agents';

const safeArray = <T,>(value: unknown): T[] => Array.isArray(value) ? value as T[] : [];

const num = (value: unknown, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const pct = (value: unknown) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  if (n <= 1) return `${(n * 100).toFixed(1)}%`;
  return `${n.toFixed(1)}%`;
};

const cleanName = (c: Candidate) => c.playerName || c.name || 'Unknown player';
const cleanOpponent = (c: Candidate) => c.opponent || c.opponentTeam || 'TBD';
const cleanPitcher = (c: Candidate) => c.opponentPitcherName || 'Pitcher TBD';

async function loadHrBoardIntelligence(): Promise<IntelligenceReport> {
  const res = await cachedJsonFetch<any>('/api/mlb/hr-board/today', {}, 45000);
  if (!res.ok) throw new Error(`HR board request failed: ${res.status}`);

  const raw = await res.json();
  const payload = raw?.payload ?? raw ?? {};

  const candidates = [
    ...safeArray<Candidate>(payload.candidates),
    ...safeArray<Candidate>(payload.projectedCandidates),
  ];

  return {
    date: payload.date ?? raw.date ?? new Date().toISOString().slice(0, 10),
    gameCount: num(payload.gameCount, 0),
    dataQuality: payload.dataQuality ?? payload.data_quality ?? 'hr_board_projection',
    disclaimer:
      payload.disclaimer ??
      'Premium MLB AI research powered by the HR Board engine. Track HR targets, pitcher pressure, game environments, judge rankings, and parlay-ready signals.',
    candidates,
  };
}

function PixelAgentIcon({ code }: { code: string }) {
  const theme: Record<string, { main: string; glow: string; accent: string; active: number[] }> = {
    DS: { main: 'bg-sky-300', glow: 'bg-sky-500/25', accent: 'bg-cyan-300/80', active: [1, 2, 5, 6, 9, 10, 13, 14] },
    PH: { main: 'bg-red-300', glow: 'bg-red-500/25', accent: 'bg-orange-300/80', active: [0, 3, 5, 6, 9, 10, 12, 15] },
    MR: { main: 'bg-violet-300', glow: 'bg-violet-500/25', accent: 'bg-fuchsia-300/80', active: [1, 4, 6, 9, 11, 13, 14] },
    RA: { main: 'bg-amber-300', glow: 'bg-amber-500/25', accent: 'bg-yellow-200/80', active: [0, 1, 2, 4, 8, 12, 13, 14] },
    PE: { main: 'bg-emerald-300', glow: 'bg-emerald-500/25', accent: 'bg-lime-300/80', active: [2, 5, 6, 7, 8, 9, 10, 13] },
  };

  const t = theme[code] ?? theme.DS;

  return (
    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-inner">
      <div className={`absolute inset-0 ${t.glow} blur-xl`} />
      <div className="absolute inset-1 grid grid-cols-4 grid-rows-4 gap-[2px]">
        {Array.from({ length: 16 }).map((_, i) => (
          <span
            key={i}
            className={`rounded-[2px] ${
              t.active.includes(i)
                ? t.main
                : [0, 5, 10, 15].includes(i)
                  ? t.accent
                  : 'bg-slate-800'
            }`}
          />
        ))}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="rounded-md bg-black/75 px-1.5 py-0.5 text-[10px] font-black font-mono text-white shadow">
          {code}
        </span>
      </div>
    </div>
  );
}

function StatTile({ label, value, tone = 'slate' }: { label: string; value: React.ReactNode; tone?: 'slate' | 'sky' | 'emerald' | 'amber' }) {
  const toneClass =
    tone === 'sky' ? 'text-sky-300 border-sky-400/20 bg-sky-400/5' :
    tone === 'emerald' ? 'text-emerald-300 border-emerald-400/20 bg-emerald-400/5' :
    tone === 'amber' ? 'text-amber-300 border-amber-400/20 bg-amber-400/5' :
    'text-slate-200 border-slate-700 bg-slate-950/50';

  return (
    <div className={`rounded-2xl border p-3 ${toneClass}`}>
      <p className="text-[10px] font-mono uppercase tracking-wider opacity-70">{label}</p>
      <div className="mt-1 text-xl font-black">{value}</div>
    </div>
  );
}

function CandidateCard({ c, rank }: { c: Candidate; rank: number }) {
  const score = num(c.hrScore, 0);
  const reasons = safeArray<string>(c.reasons).slice(0, 3);
  const warnings = safeArray<string>(c.warnings).slice(0, 2);
  const breakdown = c.scoreBreakdown ?? {};

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4 hover:border-sky-400/30 transition">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <PlayerHeadshot name={cleanName(c)} playerId={c.playerId} headshotUrl={c.headshotUrl ?? c.headshot} size={54} />
          <div className="min-w-0">
            <p className="text-[10px] font-mono text-slate-500">#{rank}</p>
            <h3 className="truncate text-lg font-black text-white">{cleanName(c)}</h3>
            <p className="text-xs text-slate-400">
              {c.team ?? 'TBD'} vs {cleanOpponent(c)} · {cleanPitcher(c)}
            </p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[10px] font-mono text-slate-500">HR edge</p>
          <p className="text-2xl font-black text-sky-300">{score}</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <StatTile label="Tier" value={c.riskTier ?? c.confidenceTier ?? 'Watch'} tone="amber" />
        <StatTile label="Est. HR" value={pct(c.estimatedHrProbability)} tone="emerald" />
        <StatTile label="Venue" value={<span className="text-sm">{c.venue ?? 'TBD'}</span>} />
      </div>

      <div className="mt-3 rounded-2xl border border-slate-800 bg-black/20 p-3">
        <p className="mb-2 text-[10px] font-black font-mono uppercase tracking-wider text-slate-500">
          AI read
        </p>
        {reasons.length ? (
          <ul className="space-y-1">
            {reasons.map((r, i) => (
              <li key={i} className="text-xs text-slate-300">• {r}</li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-slate-500">No reasons returned yet.</p>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {Object.entries(breakdown).slice(0, 5).map(([key, value]) => (
          <span key={key} className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] font-mono text-slate-300">
            {key}: {Math.round(num(value))}
          </span>
        ))}
      </div>

      {warnings.length > 0 && (
        <div className="mt-3 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-2">
          {warnings.map((w, i) => (
            <p key={i} className="text-[11px] text-amber-200">⚠ {w}</p>
          ))}
        </div>
      )}
    </div>
  );
}

async function loadAiJudgeLeaderboard(): Promise<AiJudgeLeaderboard> {
  return apiClient.get<AiJudgeLeaderboard>('/api/ai-judges/leaderboard');
}

function availabilityTone(status?: string) {
  const value = String(status ?? '').toLowerCase();
  if (value === 'confirmed') return 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200';
  if (value === 'projected') return 'border-sky-400/30 bg-sky-400/10 text-sky-200';
  if (value === 'avoid') return 'border-red-400/30 bg-red-400/10 text-red-200';
  return 'border-amber-400/30 bg-amber-400/10 text-amber-200';
}

async function copyJudgeParlayLegs(judge: AiJudge, onCopied?: (message: string) => void) {
  const picks = safeArray<AiJudgePick>(judge.topPicks)
    .filter((pick) => pick.parlayEligible)
    .slice(0, 5);

  if (picks.length === 0) return;

  const lines = [
    `${judge.displayName} Top HR Parlay`,
    '',
    ...picks.map((pick, index) => `${index + 1}. ${pick.playerName} HR — ${pick.team} vs ${pick.opponent}`),
    '',
    'Built from VouchEdge AI Judge Leaderboard.',
    'Research only. Not betting advice.',
  ];

  await navigator.clipboard.writeText(lines.join('\n'));
  onCopied?.(`${judge.displayName} parlay legs copied.`);
}


function JudgeCard({ judge }: { judge: AiJudge }) {
  const isRisk = judge.id === 'risk_auditor';
  const picks = Array.isArray(judge.topPicks) ? judge.topPicks.slice(0, 5) : [];
  const eligibleLegs = picks.filter((p) => p.parlayEligible);

  return (
    <article className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5 shadow-xl shadow-black/20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.24em] text-sky-300">
            {isRisk ? 'Trap Watch Agent' : 'AI Capper'}
          </div>
          <h3 className="mt-1 text-2xl font-black text-white">{judge.displayName}</h3>
          <p className="mt-1 text-sm text-slate-400">{judge.tagline}</p>
          <p className="mt-2 max-w-2xl text-xs text-slate-500">{judge.persona}</p>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <StatTile label="Win Rate" value={judge.winRate == null ? 'New' : `${judge.winRate}%`} tone="emerald" />
          <StatTile label="Trust" value={String(Math.round(Number(judge.trustScore ?? 50)))} tone="sky" />
          <StatTile label="Record" value={`${judge.record?.won ?? 0}-${judge.record?.lost ?? 0}`} tone="slate" />
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-800 bg-black/20 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              {isRisk ? 'Top 5 Avoid / Risk Flags' : 'Top 5 Current Picks'}
            </p>
            <p className="text-xs text-slate-400">
              {isRisk ? 'These are warning profiles, not parlay legs.' : `${eligibleLegs.length} parlay-ready legs available.`}
            </p>
          </div>

          {!isRisk && (
            <button
              type="button"
              onClick={() => {
                void copyJudgeParlayLegs(judge);
              }}
              disabled={eligibleLegs.length === 0}
              className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs font-black text-emerald-200 hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-40"
              title={eligibleLegs.length === 0 ? "No parlay-ready picks yet" : "Copy this judge's parlay legs"}
            >
              Copy Parlay Card
            </button>
          )}
        </div>

        <div className="space-y-2">
          {picks.length === 0 ? (
            <p className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-sm text-slate-500">
              No judge picks available yet.
            </p>
          ) : (
            picks.map((pick) => (
              <div key={`${judge.id}-${pick.rank}-${pick.playerName}`} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <PlayerHeadshot name={pick.playerName} playerId={pick.playerId} headshotUrl={pick.headshotUrl ?? pick.headshot} size={42} />
                    <div className="min-w-0">
                      <p className="text-sm font-black text-white">
                        #{pick.rank} {pick.playerName}
                        <span className="ml-2 text-xs font-normal text-slate-500">
                          {pick.team} vs {pick.opponent}
                        </span>
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {pick.market} · Agent Score {pick.agentScore} · HR Edge {pick.hrScore}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        Pitcher: {pick.opponentPitcherName ?? 'TBD'} · Venue: {pick.venue ?? 'TBD'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    <span className={`rounded-full border px-2 py-1 text-[10px] font-bold ${availabilityTone(pick.availability?.status)}`}>
                      {pick.availability?.label ?? 'Availability unknown'}
                    </span>
                    <span className={`rounded-full border px-2 py-1 text-[10px] font-bold ${
                      pick.parlayEligible
                        ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
                        : 'border-slate-700 bg-slate-800 text-slate-400'
                    }`}>
                      {pick.parlayEligible ? 'Parlay-ready' : 'No parlay'}
                    </span>
                  </div>
                </div>

                {pick.availability?.reasons?.length ? (
                  <div className="mt-2 text-[11px] text-slate-500">
                    {pick.availability.reasons.slice(0, 2).join(' · ')}
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      </div>
    </article>
  );
}

export default function MlbIntelligenceHub(_props: Props) {
  const [tab, setTab] = useState<Tab>('overview');
  const [report, setReport] = useState<IntelligenceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [judgeBoard, setJudgeBoard] = useState<AiJudgeLeaderboard | null>(null);
  const [judgeLoading, setJudgeLoading] = useState(false);
  const [judgeError, setJudgeError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await loadHrBoardIntelligence();
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI Edge Lab unavailable.');
      setReport({
        date: new Date().toISOString().slice(0, 10),
        gameCount: 0,
        dataQuality: 'offline',
        disclaimer: 'AI Edge Lab is temporarily unavailable. No fake data shown.',
        candidates: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const loadJudges = async () => {
    setJudgeLoading(true);
    setJudgeError(null);
    try {
      const data = await loadAiJudgeLeaderboard();
      setJudgeBoard(data);
    } catch (err) {
      setJudgeError(err instanceof Error ? err.message : 'AI Judge leaderboard unavailable.');
      setJudgeBoard(null);
    } finally {
      setJudgeLoading(false);
    }
  };

  useEffect(() => {
    void load();
    void loadJudges();
  }, []);

  const candidates = safeArray<Candidate>(report?.candidates);

  const topTargets = useMemo(
    () => [...candidates].sort((a, b) => num(b.hrScore) - num(a.hrScore)).slice(0, 12),
    [candidates]
  );

  const pitcherGroups = useMemo(() => {
    const groups = new Map<string, Candidate[]>();
    for (const c of candidates) {
      const key = cleanPitcher(c);
      groups.set(key, [...(groups.get(key) ?? []), c]);
    }
    return Array.from(groups.entries())
      .map(([pitcher, rows]) => ({
        pitcher,
        rows,
        topScore: Math.max(0, ...rows.map((r) => num(r.hrScore))),
        threats: rows.length,
        venue: rows[0]?.venue ?? 'Venue TBD',
      }))
      .sort((a, b) => b.topScore - a.topScore)
      .slice(0, 10);
  }, [candidates]);

  const gameGroups = useMemo(() => {
    const groups = new Map<string, Candidate[]>();
    for (const c of candidates) {
      const key = `${c.team ?? 'TBD'} vs ${cleanOpponent(c)} · ${c.venue ?? 'Venue TBD'}`;
      groups.set(key, [...(groups.get(key) ?? []), c]);
    }
    return Array.from(groups.entries())
      .map(([game, rows]) => ({
        game,
        rows,
        avgScore: Math.round(rows.reduce((sum, r) => sum + num(r.hrScore), 0) / Math.max(rows.length, 1)),
        threats: rows.filter((r) => num(r.hrScore) >= 65).length,
      }))
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 10);
  }, [candidates]);

  const agents = [
    { code: 'DS', name: 'Data Scout', role: 'Math-first game reads', focus: 'Checks slate rank, data quality, score logic, and weak spots.', signal: 'Clean math' },
    { code: 'PH', name: 'Power Hunter', role: 'HR threat radar', focus: 'Finds hitters with power paths, HR edge, and pitcher mistake zones.', signal: 'Power spike' },
    { code: 'MR', name: 'Momentum Reader', role: 'Game rhythm', focus: 'Reads recent form, pressure windows, and late-game opportunity.', signal: 'Momentum' },
    { code: 'RA', name: 'Risk Auditor', role: 'Skeptical filter', focus: 'Flags missing data, projected lineups, and fake confidence traps.', signal: 'Risk check' },
    { code: 'PE', name: 'Pro Edge Agent', role: 'Premium paths', focus: 'Unlocks RBI, stolen bases, bullpen fatigue, and live parlay impact.', signal: 'Pro locked' },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 text-slate-100">
      <div className="mb-5 overflow-hidden rounded-3xl border border-emerald-400/25 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/30 p-5 shadow-2xl relative">
        <div className="absolute -top-24 -right-24 h-60 w-60 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-60 w-60 rounded-full bg-sky-500/10 blur-3xl" />

        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-300" />
              <p className="text-[10px] font-black font-mono uppercase tracking-[0.3em] text-emerald-300">
                AI game room
              </p>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white">
              VouchEdge AI Edge Lab
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              A safer AI scouting room powered by the working HR Board engine. It converts today’s hitter pool into game reads, pitcher pressure, HR threats, sneaky edges, and Pro-style intelligence.
            </p>
          </div>

          <button
            onClick={load}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm font-black text-emerald-200 hover:bg-emerald-400/15"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="relative mt-5 grid grid-cols-2 gap-2 md:grid-cols-4">
          <StatTile label="Date" value={<span className="text-base">{report?.date ?? '—'}</span>} />
          <StatTile label="Games" value={report?.gameCount ?? 0} tone="sky" />
          <StatTile label="Hitters" value={candidates.length} tone="emerald" />
          <StatTile label="Data" value={<span className="text-base">{report?.dataQuality ?? 'loading'}</span>} tone="amber" />
        </div>

        <div className="relative mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          {agents.map((agent) => (
            <div key={agent.code} className="group rounded-2xl border border-slate-700/70 bg-slate-950/55 p-3 hover:border-emerald-400/35 hover:bg-slate-900/70 transition">
              <div className="flex items-center gap-3">
                <PixelAgentIcon code={agent.code} />
                <div>
                  <p className="text-sm font-black text-slate-100">{agent.name}</p>
                  <p className="text-[10px] text-slate-500 font-mono uppercase">{agent.role}</p>
                </div>
              </div>
              <p className="mt-2 text-[11px] text-slate-400 leading-relaxed">{agent.focus}</p>
              <div className="mt-3 inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-400/5 px-2 py-1 text-[10px] font-black font-mono uppercase tracking-wider text-emerald-300">
                {agent.signal}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-5 rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-3">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
          <p className="text-xs text-slate-400">
            {report?.disclaimer ?? 'Research only — not betting advice. No guaranteed outcomes.'}
          </p>
        </div>
        {error && <p className="mt-2 text-xs text-amber-300">Fallback mode: {error}</p>}
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {[
          ['overview', 'Overview', Brain],
          ['targets', 'HR Targets', Target],
          ['pitchers', 'Pitcher Pressure', Activity],
          ['games', 'Game Environments', Zap],
          ['judges', 'Judge Leaderboard', Flame],
        ].map(([id, label, Icon]) => {
          const active = tab === id;
          const I = Icon as typeof Brain;
          return (
            <button
              key={String(id)}
              onClick={() => setTab(id as Tab)}
              className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-black transition ${
                active
                  ? 'border-emerald-400/40 bg-emerald-400/15 text-emerald-200'
                  : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-600'
              }`}
            >
              <I className="h-4 w-4" />
              {String(label)}
            </button>
          );
        })}
      </div>

      {loading && (
        <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-8 text-center text-slate-400">
          Loading AI Edge Lab…
        </div>
      )}

      {!loading && candidates.length === 0 && (
        <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-8 text-center">
          <p className="text-lg font-black text-white">No intelligence rows available yet.</p>
          <p className="mt-2 text-sm text-slate-400">
            The page is safe and no fake data is shown. Refresh once the HR Board endpoint returns candidates.
          </p>
        </div>
      )}

      {!loading && candidates.length > 0 && tab === 'overview' && (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 grid gap-4 md:grid-cols-2">
            {topTargets.slice(0, 6).map((c, i) => (
              <CandidateCard key={`${cleanName(c)}-${i}`} c={c} rank={i + 1} />
            ))}
          </div>
          <div className="space-y-3">
            <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="mb-3 text-sm font-black text-white">Pitcher pressure board</p>
              {pitcherGroups.slice(0, 6).map((p, i) => (
                <div key={p.pitcher} className="mb-2 rounded-2xl border border-slate-800 bg-black/20 p-3">
                  <p className="text-sm font-black text-slate-100">#{i + 1} {p.pitcher}</p>
                  <p className="text-xs text-slate-500">{p.threats} hitters · top HR edge {p.topScore} · {p.venue}</p>
                </div>
              ))}
            </div>
            <div className="rounded-3xl border border-amber-400/20 bg-amber-400/5 p-4">
              <p className="text-[10px] font-black font-mono uppercase text-amber-300">🔒 Pro Intel</p>
              <p className="mt-1 text-sm font-black text-white">RBI windows, stolen bases, bullpen fatigue, pitch mix, and live parlay impact.</p>
            </div>
          </div>
        </div>
      )}

      {!loading && candidates.length > 0 && tab === 'targets' && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {topTargets.map((c, i) => <CandidateCard key={`${cleanName(c)}-target-${i}`} c={c} rank={i + 1} />)}
        </div>
      )}

      {!loading && candidates.length > 0 && tab === 'pitchers' && (
        <div className="grid gap-4 md:grid-cols-2">
          {pitcherGroups.map((p, i) => (
            <div key={p.pitcher} className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-mono text-slate-500">#{i + 1} pressure target</p>
                  <h3 className="text-lg font-black text-white">{p.pitcher}</h3>
                  <p className="text-xs text-slate-400">{p.venue}</p>
                </div>
                <StatTile label="Top edge" value={p.topScore} tone="amber" />
              </div>
              <div className="mt-3 grid gap-2">
                {p.rows.slice(0, 4).map((c, idx) => (
                  <div key={`${cleanName(c)}-${idx}`} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-black/20 p-3">
                    <span className="flex min-w-0 items-center gap-2 text-sm font-bold text-slate-200">
                      <PlayerHeadshot name={cleanName(c)} playerId={c.playerId} headshotUrl={c.headshotUrl ?? c.headshot} size={32} />
                      <span className="truncate">{cleanName(c)}</span>
                    </span>
                    <span className="text-sm font-black text-sky-300">{num(c.hrScore)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && candidates.length > 0 && tab === 'games' && (
        <div className="grid gap-4 md:grid-cols-2">
          {gameGroups.map((g, i) => (
            <div key={g.game} className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-[10px] font-mono text-slate-500">#{i + 1} run environment</p>
              <h3 className="text-lg font-black text-white">{g.game}</h3>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <StatTile label="Avg edge" value={g.avgScore} tone="sky" />
                <StatTile label="Threats" value={g.threats} tone="emerald" />
                <StatTile label="Hitters" value={g.rows.length} />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && tab === 'judges' && (
        <section className="space-y-5">
          <div className="rounded-3xl border border-sky-400/20 bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950/20 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-sky-300">
                  Premium AI Judge Board
                </p>
                <h2 className="mt-1 text-2xl font-black text-white">AI Judge Leaderboard</h2>
                <p className="mt-2 max-w-3xl text-sm text-slate-400">
                  Compare each AI judge’s current top picks, availability checks, parlay-ready legs, trust score, and record.
                  Risk Auditor flags avoid spots and should not be used to build parlays.
                </p>
              </div>
              <button
                onClick={loadJudges}
                className="rounded-2xl border border-sky-400/30 bg-sky-400/10 px-4 py-2 text-sm font-black text-sky-200 hover:bg-sky-400/20"
              >
                Refresh Judges
              </button>
            </div>
          </div>

          {judgeLoading && (
            <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6 text-slate-300">
              Loading AI Judge leaderboard...
            </div>
          )}

          {judgeError && (
            <div className="rounded-3xl border border-red-400/30 bg-red-950/30 p-6 text-red-200">
              {judgeError}
            </div>
          )}

          {!judgeLoading && !judgeError && (
            <div className="space-y-5">
              {safeArray<AiJudge>(judgeBoard?.leaderboard).map((judge) => (
                <JudgeCard key={judge.id} judge={judge} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
