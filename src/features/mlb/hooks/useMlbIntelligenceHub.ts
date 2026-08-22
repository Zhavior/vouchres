import { useState, useMemo } from 'react';
import { usePickSelectionContext } from "@/features/brain-edge/context/PickSelectionContext";
import { useHrBoardToday } from '../../../hooks/queries/useHrBoardToday';
import { useAiJudgeLeaderboard } from '../../../hooks/queries/useAiJudgeLeaderboard';
import { useAiAgentRegistry } from '../../../hooks/queries/useAiAgentRegistry';
import type { HrBoardResponse } from '../../../types/hrBoard';
import type { NormalizedPlayerPayload } from '../../../adapters/normalized';
import { hydrateAgentSlots } from '../../../services/agents/agentSlots';
import {
  Candidate,
  IntelligenceReport,
  AiJudgeLeaderboard,
  Tab,
} from '../components/MlbIntelligenceHub/types';
import { useVerdict } from "@/features/brain-edge/hooks/useVerdict";

const safeArray = <T,>(value: unknown): T[] => Array.isArray(value) ? value as T[] : [];

const num = (value: unknown, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
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

export function useMlbIntelligenceHub() {
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

  return {
    selectedCandidate,
    setSelectedCandidate,
    selectedPlayerPayload,
    verdict,
    tab,
    setTab,
    report,
    loading,
    error,
    judgeBoard,
    judgeLoading,
    judgeError,
    load,
    loadJudges,
    candidates,
    topTargets,
    pitcherGroups,
    gameGroups,
    agents,
    agentRegistryQuery,
    handleCandidateSelect,
  };
}
