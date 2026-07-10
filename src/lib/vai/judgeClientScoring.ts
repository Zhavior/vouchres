import type { RealCandidate } from '../../components/smart-ai/smartAiEngine.logic';

export type JudgeAgentId = 'data_scout' | 'power_hunter' | 'momentum_reader' | 'risk_auditor';

type Metrics = {
  hrScore: number;
  hitterPower: number;
  pitcherVulnerability: number;
  parkContext: number;
  lineupVolume: number;
  handednessEdge: number;
  recentForm: number;
  penalties: number;
  warnings: number;
};

function normalizeMetrics(c: RealCandidate): Metrics {
  const b = c.scoreBreakdown;
  return {
    hrScore: c.score ?? 0,
    hitterPower: b?.hitterPower ?? 0,
    pitcherVulnerability: b?.pitcherVulnerability ?? c.pitcherVulnerability ?? 0,
    parkContext: b?.parkContext ?? c.parkFactor ?? 0,
    lineupVolume: b?.lineupVolume ?? 0,
    handednessEdge: b?.handednessEdge ?? 0,
    recentForm: b?.recentForm ?? 0,
    penalties: b?.penalties ?? 0,
    warnings: c.boardWarnings?.length ?? 0,
  };
}

function confidenceBonus(c: RealCandidate): number {
  if (c.confidenceTier === 'elite') return 12;
  if (c.confidenceTier === 'strong') return 8;
  if (c.confidenceTier === 'watchlist') return 4;
  if (c.confidenceTier === 'thin') return -4;
  if (c.confidenceTier === 'avoid') return -8;
  return 0;
}

export function scoreJudgeCandidate(judgeId: JudgeAgentId, c: RealCandidate): number {
  const m = normalizeMetrics(c);

  if (judgeId === 'data_scout') {
    const confirmedBonus =
      c.lineupStatus === 'confirmed' ? 8 : 0;
    return (
      m.hrScore * 0.12 +
      m.lineupVolume * 0.28 +
      m.handednessEdge * 0.2 +
      confidenceBonus(c) * 1.5 +
      confirmedBonus +
      m.hitterPower * 0.05 +
      m.pitcherVulnerability * 0.05 -
      m.warnings * 8 -
      m.penalties * 0.7
    );
  }

  if (judgeId === 'power_hunter') {
    return (
      m.hitterPower * 0.34 +
      m.pitcherVulnerability * 0.28 +
      m.parkContext * 0.14 +
      m.hrScore * 0.16 +
      m.recentForm * 0.08 -
      m.penalties * 0.15
    );
  }

  if (judgeId === 'momentum_reader') {
    return (
      m.recentForm * 0.42 +
      m.lineupVolume * 0.2 +
      m.hrScore * 0.14 +
      m.parkContext * 0.08 +
      m.handednessEdge * 0.08 +
      confidenceBonus(c) * 0.6 -
      m.warnings * 2.5
    );
  }

  return (
    m.warnings * 20 +
    m.penalties * 1.4 +
    (c.confidenceTier === 'avoid' ? 32 : 0) +
    (c.confidenceTier === 'thin' ? 20 : 0) +
    (m.hrScore < 55 ? 14 : 0) +
    (c.lineupStatus === 'projected' || c.lineupStatus === 'projected_unconfirmed' ? 10 : 0) -
    m.hitterPower * 0.08 -
    m.pitcherVulnerability * 0.08
  );
}

export function buildJudgePickReason(judgeId: JudgeAgentId, c: RealCandidate): string {
  const m = normalizeMetrics(c);

  if (judgeId === 'data_scout') {
    return `Clean math screen: lineup volume ${Math.round(m.lineupVolume)}, handedness edge ${Math.round(m.handednessEdge)}, penalties ${Math.round(m.penalties)}, ${m.warnings} warning${m.warnings === 1 ? '' : 's'}.`;
  }
  if (judgeId === 'power_hunter') {
    return `Power path: hitter power ${Math.round(m.hitterPower)}, pitcher vulnerability ${Math.round(m.pitcherVulnerability)}, park context ${Math.round(m.parkContext)}.`;
  }
  if (judgeId === 'momentum_reader') {
    return `Rhythm read: recent form ${Math.round(m.recentForm)}, lineup volume ${Math.round(m.lineupVolume)}, HR edge ${Math.round(m.hrScore)}.`;
  }

  const warning = c.boardWarnings?.[0] ?? c.reasons?.[0];
  if (warning) return `Trap flag: ${warning}`;
  if (c.confidenceTier === 'thin' || c.confidenceTier === 'avoid') {
    return `Trap flag: confidence tier is ${c.confidenceTier}.`;
  }
  return `Trap flag: penalties ${Math.round(m.penalties)} and HR edge ${Math.round(m.hrScore)} look thin for trust.`;
}

function passesJudgeGate(judgeId: JudgeAgentId, c: RealCandidate, relaxed = false): boolean {
  const m = normalizeMetrics(c);

  if (judgeId === 'risk_auditor') {
    return (
      m.warnings > 0 ||
      c.confidenceTier === 'thin' ||
      c.confidenceTier === 'avoid' ||
      m.penalties >= 20 ||
      m.hrScore < 55 ||
      c.lineupStatus === 'projected' ||
      c.lineupStatus === 'projected_unconfirmed'
    );
  }

  if (relaxed) return m.hrScore >= 40;

  if (judgeId === 'data_scout') {
    return m.hrScore >= 48 && m.penalties < 40 && m.warnings <= 3;
  }
  if (judgeId === 'power_hunter') {
    return m.hitterPower >= 48 || m.pitcherVulnerability >= 48 || m.parkContext >= 58;
  }
  if (judgeId === 'momentum_reader') {
    return m.recentForm >= 48 || (m.recentForm >= 42 && m.lineupVolume >= 65);
  }

  return m.hrScore >= 52;
}

export function rankCandidatesForJudge(
  judgeId: JudgeAgentId,
  candidates: RealCandidate[],
  limit = 5,
): RealCandidate[] {
  const strict = candidates.filter((c) => passesJudgeGate(judgeId, c, false));
  const pool =
    strict.length >= Math.min(3, limit)
      ? strict
      : candidates.filter((c) => passesJudgeGate(judgeId, c, true));

  return [...pool]
    .sort((a, b) => scoreJudgeCandidate(judgeId, b) - scoreJudgeCandidate(judgeId, a))
    .slice(0, limit);
}
