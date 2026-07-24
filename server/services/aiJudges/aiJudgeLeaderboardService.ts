import { getSupabaseAdmin } from "../../middleware/auth";
import { getCachedValidatedHrBoard } from "../hubs/hrBoardHub";
import { listAgents } from "./agentRegistry";
import {
  computeJudgeRecord,
  safeArray,
  type JudgeCandidate,
} from "./judgeScoring";

export { AI_JUDGES } from "./agentRegistry";

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("AI judge board lookup timed out.")), timeoutMs);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

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
    const supabaseAdmin = await withTimeout(getSupabaseAdmin(), 1_500);
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
  // The public leaderboard must remain responsive when the upstream HR-board
  // cache is unavailable. An empty board still renders all four judges.
  const board = await withTimeout(getCachedValidatedHrBoard(), 1_500).catch(() => null) as any;
  const payload = board?.payload ?? board ?? {};
  const candidates = trustFirstCandidates(payload);

  const agents = listAgents();
  const { capperMap, scoreMap, pendingMap } = await getCapperStatsByNames(
    agents.map((j) => j.displayName),
  );

  const judges = agents.map((agent) => {
    const capper = capperMap.get(agent.displayName);
    const stats = capper ? scoreMap.get(capper.id) : null;

    const won = Number(stats?.won_picks ?? 0);
    const lost = Number(stats?.lost_picks ?? 0);
    const pushed = Number(stats?.pushed_picks ?? 0);
    const pending = capper ? Number(pendingMap.get(capper.id) ?? 0) : 0;
    const record = computeJudgeRecord({
      won,
      lost,
      pushed,
      pending,
      netUnits: stats?.net_units,
    });

    const topPicks = agent.buildPicks(candidates);

    return {
      id: agent.id,
      displayName: agent.displayName,
      handle: agent.handle,
      tagline: agent.tagline,
      persona: agent.persona,
      specialty: agent.specialty,
      color: agent.color,
      capperId: capper?.id ?? null,
      trustScore: stats?.score != null ? Number(stats.score) : 50,
      winRate: record.winRate,
      singlePickLimit: agent.singlePickLimit,
      record: {
        won: record.won,
        lost: record.lost,
        pushed: record.pushed,
        graded: record.graded,
        pending: record.pending,
        netUnits: record.netUnits,
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
