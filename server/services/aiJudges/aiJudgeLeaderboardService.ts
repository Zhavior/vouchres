import { buildValidatedHrBoard } from "../mlb/hrPipeline";

type JudgeId =
  | "data_scout"
  | "power_hunter"
  | "momentum_reader"
  | "risk_auditor"
  | "pro_edge_agent";

type Candidate = {
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
};

const AI_JUDGES: Array<{
  id: JudgeId;
  displayName: string;
  handle: string;
  tagline: string;
  persona: string;
  color: string;
}> = [
  {
    id: "data_scout",
    displayName: "Data Scout",
    handle: "ai-data-scout",
    tagline: "Clean math. Low hype. Safer profiles.",
    persona: "Finds cleaner HR profiles with better data quality and fewer red flags.",
    color: "cyan",
  },
  {
    id: "power_hunter",
    displayName: "Power Hunter",
    handle: "ai-power-hunter",
    tagline: "Home-run upside hunter.",
    persona: "Chases raw HR upside using hitter power, pitcher vulnerability, and park context.",
    color: "orange",
  },
  {
    id: "momentum_reader",
    displayName: "Momentum Reader",
    handle: "ai-momentum-reader",
    tagline: "Recent form and rhythm reader.",
    persona: "Reads recent form, lineup volume, and short-term momentum signals.",
    color: "purple",
  },
  {
    id: "risk_auditor",
    displayName: "Risk Auditor",
    handle: "ai-risk-auditor",
    tagline: "Finds traps before they cost you.",
    persona: "Flags thin data, risky profiles, projection problems, and low-confidence picks.",
    color: "red",
  },
  {
    id: "pro_edge_agent",
    displayName: "Pro Edge Agent",
    handle: "ai-pro-edge",
    tagline: "Premium blended model.",
    persona: "Blends power, matchup, form, confidence, and risk into one premium read.",
    color: "emerald",
  },
];

function safeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function score(c: Candidate): number {
  const n = Number(c.hrScore);
  return Number.isFinite(n) ? n : 0;
}

