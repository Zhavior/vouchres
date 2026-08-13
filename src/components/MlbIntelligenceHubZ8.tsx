import React, { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Brain,
  Flame,
  Plug,
  RefreshCw,
  Target,
  Zap,
  X,
} from 'lucide-react';
import { HrBrandIcon } from '../features/hr/components/HrBrandIcon';
import { useAiJudgeLeaderboard } from '../hooks/queries/useAiJudgeLeaderboard';
import { useAiAgentRegistry } from '../hooks/queries/useAiAgentRegistry';
import { useHrBoardToday } from '../hooks/queries/useHrBoardToday';
import type { HrBoardResponse } from '../types/hrBoard';
import type { NormalizedPlayerPayload } from '../adapters/normalized';
import PlayerHeadshot from './parlays/PlayerHeadshot';
import PlayerResearchDecisionCard from './player/PlayerResearchDecisionCard';
import AgentDock from './agents/AgentDock';
import ProGraphsLabPageZ8 from '../pages/pro/ProGraphsLabPageZ8';
import { useVerdict } from "@/features/brain-edge/hooks/useVerdict";
import VerdictPanel from "@/features/brain-edge/components/VerdictPanel";
import { usePickSelectionContext } from "@/features/brain-edge/context/PickSelectionContext";
import { hydrateAgentSlots } from '../services/agents/agentSlots';
import { 
  AURORA_ACTIVE, 
  AURORA_IDLE, 
  AURORA_LABEL, 
  AURORA_PAGE, 
  AURORA_PAGE_PAD_X, 
  AURORA_PAGE_PAD_Y, 
  AURORA_PANEL_PREMIUM, 
  AURORA_SECTION_HEADER, 
  AURORA_STAT_CHIP, 
  AURORA_SURFACE 
} from '../theme/auroraTokens';

type Props = {
  profile?: any;
  onSectionChange?: (section: string) => void;
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
  judgeId?: string;
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
  specialtyLabel?: string;
  singlePickLabel?: string;
  judgeReason?: string;
  hrScore: number;
  agentScore: number;
  confidenceTier?: string | null;
  riskTier?: string | null;
  warnings?: string[];
  gradeable?: boolean;
  isAvoidPick?: boolean;
  availability?: {
    status: string;
    label: string;
    gradeable?: boolean;
    reasons: string[];
  };
};

type AiJudge = {
  id: string;
  displayName: string;
  handle: string;
  tagline: string;
  persona: string;
  specialty?: string;
  color: string;
  trustScore: number;
  winRate: number | null;
  singlePickLimit?: number;
  record: {
    won: number;
    lost: number;
    pushed: number;
    graded: number;
    pending: number;
    netUnits: number;
  };
  topPick: AiJudgePick | null;
  topPicks: AiJudgePick[];
};

type AiJudgeLeaderboard = {
  status: string;
  date: string;
  candidateCount: number;
  leaderboard: AiJudge[];
};

type Tab =
  | 'overview'
  | 'targets'
  | 'pitchers'
  | 'games'
  | 'graphs'
  | 'judges'
  | 'agents';

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

function normalizeBoardCandidate(raw: Record<string, unknown>): Candidate {
  return {
    playerId: raw.playerId as number | string | undefined,
    playerName: String(raw.playerName ?? raw.name ?? ''),
    name: String(raw.name ?? raw.playerName ?? ''),
    headshotUrl: (raw.headshotUrl ?? raw.headshot) as string | null | undefined,
    headshot: raw.headshot as string | null | undefined,
    team: String(raw.team ?? ''),
    opponent: String(raw.opponent ?? raw.opponentTeam ?? ''),
    opponentTeam: String(raw.opponentTeam ?? raw.opponent ?? ''),
    opponentPitcherName: String(raw.opponentPitcherName ?? raw.opposingPitcher ?? ''),
    venue: String(raw.venue ?? ''),
    gamePk: raw.gamePk as number | string | undefined,
    gameId: raw.gameId as number | string | undefined,
    hrScore: num(raw.hrEdge ?? raw.hrScore ?? raw.score),
    riskTier: String(raw.riskTier ?? raw.riskLabel ?? ''),
    confidenceTier: String(raw.confidenceTier ?? ''),
    estimatedHrProbability: num(raw.estimatedHrProb ?? raw.estimatedHrProbability),
    reasons: safeArray<string>(raw.reasons),
    warnings: safeArray<string>(raw.warnings),
    scoreBreakdown: (raw.scoreBreakdown ?? {}) as Record<string, number>,
  };
}

