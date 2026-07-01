import type { VercelRequest, VercelResponse } from "@vercel/node";

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
  status?: string;
  lineupStatus?: string;
  injuryStatus?: string;
  activeRosterStatus?: boolean;
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
    persona: "Finds cleaner HR profiles with stronger data quality and fewer red flags.",
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

function availabilityForPick(candidate: Candidate, judgeId: JudgeId) {
  const warnings = safeArray<string>(candidate.warnings);
  const lineupStatus = String(candidate.lineupStatus ?? "projected_unconfirmed");
  const injuryStatus = String(candidate.injuryStatus ?? "unknown");
  const status = String(candidate.status ?? "unknown");
  const activeRosterStatus = candidate.activeRosterStatus !== false;

  if (!activeRosterStatus) {
    return {
      status: "avoid",
      label: "Not active-roster eligible",
      parlayEligible: false,
      reasons: ["Player is not active on today's verified roster."],
    };
  }

  if (["injured_list", "scratched"].includes(injuryStatus)) {
    return {
      status: "avoid",
      label: injuryStatus === "scratched" ? "Scratched" : "Injured list",
      parlayEligible: false,
      reasons: [`Injury status: ${injuryStatus}`],
    };
  }

  if (judgeId === "risk_auditor") {
    return {
      status: "avoid",
      label: "Trap Watch / Avoid Board",
      parlayEligible: false,
      reasons: warnings.length ? warnings.slice(0, 3) : ["Risk Auditor flagged this as a caution profile."],
    };
  }

  if (lineupStatus === "confirmed" || status === "confirmed") {
    return {
      status: "confirmed",
      label: "Confirmed in lineup",
      parlayEligible: true,
      reasons: ["Official lineup/validated candidate feed confirms this player."],
    };
  }

  if (lineupStatus.includes("projected") || status === "projected") {
    return {
      status: "projected",
      label: "Projected / wait for lineup",
      parlayEligible: true,
      reasons: ["Player is roster-valid, but official lineup is not confirmed yet."],
    };
  }

  return {
    status: "questionable",
    label: "Availability unknown",
    parlayEligible: false,
    reasons: ["Lineup and availability are not confirmed enough for parlay use."],
  };
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

  return picked.map((p, index) => {
    const availability = availabilityForPick(p, judgeId);
    const playerName = p.playerName ?? p.name ?? "Unknown player";

    return {
      rank: index + 1,
      playerId: p.playerId ?? null,
      playerName,
      team: p.team ?? "TBD",
      opponent: p.opponent ?? p.opponentTeam ?? "TBD",
      opponentPitcherName: p.opponentPitcherName ?? "TBD",
      venue: p.venue ?? "TBD",
      pickType: judgeId === "risk_auditor" ? "AVOID" : "HR",
      market: judgeId === "risk_auditor" ? "Trap Watch" : "Home Run",
      hrScore: score(p),
      agentScore: Number(agentScore(judgeId, p).toFixed(1)),
      estimatedHrProbability: p.estimatedHrProbability ?? null,
      confidenceTier: p.confidenceTier ?? null,
      riskTier: p.riskTier ?? null,
      lineupStatus: p.lineupStatus ?? null,
      injuryStatus: p.injuryStatus ?? null,
      activeRosterStatus: p.activeRosterStatus ?? null,
      availability,
      reasons: safeArray<string>(p.reasons).slice(0, 3),
      warnings: safeArray<string>(p.warnings).slice(0, 3),
      parlayEligible: availability.parlayEligible,
      parlayLeg: availability.parlayEligible
        ? {
            type: "player_prop",
            sport: "mlb",
            market: "home_run",
            playerName,
            team: p.team ?? "TBD",
            opponent: p.opponent ?? p.opponentTeam ?? "TBD",
            label: `${playerName} HR`,
          }
        : null,
    };
  });
}

async function loadHrCandidates(req: VercelRequest): Promise<{ date: string; candidates: Candidate[] }> {
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers.host;
  const url = `${proto}://${host}/api/mlb/hr-board/today`;

  const response = await fetch(url, {
    headers: { accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`HR Board unavailable (${response.status})`);
  }

  const board = await response.json();
  const payload = board?.payload ?? board ?? {};

  return {
    date: payload.date ?? new Date().toISOString().slice(0, 10),
    candidates: [
      ...safeArray<Candidate>(payload.candidates),
      ...safeArray<Candidate>(payload.projectedCandidates),
    ],
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ status: "error", message: "Method not allowed" });
  }

  try {
    const { date, candidates } = await loadHrCandidates(req);

    const judges = AI_JUDGES.map((judge) => {
      const topPicks = selectTopPicks(judge.id, candidates);
      const legs = topPicks
        .filter((p) => p.parlayEligible && p.parlayLeg)
        .slice(0, 5)
        .map((p) => p.parlayLeg);

      return {
        ...judge,
        capperId: null,
        trustScore: 50,
        winRate: null,
        record: {
          won: 0,
          lost: 0,
          pushed: 0,
          graded: 0,
          pending: 0,
          netUnits: 0,
        },
        topPicks,
        parlayBuilder: {
          judgeId: judge.id,
          judgeName: judge.displayName,
          suggestedParlayName: `${judge.displayName} Top HR Parlay`,
          maxLegs: 5,
          legs,
        },
      };
    });

    return res.status(200).json({
      status: "ready",
      source: "vercel_ai_judge_leaderboard",
      date,
      candidateCount: candidates.length,
      leaderboard: judges.sort((a, b) => {
        const aScore = a.topPicks?.[0]?.agentScore ?? 0;
        const bScore = b.topPicks?.[0]?.agentScore ?? 0;
        return bScore - aScore;
      }),
    });
  } catch (error: any) {
    return res.status(500).json({
      status: "error",
      source: "vercel_ai_judge_leaderboard",
      message: error?.message ?? "Failed to build AI Judge leaderboard",
    });
  }
}