function metric(c: Candidate, key: string): number {
  const n = Number(c.scoreBreakdown?.[key] ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function warningCount(c: Candidate): number {
  return safeArray(c.warnings).length;
}

function confidenceBonus(c: Candidate): number {
  if (c.confidenceTier === "elite") return 10;
  if (c.confidenceTier === "strong") return 7;
  if (c.confidenceTier === "watchlist") return 3;
  if (c.confidenceTier === "thin") return -5;
  if (c.confidenceTier === "avoid") return -12;
  return 0;
}

function agentScore(judgeId: JudgeId, c: Candidate): number {
  const base = score(c);
  const hitterPower = metric(c, "hitterPower");
  const pitcherVulnerability = metric(c, "pitcherVulnerability");
  const parkContext = metric(c, "parkContext");
  const lineupVolume = metric(c, "lineupVolume");
  const handednessEdge = metric(c, "handednessEdge");
  const recentForm = metric(c, "recentForm");
  const penalties = Math.abs(metric(c, "penalties"));
  const warnings = warningCount(c);

  if (judgeId === "data_scout") {
    return base * 0.35 + lineupVolume * 0.18 + handednessEdge * 0.14 + confidenceBonus(c) + hitterPower * 0.12 + pitcherVulnerability * 0.12 - warnings * 4 - penalties * 0.35;
  }

  if (judgeId === "power_hunter") {
    return base * 0.40 + hitterPower * 0.28 + pitcherVulnerability * 0.22 + parkContext * 0.10 + recentForm * 0.08 - penalties * 0.20;
  }

  if (judgeId === "momentum_reader") {
    return base * 0.25 + recentForm * 0.38 + lineupVolume * 0.16 + parkContext * 0.10 + handednessEdge * 0.10 + confidenceBonus(c) * 0.5 - warnings * 2;
  }

  if (judgeId === "risk_auditor") {
    return warnings * 18 + penalties * 1.2 + (c.confidenceTier === "avoid" ? 30 : 0) + (c.confidenceTier === "thin" ? 18 : 0) + (base < 55 ? 12 : 0) - hitterPower * 0.10 - pitcherVulnerability * 0.10;
  }

  return base * 0.34 + hitterPower * 0.18 + pitcherVulnerability * 0.18 + recentForm * 0.14 + lineupVolume * 0.10 + handednessEdge * 0.08 + parkContext * 0.08 + confidenceBonus(c) - warnings * 3 - penalties * 0.45;
}

function selectTopPicks(judgeId: JudgeId, candidates: Candidate[]) {
  const rows = [...candidates];

  const picked =
    judgeId === "risk_auditor"
      ? rows
          .filter((c) => warningCount(c) > 0 || c.confidenceTier === "thin" || c.confidenceTier === "avoid" || score(c) < 55)
          .sort((a, b) => agentScore(judgeId, b) - agentScore(judgeId, a))
          .slice(0, 5)
      : rows
          .filter((c) => score(c) >= 45)
          .sort((a, b) => agentScore(judgeId, b) - agentScore(judgeId, a))
          .slice(0, 5);

  return picked.map((p, index) => ({
    rank: index + 1,
    playerId: p.playerId ?? null,
    playerName: p.playerName ?? p.name ?? "Unknown player",
    team: p.team ?? "TBD",
    opponent: p.opponent ?? p.opponentTeam ?? "TBD",
    opponentPitcherName: p.opponentPitcherName ?? "TBD",
    venue: p.venue ?? "TBD",
    pickType: "HR",
    market: "Home Run",
    hrScore: score(p),
    agentScore: Number(agentScore(judgeId, p).toFixed(1)),
    estimatedHrProbability: p.estimatedHrProbability ?? null,
    confidenceTier: p.confidenceTier ?? null,
    riskTier: p.riskTier ?? null,
    reasons: safeArray<string>(p.reasons).slice(0, 3),
    warnings: safeArray<string>(p.warnings).slice(0, 3),
    parlayLeg: {
      type: "player_prop",
      sport: "mlb",
      market: "home_run",
      playerName: p.playerName ?? p.name ?? "Unknown player",
      team: p.team ?? "TBD",
      opponent: p.opponent ?? p.opponentTeam ?? "TBD",
      label: `${p.playerName ?? p.name ?? "Unknown player"} HR`,
    },
  }));
}

async function getCapperStatsByNames(_names: string[]) {
  // Safe fallback for local/dev and hidden prototype mode.
  // Later, when AI Judge picks are saved as real cappers, this can read Supabase trust_scores again.
  return {
    capperMap: new Map<string, any>(),
    scoreMap: new Map<string, any>(),
  };
}

export async function buildAiJudgeLeaderboard() {
  const board = (await buildValidatedHrBoard()) as any;
  const payload = board?.payload ?? board ?? {};

  const candidates = [
    ...safeArray<Candidate>(payload.candidates),
    ...safeArray<Candidate>(payload.projectedCandidates),
  ];

  const { capperMap, scoreMap } = await getCapperStatsByNames(AI_JUDGES.map((j) => j.displayName));

  const judges = AI_JUDGES.map((judge) => {
    const capper = capperMap.get(judge.displayName) as any;
    const stats = capper ? (scoreMap.get(capper.id) as any) : null;

    const won = Number(stats?.won_picks ?? 0);
    const lost = Number(stats?.lost_picks ?? 0);
    const pushed = Number(stats?.pushed_picks ?? 0);
    const graded = won + lost + pushed;
    const winRate = won + lost > 0 ? Number(((won / (won + lost)) * 100).toFixed(1)) : null;

    return {
      ...judge,
      capperId: capper?.id ?? null,
      trustScore: stats?.score != null ? Number(stats.score) : 50,
      winRate,
      record: {
        won,
        lost,
        pushed,
        graded,
        pending: 0,
        netUnits: Number(stats?.net_units ?? 0),
      },
      topPicks: selectTopPicks(judge.id, candidates),
      parlayBuilder: {
        judgeId: judge.id,
        judgeName: judge.displayName,
        suggestedParlayName: `${judge.displayName} Top HR Parlay`,
        maxLegs: 5,
        legs: selectTopPicks(judge.id, candidates).slice(0, 5).map((p) => p.parlayLeg),
      },
    };
  });

  const leaderboard = [...judges].sort((a, b) => {
    const aScore = a.winRate ?? a.trustScore ?? 0;
    const bScore = b.winRate ?? b.trustScore ?? 0;
    return bScore - aScore;
  });

  return {
    status: "ready",
    source: "ai_judge_leaderboard",
    date: payload.date ?? new Date().toISOString().slice(0, 10),
    candidateCount: candidates.length,
    leaderboard,
  };
}
