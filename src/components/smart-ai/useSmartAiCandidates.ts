import { useEffect, useState } from 'react';
import { safeJsonFetch } from '../../api/safeApiClient';
import {
  americanToDecimalOdds,
  type RealCandidate,
} from './smartAiEngine.logic';

type SmartAiRawCandidate = {
  playerId?: string | number;
  player_id?: string | number;
  id?: string | number;
  playerName?: string;
  player_name?: string;
  name?: string;
  gamePk?: string | number;
  gameId?: string | number;
  team?: string;
  teamAbbrev?: string;
  opponent?: string;
  opponentTeam?: string;
  probablePitcher?: {
    name?: string;
    throws?: string;
    vulnerability?: number;
  } | null;
  opponentPitcherName?: string | null;
  opponentPitcherId?: number | null;
  opponentPitcherHand?: string | null;
  opposingPitcher?: string | null;
  pitcherHand?: string;
  opposingPitcherHand?: string;
  batSide?: string;
  injuryStatus?: string;
  pitcherVulnerability?: number;
  parkFactor?: number;
  venue?: string;
  ballpark?: string;
  lineupStatus?: string;
  lineup_status?: string;
  confidenceTier?: string;
  riskTier?: string;
  estimatedHrProbability?: number;
  dataConfidence?: number;
  battingOrder?: number;
  dataQuality?: string;
  reasons?: unknown[];
  warnings?: unknown[];
  scoreBreakdown?: Record<string, unknown> | null;
  score?: number;
  hrScore?: number;
  edge?: number;
  impliedOdds?: number;
  odds?: number;
};

function isSmartAiRawCandidateWithGame(value: Record<string, unknown>): value is SmartAiRawCandidate {
  return value != null && (value.gamePk != null || value.gameId != null);
}

function normalizeScoreBreakdown() {
  return {
    hitterPower: 0,
    pitcherVulnerability: 0,
    parkContext: 0,
    lineupVolume: 0,
    weatherContext: 0,
    oddsValue: 0,
    recentForm: 0,
    handednessEdge: 0,
    penalties: 0,
  };
}

function toStringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function normalizeConfidenceTier(value: unknown): 'thin' | 'elite' | 'strong' | 'watchlist' | 'avoid' {
  return value === 'thin' ||
    value === 'elite' ||
    value === 'strong' ||
    value === 'watchlist' ||
    value === 'avoid'
    ? value
    : 'thin';
}

function normalizeSmartAiCandidate(c: SmartAiRawCandidate): RealCandidate {
  return {
    playerId: String(c.playerId ?? c.player_id ?? c.id ?? c.playerName),
    playerName: toStringOrNull(c.playerName ?? c.player_name ?? c.name) ?? 'Unknown',
    gamePk: String(c.gamePk ?? c.gameId),
    team: toStringOrNull(c.team ?? c.teamAbbrev) ?? 'MLB',
    opponent: toStringOrNull(c.opponent ?? c.opponentTeam ?? c.opponentPitcherName) ?? 'opponent',
    oddsDecimal: americanToDecimalOdds(c.impliedOdds ?? c.odds),
    score: Number(c.hrScore ?? c.score ?? c.edge ?? 0),
    opponentPitcherName: toStringOrNull(c.opponentPitcherName ?? c.opposingPitcher ?? c.probablePitcher?.name),
    opponentPitcherId: typeof c.opponentPitcherId === 'number' && c.opponentPitcherId > 0 ? c.opponentPitcherId : null,
    pitcherHand: toStringOrNull(c.opponentPitcherHand ?? c.pitcherHand ?? c.opposingPitcherHand ?? c.probablePitcher?.throws),
    batSide: c.batSide === 'L' || c.batSide === 'R' || c.batSide === 'S' ? c.batSide : null,
    injuryStatus: toStringOrNull(c.injuryStatus),
    pitcherVulnerability:
      typeof c.pitcherVulnerability === 'number'
        ? c.pitcherVulnerability
        : typeof c.probablePitcher?.vulnerability === 'number'
          ? c.probablePitcher.vulnerability
          : null,
    parkFactor: typeof c.parkFactor === 'number' ? c.parkFactor : null,
    venue: toStringOrNull(c.venue ?? c.ballpark),
    lineupStatus: toStringOrNull(c.lineupStatus ?? c.lineup_status),
    confidenceTier: normalizeConfidenceTier(c.confidenceTier),
    riskLabel: toStringOrNull(c.riskTier),
    estimatedHrProbability: typeof c.estimatedHrProbability === 'number' ? c.estimatedHrProbability : null,
    dataConfidence: typeof c.dataConfidence === 'number' ? c.dataConfidence : null,
    battingOrder: typeof c.battingOrder === 'number' ? c.battingOrder : null,
    dataQuality: toStringOrNull(c.dataQuality),
    reasons: Array.isArray(c.reasons) ? c.reasons.map(String) : [],
    boardWarnings: Array.isArray(c.warnings) ? c.warnings.map(String) : [],
    scoreBreakdown: normalizeScoreBreakdown(),
  };
}

export function useSmartAiCandidates() {
  const [realCandidates, setRealCandidates] = useState<RealCandidate[]>([]);
  const [candidatesLoading, setCandidatesLoading] = useState(true);
  const [usingProjectedPreview, setUsingProjectedPreview] = useState(false);

  useEffect(() => {
    let alive = true;
    setCandidatesLoading(true);

    safeJsonFetch<{ candidates?: Record<string, unknown>[]; projectedCandidates?: Record<string, unknown>[]; rows?: Record<string, unknown>[] }>(
      '/api/mlb/hr-board/today?previewLimit=75',
      { fallbackData: { candidates: [] }, timeoutMs: 14000 },
    ).then((r) => {
      if (!alive) return;

      const confirmed: Record<string, unknown>[] = Array.isArray(r.data?.candidates) ? r.data.candidates : [];
      const projected: Record<string, unknown>[] = Array.isArray(r.data?.projectedCandidates) ? r.data.projectedCandidates : [];
      const rows: Record<string, unknown>[] = Array.isArray(r.data?.rows) ? r.data.rows : [];
      const raw: Record<string, unknown>[] = confirmed.length ? confirmed : projected.length ? projected : rows;

      setUsingProjectedPreview(confirmed.length === 0 && projected.length > 0);

      const mapped: RealCandidate[] = raw
        .filter(isSmartAiRawCandidateWithGame)
        .map(normalizeSmartAiCandidate);

      setRealCandidates(mapped);
      setCandidatesLoading(false);
    });

    return () => {
      alive = false;
    };
  }, []);

  return { realCandidates, candidatesLoading, usingProjectedPreview };
}