function extractCandidatesFromBoard(board: HrBoardResponse): Candidate[] {
  const rowsFromGames = Array.isArray(board.games)
    ? board.games.flatMap((game) => (Array.isArray(game?.rows) ? game.rows : []))
    : [];
  const topRows = Array.isArray(board.rows) ? board.rows : [];
  const confirmed = safeArray<Record<string, unknown>>(
    board.confirmedCandidates ?? board.candidateBuckets?.confirmed,
  );
  const rawCandidates = safeArray<Record<string, unknown>>(board.candidates);
  const projected = safeArray<Record<string, unknown>>(
    board.projectedCandidates ?? board.candidateBuckets?.projected,
  );

  const seen = new Set<string>();
  const merged: Candidate[] = [];

  for (const raw of [...rowsFromGames, ...topRows, ...confirmed, ...rawCandidates, ...projected]) {
    if (!raw || typeof raw !== 'object') continue;
    const record = raw as Record<string, unknown>;
    const name = String(record.playerName ?? record.name ?? '').trim();
    if (!name) continue;

    const key = `${String(record.playerId ?? '')}:${name}:${String(record.team ?? '')}`;
    if (seen.has(key)) continue;
    seen.add(key);

    merged.push(normalizeBoardCandidate(record));
  }

  return merged;
}



function toNormalizedPlayerPayload(
  candidate: Candidate,
): NormalizedPlayerPayload {
  const score = num(candidate.hrScore, 0);

  return {
    player: {
      playerId: candidate.playerId ?? null,
      playerName: cleanName(candidate),
      team: candidate.team ?? '',
      opponent: cleanOpponent(candidate),
      opponentPitcherName: candidate.opponentPitcherName ?? null,
      headshot: candidate.headshotUrl ?? candidate.headshot ?? null,
      vouchScore: score,
      hrEdge: score,
      riskLabel: candidate.riskTier ?? candidate.confidenceTier ?? null,
    },
    scoreBreakdown: {
      finalScore: score,
      ...(candidate.scoreBreakdown ?? {}),
    },
    matchup: {
      opponent: cleanOpponent(candidate),
      opponentPitcherName: candidate.opponentPitcherName ?? null,
      venue: candidate.venue ?? null,
    },
    recentForm: null,
  } as NormalizedPlayerPayload;
}

function buildIntelligenceReport(board: HrBoardResponse): IntelligenceReport {
  return {
    date: board.date ?? new Date().toISOString().slice(0, 10),
    gameCount: num(board.gameCount, 0),
    dataQuality: board.dataQuality ?? 'hr_board_projection',
    disclaimer:
      board.disclaimer ??
      'Premium MLB AI research powered by the HR Board engine. Track HR targets, pitcher pressure, game environments, judge rankings, and parlay-ready signals.',
    candidates: extractCandidatesFromBoard(board),
  };
}

const OFFLINE_REPORT: IntelligenceReport = {
  date: new Date().toISOString().slice(0, 10),
  gameCount: 0,
  dataQuality: 'offline',
  disclaimer: 'AI Edge Lab is temporarily unavailable. No fake data shown.',
  candidates: [],
};

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
    <div className={`relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl ${AURORA_SURFACE} shadow-inner`}>
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
                  : 'bg-black/30'
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
    tone === 'sky' ? 'text-vouch-cyan border border-vouch-cyan/20 bg-vouch-cyan/5' :
    tone === 'emerald' ? 'text-vouch-emerald border border-vouch-emerald/20 bg-vouch-emerald/5' :
    tone === 'amber' ? 'text-amber-300 border border-amber-400/20 bg-amber-400/5' :
    `text-white/80 ${AURORA_SURFACE}`;

  return (
    <div className={`rounded-2xl p-3 ${AURORA_STAT_CHIP} ${toneClass}`}>
      <p className={`${AURORA_LABEL} opacity-70`}>{label}</p>
      <div className="mt-1 text-xl font-black">{value}</div>
    </div>
  );
}

