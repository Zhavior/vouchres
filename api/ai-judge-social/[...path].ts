import type { VercelRequest, VercelResponse } from "@vercel/node";
import { randomUUID } from "crypto";

type JudgeId =
  | "data_scout"
  | "power_hunter"
  | "momentum_reader"
  | "risk_auditor"
  | "pro_edge_agent";

type Candidate = {
  playerName?: string;
  name?: string;
  team?: string;
  opponent?: string;
  opponentTeam?: string;
  opponentPitcherName?: string;
  hrScore?: number;
  estimatedHrProbability?: number;
  reasons?: string[];
  warnings?: string[];
};

type Draft = {
  id: string;
  judgeId: JudgeId;
  judgeName: string;
  postType: "hr_picks" | "risk_report" | "pro_preview";
  platform: "x";
  status: "draft" | "queued" | "mock_posted";
  date: string;
  scheduledFor: string;
  content: string;
  picks: Candidate[];
  createdAt: string;
  updatedAt: string;
};

const drafts = new Map<string, Draft>();

const judges = [
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
] as const;

function isAuthorized(req: VercelRequest): boolean {
  const expected = process.env.AI_JUDGE_ADMIN_KEY;

  // If no key is configured, keep local/dev prototype usable.
  // Production should always set AI_JUDGE_ADMIN_KEY in Vercel.
  if (!expected) {
    return process.env.NODE_ENV !== "production";
  }

  const headerKey = req.headers["x-ai-judge-admin-key"];
  const provided = Array.isArray(headerKey) ? headerKey[0] : headerKey;

  return typeof provided === "string" && provided === expected;
}

function getPath(req: VercelRequest): string[] {
  const raw = req.query.path;
  if (Array.isArray(raw) && raw.length > 0) return raw.map(String);
  if (typeof raw === "string" && raw.length > 0) return [raw];

  const url = req.url || "";
  const clean = url.split("?")[0] || "";
  const prefix = "/api/ai-judge-social/";
  const index = clean.indexOf(prefix);

  if (index >= 0) {
    return clean
      .slice(index + prefix.length)
      .split("/")
      .filter(Boolean)
      .map(decodeURIComponent);
  }

  return [];
}

function safeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function score(c: Candidate): number {
  const n = Number(c.hrScore);
  return Number.isFinite(n) ? n : 0;
}

function playerName(c: Candidate): string {
  return c.playerName || c.name || "Unknown player";
}

function opponent(c: Candidate): string {
  return c.opponent || c.opponentTeam || "TBD";
}

function probability(c: Candidate): string {
  const n = Number(c.estimatedHrProbability);
  if (!Number.isFinite(n)) return "—";
  return n <= 1 ? `${(n * 100).toFixed(1)}%` : `${n.toFixed(1)}%`;
}

async function loadHrCandidates(req: VercelRequest): Promise<Candidate[]> {
  try {
    const proto = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers.host;
    const url = `${proto}://${host}/api/mlb/hr-board/today`;

    const response = await fetch(url, {
      headers: { accept: "application/json" },
    });

    if (!response.ok) return [];

    const board = await response.json();
    const payload = board?.payload ?? board ?? {};

    return [
      ...safeArray<Candidate>(payload.candidates),
      ...safeArray<Candidate>(payload.projectedCandidates),
    ];
  } catch {
    return [];
  }
}

function selectPicks(judgeId: JudgeId, candidates: Candidate[]): Candidate[] {
  const rows = [...candidates];

  if (judgeId === "risk_auditor") {
    return rows
      .filter((c) => safeArray(c.warnings).length > 0 || score(c) < 55)
      .sort((a, b) => safeArray(b.warnings).length - safeArray(a.warnings).length)
      .slice(0, 3);
  }

  if (judgeId === "pro_edge_agent") {
    return rows.sort((a, b) => score(b) - score(a)).slice(0, 3);
  }

  return rows.sort((a, b) => score(b) - score(a)).slice(0, judgeId === "power_hunter" ? 4 : 3);
}

