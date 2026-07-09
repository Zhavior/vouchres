import { getSupabaseAdmin } from "../../middleware/auth";
import { getCachedValidatedHrBoard } from "../hubs/hrBoardHub";
import {
  computeJudgeWinRate,
  safeArray,
  selectTopPicksForJudge,
  singlePickLimit,
  type JudgeCandidate,
  type JudgeId,
} from "./judgeScoring";

export const AI_JUDGES: Array<{
  id: JudgeId;
  displayName: string;
  handle: string;
  tagline: string;
  persona: string;
  specialty: string;
  color: string;
}> = [
  {
    id: "data_scout",
    displayName: "Data Scout",
    handle: "ai-data-scout",
    tagline: "Clean math. Low hype. Safer profiles.",
    persona: "Finds cleaner HR profiles with better data quality and fewer red flags.",
    specialty: "Math-first slate screening",
    color: "cyan",
  },
  {
    id: "power_hunter",
    displayName: "Power Hunter",
    handle: "ai-power-hunter",
    tagline: "Home-run upside hunter.",
    persona: "Chases raw HR upside using hitter power, pitcher vulnerability, and park context.",
    specialty: "HR threat radar",
    color: "orange",
  },
  {
    id: "momentum_reader",
    displayName: "Momentum Reader",
    handle: "ai-momentum-reader",
    tagline: "Recent form and rhythm reader.",
    persona: "Reads recent form, lineup volume, and short-term momentum signals.",
    specialty: "Game rhythm & form",
    color: "purple",
  },
  {
    id: "risk_auditor",
    displayName: "Risk Auditor",
    handle: "ai-risk-auditor",
    tagline: "Finds traps before they cost you.",
    persona: "Flags thin data, risky profiles, projection problems, and low-confidence picks.",
    specialty: "Skeptical filter",
    color: "red",
  },
  {
    id: "pro_edge_agent",
    displayName: "Pro Edge Agent",
    handle: "ai-pro-edge",
    tagline: "Premium blended model.",
    persona: "Blends power, matchup, form, confidence, and risk into one premium read.",
    specialty: "Premium blended edge",
    color: "emerald",
  },
];

async function getCapperStatsByNames(names: string[]) {
  const empty = {
    capperMap: new Map<string, { id: string; display_name: string }>(),
    scoreMap: new Map<string, {
      won_picks: number;
      lost_picks: number;
      pushed_picks: number;
      score: number;
      net_units: number;
    }>(),
    pendingMap: new Map<string, number>(),
  };

  try {
    const supabaseAdmin = await getSupabaseAdmin();
    const { data: cappers, error: capperError } = await supabaseAdmin
      .from("cappers")
      .select("id, display_name")
      .in("display_name", names);

    if (capperError || !cappers?.length) return empty;

    const capperMap = new Map(cappers.map((c) => [c.display_name, c]));
    const capperIds = cappers.map((c) => c.id);

    const { data: scores, error: scoreError } = await supabaseAdmin
      .from("trust_scores")
      .select("subject_id, scope, won_picks, lost_picks, pushed_picks, score, net_units")
      .eq("subject_type", "capper")
      .in("subject_id", capperIds)
      .in("scope", ["MLB", "overall"]);

    if (scoreError) return { ...empty, capperMap };

    const scoreMap = new Map<string, (typeof scores)[number]>();
    for (const row of scores ?? []) {
      const existing = scoreMap.get(row.subject_id);
      if (!existing || existing.scope !== "MLB") {
        scoreMap.set(row.subject_id, row);
      }
    }

    const { data: pendingRows, error: pendingError } = await supabaseAdmin
      .from("picks")
      .select("capper_id")
      .in("capper_id", capperIds)
      .eq("status", "pending")
      .eq("leg_type", "single");

    const pendingMap = new Map<string, number>();
    if (!pendingError && pendingRows) {
      for (const row of pendingRows) {
        const id = String(row.capper_id);
        pendingMap.set(id, (pendingMap.get(id) ?? 0) + 1);
      }
    }

    return { capperMap, scoreMap, pendingMap };
  } catch {
    return empty;
  }
}

function trustFirstCandidates(payload: Record<string, unknown>): JudgeCandidate[] {
  const confirmed = safeArray<JudgeCandidate>(payload.candidates);
  if (confirmed.length > 0) return confirmed;
  return safeArray<JudgeCandidate>(payload.projectedCandidates);
}

export async function buildAiJudgeLeaderboard() {
  const board = (await getCachedValidatedHrBoard()) as any;
  const payload = board?.payload ?? board ?? {};
  const candidates = trustFirstCandidates(payload);

  const { capperMap, scoreMap, pendingMap } = await getCapperStatsByNames(
    AI_JUDGES.map((j) => j.displayName),
  );

  const judges = AI_JUDGES.map((judge) => {
    const capper = capperMap.get(judge.displayName);
    const stats = capper ? scoreMap.get(capper.id) : null;

    const won = Number(stats?.won_picks ?? 0);
    const lost = Number(stats?.lost_picks ?? 0);
    const pushed = Number(stats?.pushed_picks ?? 0);
    const graded = won + lost + pushed;
    const winRate = computeJudgeWinRate({ won, lost, pushed });
    const pending = capper ? Number(pendingMap.get(capper.id) ?? 0) : 0;

    const topPicks = selectTopPicksForJudge(judge.id, candidates);

    return {
      ...judge,
      capperId: capper?.id ?? null,
      trustScore: stats?.score != null ? Number(stats.score) : 50,
      winRate,
      singlePickLimit: singlePickLimit(judge.id),
      record: {
        won,
        lost,
        pushed,
        graded,
        pending,
        netUnits: Number(stats?.net_units ?? 0),
      },
      topPick: topPicks[0] ?? null,
      topPicks,
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