function CandidateCard({
  c,
  rank,
  onSelect,
}: {
  c: Candidate;
  rank: number;
  onSelect: (candidate: Candidate) => void;
}) {
  const score = num(c.hrScore, 0);
  const reasons = safeArray<string>(c.reasons).slice(0, 3);
  const warnings = safeArray<string>(c.warnings).slice(0, 2);
  const breakdown = c.scoreBreakdown ?? {};

  return (
    <button
      type="button"
      onClick={() => onSelect(c)}
      className={`group w-full rounded-3xl ${AURORA_PANEL_PREMIUM} p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:border-vouch-cyan/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vouch-cyan/60`}
      aria-label={`Open ${cleanName(c)} inside AI Edge Lab`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <PlayerHeadshot name={cleanName(c)} playerId={c.playerId} headshotUrl={c.headshotUrl ?? c.headshot} size={54} />
          <div className="min-w-0">
            <p className={`${AURORA_LABEL} text-slate-500`}>#{rank}</p>
            <h3 className={`truncate ${AURORA_SECTION_HEADER}`}>{cleanName(c)}</h3>
            <p className="text-xs text-slate-400">
              {c.team ?? 'TBD'} vs {cleanOpponent(c)} · {cleanPitcher(c)}
            </p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className={`${AURORA_LABEL} text-slate-500`}>HR edge</p>
          <p className="text-2xl font-black text-vouch-cyan">{score}</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <StatTile label="Tier" value={c.riskTier ?? c.confidenceTier ?? 'Watch'} tone="amber" />
        <StatTile label="Est. HR" value={pct(c.estimatedHrProbability)} tone="emerald" />
        <StatTile label="Venue" value={<span className="text-sm">{c.venue ?? 'TBD'}</span>} />
      </div>

      <div className={`mt-3 rounded-2xl p-3 ${AURORA_SURFACE}`}>
        <p className={`mb-2 ${AURORA_LABEL} text-slate-500`}>
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
          <span key={key} className={`rounded-full px-2 py-1 ${AURORA_SURFACE} ${AURORA_LABEL} text-slate-300`}>
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
    </button>
  );
}

function availabilityTone(status?: string) {
  const value = String(status ?? '').toLowerCase();
  if (value === 'confirmed') return 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200';
  if (value === 'projected') return 'border-sky-400/30 bg-sky-400/10 text-sky-200';
  if (value === 'avoid') return 'border-red-400/30 bg-red-400/10 text-red-200';
  return 'border-amber-400/30 bg-amber-400/10 text-amber-200';
}

function pickTypeTone(pickType?: string) {
  const value = String(pickType ?? '').toUpperCase();
  if (value === 'AVOID') return 'border-red-400/30 bg-red-400/10 text-red-200';
  if (value === 'POWER_THREAT') return 'border-orange-400/30 bg-orange-400/10 text-orange-200';
  if (value === 'FORM_PLAY') return 'border-violet-400/30 bg-violet-400/10 text-violet-200';
  if (value === 'CLEAN_SCREEN') return 'border-sky-400/30 bg-sky-400/10 text-sky-200';
  if (value === 'PREMIUM_EDGE') return 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200';
  return AURORA_SURFACE + ' text-slate-300';
}

const JUDGE_SECTION_COPY: Record<string, { title: string; subtitle: string }> = {
  data_scout: {
    title: "Today's Safer HR Single",
    subtitle: 'One math-first HR single — cleaner data profile, fewer red flags.',
  },
  power_hunter: {
    title: "Today's Power Threat Single",
    subtitle: 'One raw HR upside single from power paths, pitcher vulnerability, and park leverage.',
  },
  momentum_reader: {
    title: "Today's Form Single",
    subtitle: 'One rhythm read — recent form and lineup volume on a single HR leg.',
  },
  risk_auditor: {
    title: "Today's Trap Avoid",
    subtitle: 'One caution profile — graded when the flagged player stays cold.',
  },
};

async function copyJudgeSingle(judge: AiJudge) {
  const pick = judge.topPick ?? safeArray<AiJudgePick>(judge.topPicks)[0];
  if (!pick) return;

  const lines = [
    `${judge.displayName} — Today's Single`,
    '',
    `${pick.playerName} — ${pick.singlePickLabel ?? pick.market} — ${pick.team} vs ${pick.opponent}`,
    '',
    'Built from VouchEdge AI Judge Leaderboard.',
    'Research only. Not betting advice.',
  ];

  await navigator.clipboard.writeText(lines.join('\n'));
}

function formatJudgeRecord(record: AiJudge['record']) {
  const base = `${record.won}-${record.lost}`;
  if (record.pending > 0) return `${base} (${record.pending} pending)`;
  if (record.graded === 0) return '0-0';
  return base;
}

function JudgeCard({ judge }: { judge: AiJudge }) {
  const isRisk = judge.id === 'risk_auditor';
  const pick = judge.topPick ?? safeArray<AiJudgePick>(judge.topPicks)[0] ?? null;
  const sectionCopy = JUDGE_SECTION_COPY[judge.id] ?? {
    title: isRisk ? "Today's Trap Avoid" : "Today's Single",
    subtitle: isRisk
      ? 'One warning profile tracked for trap accuracy.'
      : 'One specialty-filtered HR single per judge.',
  };

  return (
    <article className={`rounded-3xl ${AURORA_PANEL_PREMIUM} p-5 shadow-xl shadow-black/20`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className={`${AURORA_LABEL} text-sky-300`}>
            {judge.specialty ?? (isRisk ? 'Trap Watch Agent' : 'AI Capper')}
          </div>
          <h3 className={`mt-1 ${AURORA_SECTION_HEADER}`}>{judge.displayName}</h3>
          <p className="mt-1 text-sm text-slate-400">{judge.tagline}</p>
          <p className="mt-2 max-w-2xl text-xs text-slate-500">{judge.persona}</p>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <StatTile label="Win Rate" value={judge.winRate == null ? 'New' : `${judge.winRate}%`} tone="emerald" />
          <StatTile label="Trust" value={String(Math.round(Number(judge.trustScore ?? 50)))} tone="sky" />
          <StatTile label="Record" value={formatJudgeRecord(judge.record)} tone="slate" />
        </div>
      </div>

      <div className={`mt-5 rounded-2xl p-4 ${AURORA_SURFACE}`}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className={`${AURORA_LABEL} text-slate-500`}>
              {sectionCopy.title}
            </p>
            <p className="text-xs text-slate-400">
              {sectionCopy.subtitle}
              {pick?.gradeable ? ' · Tracking for win rate.' : pick ? ' · Preview only until confirmed.' : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={() => { void copyJudgeSingle(judge); }}
            disabled={!pick}
            className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs font-black text-emerald-200 hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Copy Single
          </button>
        </div>

        <div className="space-y-2">
          {!pick ? (
            <p className={`rounded-2xl p-3 text-sm text-slate-500 ${AURORA_SURFACE}`}>
              No judge pick available yet.
            </p>
          ) : (
            <div className={`rounded-2xl p-3 ${AURORA_SURFACE}`}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <PlayerHeadshot name={pick.playerName} playerId={pick.playerId} headshotUrl={pick.headshotUrl ?? pick.headshot} size={42} />
                  <div className="min-w-0">
                    <p className="text-sm font-black text-white">
                      {pick.playerName}
                      <span className="ml-2 text-xs font-normal text-slate-500">
                        {pick.team} vs {pick.opponent}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {pick.singlePickLabel ?? pick.market} · Agent Score {pick.agentScore}
                      {!isRisk ? ` · HR Edge ${pick.hrScore}` : ''}
                    </p>
                    {pick.judgeReason ? (
                      <p className="mt-1 text-[11px] text-slate-300">{pick.judgeReason}</p>
                    ) : null}
                    <p className="mt-1 text-[11px] text-slate-500">
                      Pitcher: {pick.opponentPitcherName ?? 'TBD'} · Venue: {pick.venue ?? 'TBD'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <span className={`rounded-full border px-2 py-1 ${AURORA_LABEL} ${pickTypeTone(pick.pickType)}`}>
                    {pick.singlePickLabel ?? pick.specialtyLabel ?? pick.pickType}
                  </span>
                  <span className={`rounded-full border px-2 py-1 ${AURORA_LABEL} ${availabilityTone(pick.availability?.status)}`}>
                    {pick.availability?.label ?? 'Availability unknown'}
                  </span>
                  <span className={`rounded-full px-2 py-1 ${AURORA_LABEL} ${
                    pick.gradeable
                      ? 'border border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
                      : AURORA_SURFACE + ' text-slate-400'
                  }`}>
                    {pick.gradeable ? 'Tracking' : 'Preview only'}
                  </span>
                </div>
              </div>

              {isRisk && safeArray<string>(pick.warnings).length > 0 ? (
                <div className="mt-2 rounded-xl border border-amber-400/20 bg-amber-400/5 p-2">
                  {pick.warnings!.slice(0, 2).map((warning, i) => (
                    <p key={i} className="text-[11px] text-amber-200">⚠ {warning}</p>
                  ))}
                </div>
              ) : pick.availability?.reasons?.length ? (
                <div className="mt-2 text-[11px] text-slate-500">
                  {pick.availability.reasons.slice(0, 2).join(' · ')}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export default function MlbIntelligenceHubZ8({ onSectionChange }: Props) {
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  const { setPick } = usePickSelectionContext();

  const handleCandidateSelect = (candidate: Candidate) => {
    setSelectedCandidate(candidate);

    setPick({
      sport: "MLB",
      league: "MLB",
      eventId: String(candidate.gamePk ?? candidate.gameId ?? ""),
      gameDate: "",
      playerId: String(candidate.playerId ?? ""),
      playerName: cleanName(candidate),
      team: candidate.team ?? "",
      opponent: cleanOpponent(candidate),
      market: "Home Run",
      selection: "yes",
      line: null,
      odds: null,
      sportsbook: null,
      source: "hr-board",
    });
  };

  const selectedPlayerPayload = useMemo(
    () => selectedCandidate
      ? toNormalizedPlayerPayload(selectedCandidate)
      : null,
    [selectedCandidate],
  );


  const verdict = useVerdict(selectedPlayerPayload);
  const [tab, setTab] = useState<Tab>('overview');
  const hrBoardQuery = useHrBoardToday();
  const judgeQuery = useAiJudgeLeaderboard();
  const agentRegistryQuery = useAiAgentRegistry();

  const report = useMemo(() => {
    if (hrBoardQuery.data) return buildIntelligenceReport(hrBoardQuery.data);
    if (hrBoardQuery.isError) return OFFLINE_REPORT;
    return null;
  }, [hrBoardQuery.data, hrBoardQuery.isError]);

  const loading = hrBoardQuery.isLoading;
  const error = hrBoardQuery.isError
    ? (hrBoardQuery.error instanceof Error ? hrBoardQuery.error.message : 'AI Edge Lab unavailable.')
    : null;

  const judgeBoard = (judgeQuery.data as AiJudgeLeaderboard | undefined) ?? null;
  const judgeLoading = judgeQuery.isLoading;
  const judgeError = judgeQuery.isError
    ? (judgeQuery.error instanceof Error ? judgeQuery.error.message : 'AI Judge leaderboard unavailable.')
    : null;

  const load = () => {
    void hrBoardQuery.refetch();
    void judgeQuery.refetch();
  };

  const loadJudges = () => {
    void judgeQuery.refetch();
    void agentRegistryQuery.refetch();
  };

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

  const agents = useMemo(
    () => hydrateAgentSlots(agentRegistryQuery.data?.agents ?? []),
    [agentRegistryQuery.data?.agents],
  );

  return (
    <main className={`${AURORA_PAGE} ${AURORA_PAGE_PAD_X} ${AURORA_PAGE_PAD_Y} min-h-0 min-w-0 text-ve-flash ve-safe-bottom`}>
      <div className={`mb-5 overflow-hidden relative ${AURORA_PANEL_PREMIUM} p-5`}>
        <div className="absolute -top-24 -right-24 h-60 w-60 rounded-full bg-vouch-cyan/15 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-60 w-60 rounded-full bg-vouch-emerald/10 blur-3xl" />

        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <HrBrandIcon />
            <div className="min-w-0">
              <p className={`mb-2 ${AURORA_LABEL} text-vouch-cyan`}>
                AI game room
              </p>
              <h1 className={AURORA_SECTION_HEADER}>
                The Vouch AI Edge Lab
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-white/55">
                The complete MLB intelligence workspace powered by the working HR Board engine. Research HR projections, pitcher pressure, game environments, player comparisons, source-backed graphs, and AI judge signals in one place.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {onSectionChange && (
              <button
                type="button"
                onClick={() => onSectionChange('hr_max')}
                className="inline-flex items-center justify-center gap-2.5 rounded-2xl border border-vouch-cyan/35 bg-vouch-cyan/10 px-4 py-3 text-sm font-black text-vouch-cyan hover:bg-vouch-cyan/15"
              >
                <HrBrandIcon size="sm" />
                Home Run Intelligence
              </button>
            )}
            <button
              onClick={load}
              className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition ${AURORA_SURFACE} hover:border-vouch-cyan/40 hover:text-white text-white/80`}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        <div className="relative mt-5 grid grid-cols-2 gap-2 md:grid-cols-4">
          <StatTile label="Date" value={<span className="text-base">{report?.date ?? '—'}</span>} />
          <StatTile label="Games" value={report?.gameCount ?? 0} tone="sky" />
          <StatTile label="Hitters" value={candidates.length} tone="emerald" />
          <StatTile label="Data" value={<span className="text-base">{report?.dataQuality ?? 'loading'}</span>} tone="amber" />
        </div>

        <div className="relative mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          {agents.map((agent) => (
            <div key={agent.code} className={`group rounded-2xl ${AURORA_PANEL_PREMIUM} p-3 hover:border-vouch-cyan/35 transition`}>
              <div className="flex items-center gap-3">
                <PixelAgentIcon code={agent.code} />
                <div>
                  <p className="text-sm font-black text-white">{agent.displayName}</p>
                  <p className={`${AURORA_LABEL} text-white/40`}>{agent.role ?? agent.specialty}</p>
                </div>
              </div>
              <p className="mt-2 text-[11px] text-white/50 leading-relaxed">{agent.focus ?? agent.persona}</p>
              <div className={`mt-3 inline-flex items-center rounded-full border border-vouch-cyan/20 bg-vouch-cyan/5 px-2 py-1 ${AURORA_LABEL} text-vouch-cyan`}>
                {agent.tagline}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={`mb-5 rounded-2xl p-3 ${AURORA_PANEL_PREMIUM}`}>
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-vouch-cyan" />
          <p className="text-xs text-white/50">
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
          ['graphs', 'Pro Graphs', BarChart3],
          ['judges', 'Judge Leaderboard', Flame],
        ].map(([id, label, Icon]) => {
          const active = tab === id;
          const I = Icon as typeof Brain;
          return (
            <button
              key={String(id)}
              onClick={() => setTab(id as Tab)}
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-black transition ${
                active ? AURORA_ACTIVE : AURORA_IDLE
              }`}
            >
              <I className="h-4 w-4" />
              {String(label)}
            </button>
          );
        })}
      </div>

      {loading && tab !== 'judges' && tab !== 'graphs' && (
        <div className={`rounded-3xl ${AURORA_PANEL_PREMIUM} p-8 text-center text-white/50`}>
          Loading AI Edge Lab…
        </div>
      )}

      {!loading &&
        candidates.length === 0 &&
        tab !== 'judges' &&
        tab !== 'graphs' && (
        <div className={`rounded-3xl ${AURORA_PANEL_PREMIUM} p-8 text-center`}>
          <p className="text-lg font-black text-white">No intelligence rows available yet.</p>
          <p className="mt-2 text-sm text-white/50">
            The page is safe and no fake data is shown. Refresh once the HR Board endpoint returns candidates.
          </p>
        </div>
      )}


      {selectedCandidate && (
                  <section
          aria-label={`${cleanName(selectedCandidate)} research workspace`}
          className={`relative overflow-hidden rounded-[28px] ${AURORA_PANEL_PREMIUM}`}
        >
          <VerdictPanel verdict={verdict} />

          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-vouch-cyan/70 to-transparent" />

          <div className="flex items-start justify-between gap-4 border-b border-white/8 px-4 py-4 sm:px-6">
            <div className="min-w-0">
              <p className={`${AURORA_LABEL} text-vouch-cyan`}>
                Active player workspace
              </p>
              <h2 className="mt-1 truncate text-xl font-black text-white sm:text-2xl">
                {cleanName(selectedCandidate)}
              </h2>
              <p className="mt-1 text-xs text-white/45 sm:text-sm">
                AI decision, matchup context, source-backed signals and Pro Graphs — without leaving the Edge Lab.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSelectedCandidate(null)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/60 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
              aria-label="Close player workspace"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-4 p-4 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)] sm:p-6">
            <div className="space-y-4">
              {selectedPlayerPayload && (
                <PlayerResearchDecisionCard payload={selectedPlayerPayload} />
              )}

              <div className={`rounded-2xl p-4 ${AURORA_SURFACE}`}>
                <p className={`${AURORA_LABEL} text-white/40`}>
                  Matchup intelligence
                </p>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <StatTile
                    label="Opponent"
                    value={<span className="text-sm">{cleanOpponent(selectedCandidate)}</span>}
                  />
                  <StatTile
                    label="Pitcher"
                    value={<span className="text-sm">{cleanPitcher(selectedCandidate)}</span>}
                  />
                  <StatTile
                    label="HR edge"
                    value={num(selectedCandidate.hrScore)}
                    tone="sky"
                  />
                  <StatTile
                    label="Estimated HR"
                    value={pct(selectedCandidate.estimatedHrProbability)}
                    tone="emerald"
                  />
                </div>
              </div>

              {(selectedCandidate.reasons?.length ?? 0) > 0 && (
                <div className={`rounded-2xl p-4 ${AURORA_SURFACE}`}>
                  <p className={`${AURORA_LABEL} text-white/40`}>
                    AI evidence
                  </p>

                  <div className="mt-3 space-y-2">
                    {safeArray<string>(selectedCandidate.reasons)
                      .slice(0, 5)
                      .map((reason, index) => (
                        <div
                          key={`${reason}-${index}`}
                          className="flex gap-2 rounded-xl border border-white/6 bg-black/20 px-3 py-2 text-xs leading-relaxed text-white/70"
                        >
                          <span className="font-mono text-vouch-cyan">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <span>{reason}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            <div className="min-w-0 overflow-hidden rounded-2xl border border-white/8 bg-black/20">
              <div className="border-b border-white/8 px-4 py-3">
                <p className={`${AURORA_LABEL} text-vouch-cyan`}>
                  Pro Graphs
                </p>
                <p className="mt-1 text-xs text-white/40">
                  Advanced visual research remains inside the active player workspace.
                </p>
              </div>

              <ProGraphsLabPageZ8 embedded />
            </div>
          </div>
        </section>
      )}

      {!loading && candidates.length > 0 && tab === 'overview' && (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 grid gap-4 md:grid-cols-2">
            {topTargets.slice(0, 6).map((c, i) => (
              <CandidateCard key={`${cleanName(c)}-${i}`} c={c} rank={i + 1} onSelect={handleCandidateSelect} />
            ))}
          </div>
          <div className="space-y-3">
            <div className={`rounded-3xl ${AURORA_PANEL_PREMIUM} p-4`}>
              <p className={`mb-3 ${AURORA_LABEL}`}>Pitcher pressure board</p>
              {pitcherGroups.slice(0, 6).map((p, i) => (
                <div key={p.pitcher} className={`mb-2 rounded-2xl p-3 ${AURORA_SURFACE}`}>
                  <p className="text-sm font-black text-slate-100">#{i + 1} {p.pitcher}</p>
                  <p className="text-xs text-slate-500">{p.threats} hitters · top HR edge {p.topScore} · {p.venue}</p>
                </div>
              ))}
            </div>
            <div className="rounded-3xl border border-amber-400/20 bg-amber-400/5 p-4">
              <p className={`${AURORA_LABEL} text-amber-300`}>🔒 Pro Intel</p>
              <p className="mt-1 text-sm font-black text-white">RBI windows, stolen bases, bullpen fatigue, pitch mix, and live parlay impact.</p>
            </div>
          </div>
        </div>
      )}

      {!loading && candidates.length > 0 && tab === 'targets' && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {topTargets.map((c, i) => <CandidateCard key={`${cleanName(c)}-target-${i}`} c={c} rank={i + 1} onSelect={handleCandidateSelect} />)}
        </div>
      )}

      {!loading && candidates.length > 0 && tab === 'pitchers' && (
        <div className="grid gap-4 md:grid-cols-2">
          {pitcherGroups.map((p, i) => (
            <div key={p.pitcher} className={`rounded-3xl ${AURORA_PANEL_PREMIUM} p-4`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={`${AURORA_LABEL} text-slate-500`}>#{i + 1} pressure target</p>
                  <h3 className={AURORA_SECTION_HEADER}>{p.pitcher}</h3>
                  <p className="text-xs text-slate-400">{p.venue}</p>
                </div>
                <StatTile label="Top edge" value={p.topScore} tone="amber" />
              </div>
              <div className="mt-3 grid gap-2">
                {p.rows.slice(0, 4).map((c, idx) => (
                  <div key={`${cleanName(c)}-${idx}`} className={`flex items-center justify-between rounded-2xl p-3 ${AURORA_SURFACE}`}>
                    <span className="flex min-w-0 items-center gap-2 text-sm font-bold text-slate-200">
                      <PlayerHeadshot name={cleanName(c)} playerId={c.playerId} headshotUrl={c.headshotUrl ?? c.headshot} size={32} />
                      <span className="truncate">{cleanName(c)}</span>
                    </span>
                    <span className="text-sm font-black text-vouch-cyan">{num(c.hrScore)}</span>
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
            <div key={g.game} className={`rounded-3xl ${AURORA_PANEL_PREMIUM} p-4`}>
              <p className={`${AURORA_LABEL} text-slate-500`}>#{i + 1} run environment</p>
              <h3 className={AURORA_SECTION_HEADER}>{g.game}</h3>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <StatTile label="Avg edge" value={g.avgScore} tone="sky" />
                <StatTile label="Threats" value={g.threats} tone="emerald" />
                <StatTile label="Hitters" value={g.rows.length} />
              </div>
            </div>
          ))}
        </div>
      )}


      {tab === 'graphs' && (
        <section className="min-w-0">
          <div className={`mb-4 rounded-3xl ${AURORA_PANEL_PREMIUM} p-5`}>
            <p className={`${AURORA_LABEL} text-vouch-cyan`}>
              Source-backed visual intelligence
            </p>
            <h2 className={AURORA_SECTION_HEADER}>Pro Graphs</h2>
            <p className="mt-2 max-w-3xl text-sm text-white/55">
              Explore HR signal spectra, player comparisons, team pressure,
              pitcher vulnerability, and matchup evidence without leaving
              The Vouch AI Edge Lab.
            </p>
          </div>

          <ProGraphsLabPageZ8 embedded />
        </section>
      )}

      {tab === 'judges' && (
        <section className="space-y-5">
          <div className={`rounded-3xl p-5 ${AURORA_PANEL_PREMIUM}`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className={`${AURORA_LABEL} text-vouch-cyan`}>
                    Premium AI Judge Board
                  </p>
                  <span className={`inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/30 px-2 py-0.5 ${AURORA_LABEL} text-white/45`}>
                    <Plug className="h-3 w-3 text-vouch-emerald/80" />
                    {agentRegistryQuery.data?.agents.length ?? 5} agent slots · extensible
                  </span>
                </div>
                <h2 className={AURORA_SECTION_HEADER}>AI Judge Leaderboard</h2>
                <p className="mt-2 max-w-3xl text-sm text-white/55">
                  Each AI judge posts one specialty-filtered single per day. Win rate and record come from graded singles in the picks ledger — honest W/L only, no fabricated stats.
                  Risk Auditor trap avoids win when the flagged player stays cold.
                </p>
              </div>
              <button
                onClick={loadJudges}
                className={`rounded-2xl px-4 py-2 text-sm font-black text-vouch-cyan transition ${AURORA_SURFACE} hover:border-vouch-cyan/30 hover:bg-vouch-cyan/10`}
              >
                Refresh Judges
              </button>
            </div>
          </div>

          <AgentDock
            agents={agentRegistryQuery.data?.agents ?? []}
            extensionDocs={agentRegistryQuery.data?.extensionDocs}
            loading={agentRegistryQuery.isLoading}
            error={
              agentRegistryQuery.isError
                ? agentRegistryQuery.error instanceof Error
                  ? agentRegistryQuery.error.message
                  : 'Agent registry unavailable.'
                : null
            }
          />

          {judgeLoading && (
            <div className={`rounded-3xl ${AURORA_PANEL_PREMIUM} p-6 text-white/70`}>
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
    </main>
  );
}