function composeDraft(judge: (typeof judges)[number], picks: Candidate[], date: string): string {
  if (picks.length === 0) {
    return [
      `VouchEdge ${judge.name} HR Draft`,
      ``,
      `No HR board candidates were available to this live Vercel function yet.`,
      `Safe prototype only. Nothing posted to X/Twitter.`,
      ``,
      `Generated for ${date}.`,
    ].join("\n");
  }

  if (judge.id === "risk_auditor") {
    const lines = picks.map((p, i) => {
      const warning = safeArray<string>(p.warnings)[0] ?? "Risk needs review.";
      return `${i + 1}. ${playerName(p)} — ${p.team ?? "TBD"} vs ${opponent(p)}\nRisk note: ${warning}`;
    });

    return [
      `⚠️ VouchEdge ${judge.name} — HR Risk Check`,
      ``,
      ...lines,
      ``,
      `Research only. Not betting advice.`,
      `Generated for ${date}.`,
    ].join("\n");
  }

  if (judge.id === "pro_edge_agent") {
    return [
      `🔒 VouchEdge ${judge.name} — Pro HR Preview`,
      ``,
      `The Pro model found ${picks.length} HR paths today.`,
      `Top visible teaser: ${playerName(picks[0])} — HR Edge ${score(picks[0])}/100`,
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const path = getPath(req);

  try {
    if (!isAuthorized(req)) {
      return res.status(403).json({
        status: "error",
        message: "Admin/developer access required for AI Judge Social API.",
        source: "vercel-serverless-lightweight",
      });
    }

    if (req.method === "GET" && path[0] === "judges") {
      return res.status(200).json({
        status: "ready",
        mode: "safe_prototype",
        source: "vercel-serverless-lightweight",
        judges,
      });
    }

    if (req.method === "POST" && path[0] === "generate-hr-drafts") {
      const body = req.body ?? {};
      const date = body.date || new Date().toISOString().slice(0, 10);
      const scheduledFor = body.scheduledFor || `${date} 10:30 America/Halifax`;
      const candidates = await loadHrCandidates(req);

      const created = judges.map((judge) => {
        const picks = selectPicks(judge.id, candidates);
        const now = new Date().toISOString();

        const draft: Draft = {
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
        return draft;
      });

      return res.status(200).json({
        status: "ready",
        mode: "safe_prototype_no_real_x_posting",
        source: "vercel-serverless-lightweight",
        candidateCount: candidates.length,
        date,
        scheduledFor,
        drafts: created,
      });
    }

    if (req.method === "GET" && path[0] === "drafts" && path.length === 1) {
      return res.status(200).json({
        status: "ready",
        mode: "safe_prototype",
        source: "vercel-serverless-lightweight",
        warning: "Serverless memory can reset. Use database storage before real posting.",
        drafts: [...drafts.values()],
      });
    }

    if (req.method === "POST" && path[0] === "drafts" && path[2] === "queue") {
      const draft = drafts.get(path[1]);
      if (!draft) return res.status(404).json({ status: "error", message: "Draft not found" });

      const updated = { ...draft, status: "queued" as const, updatedAt: new Date().toISOString() };
      drafts.set(path[1], updated);

      return res.status(200).json({
        status: "queued",
        source: "vercel-serverless-lightweight",
        draft: updated,
      });
    }

    if (req.method === "POST" && path[0] === "drafts" && path[2] === "mock-post") {
      const draft = drafts.get(path[1]);
      if (!draft) return res.status(404).json({ status: "error", message: "Draft not found" });

      const updated = { ...draft, status: "mock_posted" as const, updatedAt: new Date().toISOString() };
      drafts.set(path[1], updated);

      return res.status(200).json({
        status: "mock_posted",
        source: "vercel-serverless-lightweight",
        message: "Safe prototype only. Nothing was posted to X/Twitter.",
        draft: updated,
      });
    }

    return res.status(404).json({
      status: "error",
      message: "AI judge social route not found",
      path,
    });
  } catch (err: any) {
    return res.status(500).json({
      status: "error",
      source: "vercel-serverless-lightweight",
      message: err?.message ?? "AI judge social API failed",
      path,
    });
  }
}
