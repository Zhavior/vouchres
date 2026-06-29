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

function probability(c: Candidate): string {
  const n = Number(c.estimatedHrProbability);
  if (!Number.isFinite(n)) return "—";
  return n <= 1 ? `${(n * 100).toFixed(1)}%` : `${n.toFixed(1)}%`;
}

function playerName(c: Candidate): string {
  return c.playerName || c.name || "Unknown player";
}

function opponent(c: Candidate): string {
  return c.opponent || c.opponentTeam || "TBD";
}

function scheduledTime(date: string, override?: string): string {
  if (override) return override;

  const time = process.env.AI_JUDGE_PICK_TIME ?? "10:30";
  const timezone = process.env.AI_JUDGE_TIMEZONE ?? "America/Halifax";

  return `${date} ${time} ${timezone}`;
}

function selectPicks(judgeId: JudgeId, candidates: Candidate[]): Candidate[] {
  const rows = [...candidates];

  if (judgeId === "data_scout") {
    return rows
      .filter((c) => score(c) >= 60)
      .sort((a, b) => score(b) - score(a))
      .slice(0, 3);
  }

  if (judgeId === "power_hunter") {
    return rows.sort((a, b) => score(b) - score(a)).slice(0, 4);
  }

  if (judgeId === "momentum_reader") {
    return rows
      .sort((a, b) => {
        const ar = Number(a.scoreBreakdown?.recentForm ?? 0);
        const br = Number(b.scoreBreakdown?.recentForm ?? 0);
        return br - ar || score(b) - score(a);
      })
      .slice(0, 3);
  }

  if (judgeId === "risk_auditor") {
    return rows
      .filter((c) => safeArray(c.warnings).length > 0 || score(c) < 55)
      .sort((a, b) => safeArray(b.warnings).length - safeArray(a.warnings).length)
      .slice(0, 3);
  }

  return rows.sort((a, b) => score(b) - score(a)).slice(0, 3);
}

function composeDraft(judge: AiJudge, picks: Candidate[], date: string): string {
  if (judge.id === "risk_auditor") {
    const lines = picks.map((p, i) => {
      const warning = safeArray<string>(p.warnings)[0] ?? "Data quality or matchup risk needs review.";
      return `${i + 1}. ${playerName(p)} — ${p.team ?? "TBD"} vs ${opponent(p)}\nRisk note: ${warning}`;
    });

    return [
      `⚠️ VouchEdge ${judge.name} — HR Risk Check`,
      ``,
      ...lines,
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
      `Research only. Not betting advice.`,
      `Generated for ${date}.`,
    ].join("\n");
  }

  const lines = picks.map((p, i) => {
    const reason = safeArray<string>(p.reasons)[0] ?? "HR board signal supports this watchlist spot.";
    return `${i + 1}. ${playerName(p)} — ${p.team ?? "TBD"} vs ${opponent(p)}\nHR Edge: ${score(p)}/100 · Est HR: ${probability(p)}\nWhy: ${reason}`;
  });

  return [
    `🔥 VouchEdge ${judge.name} HR Picks`,
    ``,
    ...lines,
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

  const scheduledFor = scheduledTime(date, options?.scheduledFor);
  const created: SocialDraft[] = [];

  for (const judge of AI_JUDGES) {
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
    scheduledFor,
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
