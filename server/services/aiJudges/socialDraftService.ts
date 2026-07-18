import { randomUUID } from "crypto";
import { getCachedValidatedHrBoard } from "../hubs/hrBoardHub";
import {
  agentScore,
  buildJudgeReason,
  hrScore,
  rankCandidatesForJudge,
  safeArray,
  singlePickLimit,
  type JudgeCandidate,
  type JudgeId,
} from "./judgeScoring";

type DraftStatus = "draft" | "queued" | "mock_posted" | "failed";

type Candidate = JudgeCandidate;

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
];

function agentReason(judgeId: JudgeId, c: Candidate): string {
  return buildJudgeReason(judgeId, c);
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
  return rankCandidatesForJudge(judgeId, candidates, singlePickLimit(judgeId));
}

function composeDraft(
  judge: AiJudge,
  picks: Candidate[],
  date: string,
  opts?: { projectedUnconfirmed?: boolean },
): string {
  const honesty = opts?.projectedUnconfirmed
    ? `Official lineup not posted yet. Do not treat as confirmed. Research only — not betting advice.`
    : `Research only. Not betting advice. No guarantees.`;

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
      honesty,
      `Generated for ${date}.`,
    ].join("\n");
  }

  const lines = picks.map((p, i) => {
    const reason = agentReason(judge.id, p);
    return `${i + 1}. ${playerName(p)} — ${p.team ?? "TBD"} vs ${opponent(p)}\nHR Edge: ${hrScore(p)}/100 · Agent Score: ${agentScore(judge.id, p).toFixed(1)} · Est HR: ${probability(p)}\nWhy: ${reason}`;
  });

  return [
    `🔥 VouchEdge ${judge.name} HR Picks`,
    ``,
    ...lines,
    ``,
    premiumCta(judge.name),
    ``,
    honesty,
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
  const board = (await getCachedValidatedHrBoard(options?.date)) as any;
  const payload = board?.payload ?? board ?? {};
  const date = payload.date ?? options?.date ?? new Date().toISOString().slice(0, 10);

  // Confirmed batting-order rows only by default. Fall back to projected with
  // an explicit unconfirmed disclaimer — never silently mix the two pools.
  const confirmed = safeArray<Candidate>(payload.candidates);
  const projected = safeArray<Candidate>(payload.projectedCandidates);
  const projectedUnconfirmed = confirmed.length === 0;
  const candidates = projectedUnconfirmed ? projected : confirmed;

  const created: SocialDraft[] = [];

  for (const [judgeIndex, judge] of AI_JUDGES.entries()) {
    const scheduledFor = scheduledTimeForJudge(date, judgeIndex);
    const picks = selectPicks(judge.id, candidates);
    const now = new Date().toISOString();

    const draft: SocialDraft = {
      id: randomUUID(),
      judgeId: judge.id,
      judgeName: judge.name,
      postType: judge.id === "risk_auditor" ? "risk_report" : "hr_picks",
      platform: "x",
      status: "draft",
      date,
      scheduledFor,
      content: composeDraft(judge, picks, date, { projectedUnconfirmed }),
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
