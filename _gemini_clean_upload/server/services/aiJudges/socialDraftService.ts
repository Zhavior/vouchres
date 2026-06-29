import { randomUUID } from "crypto";
import { buildValidatedHrBoard } from "../mlb/hrPipeline";

type JudgeId =
  | "data_scout"
  | "power_hunter"
  | "momentum_reader"
  | "risk_auditor"
  | "pro_edge_agent";

type DraftStatus = "draft" | "queued" | "mock_posted" | "failed";

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

export type AiJudge = {
  id: JudgeId;
  name: string;
  icon: string;
  personality: string;
  strategy: string;
};

export type SocialDraft = {
  id: string;
  judgeId: JudgeId;
  judgeName: string;
  postType: "hr_picks" | "risk_report" | "pro_preview";
  platform: "x";
  status: DraftStatus;
  date: string;
  scheduledFor: string;
  content: string;
  picks: Candidate[];
  mockPostId?: string;
  createdAt: string;
  updatedAt: string;
};

const drafts = new Map<string, SocialDraft>();

export const AI_JUDGES: AiJudge[] = [
  {
    id: "data_scout",
    name: "Data Scout",
    icon: "DS",
    personality: "Careful, math-first, low-hype.",
    strategy: "Ranks cleaner HR profiles with stronger data quality.",
  },
  {
    id: "power_hunter",
    name: "Power Hunter",
    icon: "PH",
    personality: "Aggressive HR upside finder.",
    strategy: "Ranks the highest HR edge and power-path candidates.",
  },
  {
    id: "momentum_reader",
    name: "Momentum Reader",
    icon: "MR",
    personality: "Live rhythm and recent-form reader.",
    strategy: "Looks for recent form, pressure windows, and rising signals.",
  },
  {
    id: "risk_auditor",
    name: "Risk Auditor",
    icon: "RA",
    personality: "Skeptical, warning-first judge.",
    strategy: "Flags risky picks and weak-data traps before public posting.",
  },
  {
    id: "pro_edge_agent",
    name: "Pro Edge Agent",
    icon: "PE",
    personality: "Premium analyst for locked insights.",
    strategy: "Creates a Pro teaser without revealing every premium edge.",
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
    return (
      base * 0.35 +
      lineupVolume * 0.18 +
      handednessEdge * 0.14 +
      confidenceBonus(c) +
      hitterPower * 0.12 +
      pitcherVulnerability * 0.12 -
      warnings * 4 -
      penalties * 0.35
    );
  }

  if (judgeId === "power_hunter") {
    return (
      base * 0.40 +
      hitterPower * 0.28 +
      pitcherVulnerability * 0.22 +
      parkContext * 0.10 +
      recentForm * 0.08 -
      penalties * 0.20
    );
  }

  if (judgeId === "momentum_reader") {
    return (
      base * 0.25 +
      recentForm * 0.38 +
      lineupVolume * 0.16 +
      parkContext * 0.10 +
      handednessEdge * 0.10 +
      confidenceBonus(c) * 0.5 -
      warnings * 2
    );
  }

  if (judgeId === "risk_auditor") {
    return (
      warnings * 18 +
      penalties * 1.2 +
      (c.confidenceTier === "avoid" ? 30 : 0) +
      (c.confidenceTier === "thin" ? 18 : 0) +
      (base < 55 ? 12 : 0) -
      hitterPower * 0.10 -
      pitcherVulnerability * 0.10
    );
  }

  return (
    base * 0.34 +
    hitterPower * 0.18 +
    pitcherVulnerability * 0.18 +
    recentForm * 0.14 +
    lineupVolume * 0.10 +
    handednessEdge * 0.08 +
    parkContext * 0.08 +
    confidenceBonus(c) -
    warnings * 3 -
    penalties * 0.45
  );
}

function agentReason(judgeId: JudgeId, c: Candidate): string {
  if (judgeId === "data_scout") {
    return `Data Scout likes the cleaner profile: HR Edge ${score(c)}/100, lineup volume ${metric(c, "lineupVolume")}, handedness edge ${metric(c, "handednessEdge")}, confidence ${c.confidenceTier ?? "unknown"}.`;
  }

  if (judgeId === "power_hunter") {
    return `Power Hunter is chasing upside: hitter power ${metric(c, "hitterPower")}, pitcher vulnerability ${metric(c, "pitcherVulnerability")}, park context ${metric(c, "parkContext")}.`;
  }

  if (judgeId === "momentum_reader") {
    return `Momentum Reader sees rhythm: recent form ${metric(c, "recentForm")}, lineup volume ${metric(c, "lineupVolume")}, HR Edge ${score(c)}/100.`;
  }

  if (judgeId === "risk_auditor") {
    const warning = safeArray<string>(c.warnings)[0] ?? "This profile needs extra review before trusting it.";
    return `Risk Auditor flag: ${warning}`;
  }

  return `Pro Edge blends power, matchup, recent form, lineup volume, confidence tier, and risk penalties into one premium read.`;
}

function probability(c: Candidate): string {
  const n = Number(c.estimatedHrProbability);
  if (!Number.isFinite(n)) return "—";
  return n <= 1 ? `${(n * 100).toFixed(1)}%` : `${n.toFixed(1)}%`;
}

function premiumCta(judgeName: string): string {
  return [
    `Want the full card? Open VouchEdge to see every AI Judge pick, each judge’s win rate, full result history, and live HR board movement.`,
    `Track ${judgeName} against the other judges and see which AI style is winning today.`,
    `VouchEdge: AI-powered MLB research, HR signals, parlays, results, and judge leaderboards in one premium dashboard.`,
  ].join("\n");
}

function playerName(c: Candidate): string {
  return c.playerName || c.name || "Unknown player";
}

