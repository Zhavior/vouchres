export type JudgeId =
  | "data_scout"
  | "power_hunter"
  | "momentum_reader"
  | "risk_auditor"
  | "pro_edge_agent";

export type JudgeCandidate = {
  playerId?: number | string;
  playerName?: string;
  name?: string;
  team?: string;
  opponent?: string;
  opponentTeam?: string;
  opponentPitcherName?: string;
  venue?: string;
  hrScore?: number;
  riskTier?: string;
  confidenceTier?: string;
  estimatedHrProbability?: number;
  reasons?: string[];
  warnings?: string[];
  scoreBreakdown?: Record<string, number>;
  status?: string;
  lineupStatus?: string;
  injuryStatus?: string;
  activeRosterStatus?: boolean;
};

export type JudgePickMeta = {
  pickType: string;
  market: string;
  specialtyLabel: string;
  singlePickLabel: string;
};

/** Each judge publishes exactly one daily single-leg pick. */
export function singlePickLimit(_judgeId?: JudgeId): number {
  return 1;
}

export type NormalizedMetrics = {
  hitterPower: number;
  pitcherVulnerability: number;
  parkContext: number;
  lineupVolume: number;
  handednessEdge: number;
  recentForm: number;
  penalties: number;
  warnings: number;
  hrScore: number;
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export function safeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export function hrScore(c: JudgeCandidate): number {
  const n = Number(c.hrScore);
  return Number.isFinite(n) ? n : 0;
}

function rawMetric(c: JudgeCandidate, key: string): number {
  const n = Number(c.scoreBreakdown?.[key] ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export function normalizeMetrics(c: JudgeCandidate): NormalizedMetrics {
  const hitterPower = rawMetric(c, "hitterPower");
  const pitcherVulnerability = rawMetric(c, "pitcherVulnerability");

  let parkContext = rawMetric(c, "parkContext");
  if (parkContext <= 0) {
    const parkFactor = rawMetric(c, "parkFactor");
    parkContext = parkFactor > 0 ? clamp(50 + (parkFactor - 100) * 2.5, 0, 100) : 50;
  }

  let lineupVolume = rawMetric(c, "lineupVolume");
  if (lineupVolume <= 0) {
    lineupVolume = rawMetric(c, "lineupConfidence");
    if (lineupVolume <= 0) {
      lineupVolume =
        c.lineupStatus === "confirmed" || c.status === "confirmed" ? 80 : 55;
    }
  }

  let handednessEdge = rawMetric(c, "handednessEdge");
  if (handednessEdge <= 0) {
    handednessEdge =
      c.lineupStatus === "confirmed" || c.status === "confirmed" ? 62 : 50;
  }

  let recentForm = rawMetric(c, "recentForm");
  if (recentForm <= 0 && c.scoreBreakdown?.recentForm != null) {
    recentForm = rawMetric(c, "recentForm");
  }

  let penalties = rawMetric(c, "penalties");
  if (penalties <= 0) {
    penalties = rawMetric(c, "riskPenalty");
  }

  return {
    hitterPower,
    pitcherVulnerability,
    parkContext,
    lineupVolume,
    handednessEdge,
    recentForm,
    penalties,
    warnings: safeArray(c.warnings).length,
    hrScore: hrScore(c),
  };
}

export function confidenceBonus(c: JudgeCandidate): number {
  if (c.confidenceTier === "elite") return 10;
  if (c.confidenceTier === "strong") return 7;
  if (c.confidenceTier === "watchlist") return 3;
  if (c.confidenceTier === "thin") return -5;
  if (c.confidenceTier === "avoid") return -12;
  return 0;
}

type RegistryAgent = {
  scoreCandidate: (c: JudgeCandidate) => number;
  pickMeta?: () => JudgePickMeta;
  buildReason?: (c: JudgeCandidate) => string;
  passesGate?: (c: JudgeCandidate, relaxed: boolean) => boolean;
};

let resolveRegistryAgent: ((id: string) => RegistryAgent | undefined) | null = null;

/** Wired by agentRegistry at boot — avoids circular ESM/require issues in tests. */
export function setAgentResolver(fn: (id: string) => RegistryAgent | undefined): void {
  resolveRegistryAgent = fn;
}

function getRegistryAgent(id: string): RegistryAgent | undefined {
  return resolveRegistryAgent?.(id);
}

/** Built-in judge scoring — used by registry plugins and as fallback. */
export function scoreBuiltinJudge(judgeId: JudgeId, c: JudgeCandidate): number {
  const m = normalizeMetrics(c);

  if (judgeId === "data_scout") {
    const confirmedBonus =
      c.lineupStatus === "confirmed" || c.status === "confirmed" ? 8 : 0;
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

  if (judgeId === "power_hunter") {
    return (
      m.hitterPower * 0.34 +
      m.pitcherVulnerability * 0.28 +
      m.parkContext * 0.14 +
      m.hrScore * 0.16 +
      m.recentForm * 0.08 -
      m.penalties * 0.15
    );
  }

  if (judgeId === "momentum_reader") {
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

  if (judgeId === "risk_auditor") {
    return (
      m.warnings * 20 +
      m.penalties * 1.4 +
      (c.confidenceTier === "avoid" ? 32 : 0) +
      (c.confidenceTier === "thin" ? 20 : 0) +
      (m.hrScore < 55 ? 14 : 0) +
      (c.lineupStatus === "projected" || c.lineupStatus === "projected_unconfirmed" ? 10 : 0) -
      m.hitterPower * 0.08 -
      m.pitcherVulnerability * 0.08
    );
  }

  return (
    m.hrScore * 0.28 +
    m.hitterPower * 0.18 +
    m.pitcherVulnerability * 0.16 +
    m.recentForm * 0.14 +
    m.lineupVolume * 0.1 +
    m.handednessEdge * 0.06 +
    m.parkContext * 0.08 +
    confidenceBonus(c) -
    m.warnings * 3 -
    m.penalties * 0.4
  );
}

/** Delegates to registry plugin when registered, else built-in specialty math. */
export function agentScore(judgeId: JudgeId, c: JudgeCandidate): number {
  const plugin = getRegistryAgent(judgeId);
  if (plugin) return plugin.scoreCandidate(c);
  return scoreBuiltinJudge(judgeId, c);
}

export function builtinJudgePickMeta(judgeId: JudgeId): JudgePickMeta {
  if (judgeId === "data_scout") {
    return {
      pickType: "CLEAN_SCREEN",
      market: "Safer HR Single",
      specialtyLabel: "Safer data profile",
      singlePickLabel: "Safer HR Single",
    };
  }
  if (judgeId === "power_hunter") {
    return {
      pickType: "POWER_THREAT",
      market: "HR Single",
      specialtyLabel: "Raw power upside",
      singlePickLabel: "HR Single",
    };
  }
  if (judgeId === "momentum_reader") {
    return {
      pickType: "FORM_PLAY",
      market: "Form Single",
      specialtyLabel: "Recent rhythm signal",
      singlePickLabel: "Form Single",
    };
  }
  if (judgeId === "risk_auditor") {
    return {
      pickType: "AVOID",
      market: "Trap Avoid",
      specialtyLabel: "Risk flag — not a play",
      singlePickLabel: "Trap Avoid",
    };
  }
  return {
    pickType: "PREMIUM_EDGE",
    market: "Premium Blended Single",
    specialtyLabel: "Blended premium edge",
    singlePickLabel: "Premium Blended Single",
  };
}

export function judgePickMeta(judgeId: JudgeId): JudgePickMeta {
  const plugin = getRegistryAgent(judgeId);
  if (plugin?.pickMeta) return plugin.pickMeta();
  return builtinJudgePickMeta(judgeId);
}

export function builtinJudgeReason(judgeId: JudgeId, c: JudgeCandidate): string {
  const m = normalizeMetrics(c);

  if (judgeId === "data_scout") {
    return `Clean math screen: lineup volume ${Math.round(m.lineupVolume)}, handedness edge ${Math.round(m.handednessEdge)}, penalties ${Math.round(m.penalties)}, ${m.warnings} warning${m.warnings === 1 ? "" : "s"}.`;
  }

  if (judgeId === "power_hunter") {
    return `Power path: hitter power ${Math.round(m.hitterPower)}, pitcher vulnerability ${Math.round(m.pitcherVulnerability)}, park context ${Math.round(m.parkContext)}.`;
  }

  if (judgeId === "momentum_reader") {
    return `Rhythm read: recent form ${Math.round(m.recentForm)}, lineup volume ${Math.round(m.lineupVolume)}, HR edge ${Math.round(m.hrScore)}.`;
  }

  if (judgeId === "risk_auditor") {
    const warning = safeArray<string>(c.warnings)[0];
    if (warning) return `Trap flag: ${warning}`;
    if (c.confidenceTier === "thin" || c.confidenceTier === "avoid") {
      return `Trap flag: confidence tier is ${c.confidenceTier}.`;
    }
    return `Trap flag: penalties ${Math.round(m.penalties)} and HR edge ${Math.round(m.hrScore)} look thin for trust.`;
  }

  return `Premium blend: power ${Math.round(m.hitterPower)}, matchup ${Math.round(m.pitcherVulnerability)}, form ${Math.round(m.recentForm)}, confidence ${c.confidenceTier ?? "unknown"}.`;
}

export function buildJudgeReason(judgeId: JudgeId, c: JudgeCandidate): string {
  const plugin = getRegistryAgent(judgeId);
  if (plugin?.buildReason) return plugin.buildReason(c);
  return builtinJudgeReason(judgeId, c);
}

export function passesBuiltinJudgeGate(judgeId: JudgeId, c: JudgeCandidate, relaxed = false): boolean {
  const m = normalizeMetrics(c);

  if (judgeId === "risk_auditor") {
    return (
      m.warnings > 0 ||
      c.confidenceTier === "thin" ||
      c.confidenceTier === "avoid" ||
      m.penalties >= 20 ||
      m.hrScore < 55 ||
      c.lineupStatus === "projected" ||
      c.lineupStatus === "projected_unconfirmed"
    );
  }

  if (relaxed) return m.hrScore >= 40;

  if (judgeId === "data_scout") {
    return m.hrScore >= 48 && m.penalties < 40 && m.warnings <= 3;
  }

  if (judgeId === "power_hunter") {
    return m.hitterPower >= 48 || m.pitcherVulnerability >= 48 || m.parkContext >= 58;
  }

  if (judgeId === "momentum_reader") {
    return m.recentForm >= 48 || (m.recentForm >= 42 && m.lineupVolume >= 65);
  }

  return m.hrScore >= 52;
}

function passesJudgeGate(judgeId: JudgeId, c: JudgeCandidate, relaxed = false): boolean {
  const plugin = getRegistryAgent(judgeId);
  if (plugin?.passesGate) return plugin.passesGate(c, relaxed);
  return passesBuiltinJudgeGate(judgeId, c, relaxed);
}

export function rankCandidatesForJudge(
  judgeId: JudgeId,
  candidates: JudgeCandidate[],
  limit = 5,
): JudgeCandidate[] {
  const strict = candidates.filter((c) => passesJudgeGate(judgeId, c, false));
  const pool =
    strict.length >= Math.min(3, limit)
      ? strict
      : candidates.filter((c) => passesJudgeGate(judgeId, c, true));

  return [...pool]
    .sort((a, b) => agentScore(judgeId, b) - agentScore(judgeId, a))
    .slice(0, limit);
}

export function availabilityForPick(candidate: JudgeCandidate, judgeId: JudgeId) {
  const warnings = safeArray<string>(candidate.warnings);
  const reasons: string[] = [];

  const lineupStatus = String(candidate.lineupStatus ?? "unknown");
  const injuryStatus = String(candidate.injuryStatus ?? "unknown");
  const status = String(candidate.status ?? "unknown");
  const activeRosterStatus = candidate.activeRosterStatus !== false;

  if (!activeRosterStatus) {
    return {
      status: "avoid",
      label: "Not active-roster eligible",
      gradeable: false,
      reasons: ["Player is not active on today's verified roster."],
    };
  }

  if (["injured_list", "scratched"].includes(injuryStatus)) {
    return {
      status: "avoid",
      label: injuryStatus === "scratched" ? "Scratched" : "Injured list",
      gradeable: false,
      reasons: [`Injury status: ${injuryStatus}`],
    };
  }

  if (judgeId === "risk_auditor") {
    return {
      status: "avoid",
      label: "Trap Watch / Avoid Board",
      gradeable: true,
      reasons: warnings.length
        ? warnings.slice(0, 3)
        : ["Risk Auditor flagged this as a caution profile."],
    };
  }

  if (lineupStatus === "confirmed" || status === "confirmed") {
    return {
      status: "confirmed",
      label: "Confirmed in lineup",
      gradeable: true,
      reasons: ["Official lineup/validated candidate feed confirms this player."],
    };
  }

  if (
    lineupStatus === "projected" ||
    lineupStatus === "projected_unconfirmed" ||
    status === "projected"
  ) {
    reasons.push("Player is roster-valid, but official lineup is not confirmed yet.");
    if (injuryStatus === "day_to_day" || injuryStatus === "questionable") {
      reasons.push(`Injury status: ${injuryStatus}. Use caution.`);
      return {
        status: "questionable",
        label: "Projected but questionable",
        gradeable: false,
        reasons,
      };
    }

    return {
      status: "projected",
      label: "Projected / wait for lineup",
      gradeable: false,
      reasons,
    };
  }

  if (injuryStatus === "day_to_day" || injuryStatus === "questionable" || warnings.length > 0) {
    return {
      status: "questionable",
      label: "Questionable / needs review",
      gradeable: false,
      reasons: warnings.length ? warnings.slice(0, 3) : [`Injury status: ${injuryStatus}`],
    };
  }

  return {
    status: "questionable",
    label: "Availability unknown",
    gradeable: false,
    reasons: ["Lineup and availability are not confirmed enough for grading."],
  };
}

export function buildJudgePick(
  judgeId: JudgeId,
  candidate: JudgeCandidate,
  rank: number,
) {
  const meta = judgePickMeta(judgeId);
  const availability = availabilityForPick(candidate, judgeId);
  const playerName = candidate.playerName ?? candidate.name ?? "Unknown player";
  const m = normalizeMetrics(candidate);

  return {
    rank,
    judgeId,
    playerId: candidate.playerId ?? null,
    playerName,
    team: candidate.team ?? "TBD",
    opponent: candidate.opponent ?? candidate.opponentTeam ?? "TBD",
    opponentPitcherName: candidate.opponentPitcherName ?? "TBD",
    venue: candidate.venue ?? "TBD",
    pickType: meta.pickType,
    market: meta.market,
    specialtyLabel: meta.specialtyLabel,
    singlePickLabel: meta.singlePickLabel,
    judgeReason: buildJudgeReason(judgeId, candidate),
    hrScore: m.hrScore,
    agentScore: Number(agentScore(judgeId, candidate).toFixed(1)),
    estimatedHrProbability: candidate.estimatedHrProbability ?? null,
    confidenceTier: candidate.confidenceTier ?? null,
    riskTier: candidate.riskTier ?? null,
    lineupStatus: candidate.lineupStatus ?? null,
    injuryStatus: candidate.injuryStatus ?? null,
    activeRosterStatus: candidate.activeRosterStatus ?? null,
    availability,
    reasons: safeArray<string>(candidate.reasons).slice(0, 3),
    warnings: safeArray<string>(candidate.warnings).slice(0, 3),
    gradeable: availability.gradeable,
    isAvoidPick: judgeId === "risk_auditor",
  };
}

export function selectTopPickForJudge(judgeId: JudgeId, candidates: JudgeCandidate[]) {
  const [candidate] = rankCandidatesForJudge(judgeId, candidates, 1);
  return candidate ? buildJudgePick(judgeId, candidate, 1) : null;
}

export function selectTopPicksForJudge(judgeId: JudgeId, candidates: JudgeCandidate[]) {
  const pick = selectTopPickForJudge(judgeId, candidates);
  return pick ? [pick] : [];
}

/** Win rate from graded singles only (won / (won + lost), pushes excluded). */
export function computeJudgeWinRate(stats: {
  won?: number;
  lost?: number;
  pushed?: number;
}): number | null {
  const won = Number(stats.won ?? 0);
  const lost = Number(stats.lost ?? 0);
  if (won + lost <= 0) return null;
  return Number(((won / (won + lost)) * 100).toFixed(1));
}

export function computeJudgeRecord(opts: {
  won?: number | null;
  lost?: number | null;
  pushed?: number | null;
  pending?: number | null;
  netUnits?: number | null;
}) {
  const won = Number(opts.won ?? 0);
  const lost = Number(opts.lost ?? 0);
  const pushed = Number(opts.pushed ?? 0);
  const pending = Number(opts.pending ?? 0);
  const graded = won + lost + pushed;

  return {
    won,
    lost,
    pushed,
    graded,
    pending,
    netUnits: Number(opts.netUnits ?? 0),
    winRate: computeJudgeWinRate({ won, lost, pushed }),
  };
}