function opponent(c: Candidate): string {
  return c.opponent || c.opponentTeam || "TBD";
}

function addDays(date: string, days: number): string {
  const base = new Date(`${date}T12:00:00Z`);
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
}

function scheduledTimeForJudge(date: string, judgeIndex: number): string {
  const time = process.env.AI_JUDGE_PICK_TIME ?? "10:30";
  const timezone = process.env.AI_JUDGE_TIMEZONE ?? "America/Halifax";
  const postDate = addDays(date, judgeIndex);

  return `${postDate} ${time} ${timezone}`;
}

function selectPicks(judgeId: JudgeId, candidates: Candidate[]): Candidate[] {
  const rows = [...candidates];

  if (judgeId === "risk_auditor") {
    return rows
      .filter((c) => warningCount(c) > 0 || c.confidenceTier === "thin" || c.confidenceTier === "avoid" || score(c) < 55)
      .sort((a, b) => agentScore(judgeId, b) - agentScore(judgeId, a))
      .slice(0, 3);
  }

  const limit = judgeId === "power_hunter" ? 4 : 3;

  return rows
    .filter((c) => score(c) >= 45)
    .sort((a, b) => agentScore(judgeId, b) - agentScore(judgeId, a))
    .slice(0, limit);
}

function composeDraft(judge: AiJudge, picks: Candidate[], date: string): string {
  if (judge.id === "risk_auditor") {
    const lines = picks.map((p, i) => {
      return `${i + 1}. ${playerName(p)} — ${p.team ?? "TBD"} vs ${opponent(p)}\nRisk Score: ${agentScore(judge.id, p).toFixed(1)}\n${agentReason(judge.id, p)}`;
    });

    return [
      `⚠️ VouchEdge ${judge.name} — HR Risk Check`,
      ``,
      ...lines,
      ``,
      premiumCta(judge.name),
      ``,
      `Research only. Not betting advice. No guarantees.`,
      `Generated for ${date}.`,
    ].join("\n");
  }

  if (judge.id === "pro_edge_agent") {
    return [
      `🔒 VouchEdge ${judge.name} — Pro HR Preview`,
      ``,
      `The Pro model found ${picks.length} premium HR paths today.`,
      picks[0]
        ? `Top visible teaser: ${playerName(picks[0])} — HR Edge ${score(picks[0])}/100`
        : `Top visible teaser: pending HR board data.`,
      ``,
      `Pro unlock later: RBI windows, bullpen fatigue, stolen bases, pitch mix, and live parlay impact.`,
      ``,
      premiumCta(judge.name),
      ``,
      `Research only. Not betting advice.`,
      `Generated for ${date}.`,
    ].join("\n");
  }

  const lines = picks.map((p, i) => {
    const reason = agentReason(judge.id, p);
    return `${i + 1}. ${playerName(p)} — ${p.team ?? "TBD"} vs ${opponent(p)}\nHR Edge: ${score(p)}/100 · Agent Score: ${agentScore(judge.id, p).toFixed(1)} · Est HR: ${probability(p)}\nWhy: ${reason}`;
  });

  return [
    `🔥 VouchEdge ${judge.name} HR Picks`,
    ``,
    ...lines,
    ``,
    premiumCta(judge.name),
    ``,
    `Research only. Not betting advice. Lineups may be projected.`,
    `Generated for ${date}.`,
  ].join("\n");
}

export function listJudges(): AiJudge[] {
  return AI_JUDGES;
}

export function listDrafts(): SocialDraft[] {
  return [...drafts.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function generateHrSocialDrafts(options?: {
  date?: string;
  scheduledFor?: string;
}): Promise<{
  date: string;
  scheduledFor: string;
  candidateCount: number;
  drafts: SocialDraft[];
}> {
  const board = (await buildValidatedHrBoard(options?.date)) as any;
  const payload = board?.payload ?? board ?? {};
  const date = payload.date ?? options?.date ?? new Date().toISOString().slice(0, 10);

  const candidates = [
    ...safeArray<Candidate>(payload.candidates),
    ...safeArray<Candidate>(payload.projectedCandidates),
  ];

  const created: SocialDraft[] = [];

  for (const [judgeIndex, judge] of AI_JUDGES.entries()) {
    const scheduledFor = scheduledTimeForJudge(date, judgeIndex);
    const picks = selectPicks(judge.id, candidates);
    const now = new Date().toISOString();

    const draft: SocialDraft = {
      id: randomUUID(),
      judgeId: judge.id,
      judgeName: judge.name,
      postType:
        judge.id === "risk_auditor"
          ? "risk_report"
          : judge.id === "pro_edge_agent"
            ? "pro_preview"
            : "hr_picks",
      platform: "x",
      status: "draft",
      date,
      scheduledFor,
      content: composeDraft(judge, picks, date),
      picks,
      createdAt: now,
      updatedAt: now,
    };

    drafts.set(draft.id, draft);
    created.push(draft);
  }

  return {
    date,
    scheduledFor: "staggered_daily_rotation",
    candidateCount: candidates.length,
    drafts: created,
  };
}

export function queueDraft(draftId: string): SocialDraft {
  const draft = drafts.get(draftId);
  if (!draft) throw new Error("Draft not found");

  const updated: SocialDraft = {
    ...draft,
    status: "queued",
    updatedAt: new Date().toISOString(),
  };

  drafts.set(draftId, updated);
  return updated;
}

export function mockPostDraft(draftId: string): SocialDraft {
  const draft = drafts.get(draftId);
  if (!draft) throw new Error("Draft not found");

  const updated: SocialDraft = {
    ...draft,
    status: "mock_posted",
    mockPostId: `mock_x_${Date.now()}`,
    updatedAt: new Date().toISOString(),
  };

  drafts.set(draftId, updated);
  return updated;
}
