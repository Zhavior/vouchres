import { supabaseAdmin } from "../../middleware/auth";
import { createPick } from "../persistence/pickService";
import { listAgents } from "./agentRegistry";
import { judgePickMeta } from "./judgeScoring";
import { buildAiJudgeLeaderboard } from "./aiJudgeLeaderboardService";

type SaveResult = {
  judgeId: string;
  judgeName: string;
  capperId: string | null;
  created: number;
  skipped: number;
  picks: Array<{
    playerName: string;
    selection: string;
    status: "created" | "skipped";
    reason?: string;
  }>;
};

async function ensureAiJudgeCapper(judge: {
  displayName: string;
  tagline: string;
  persona: string;
}) {
  const { data: existing, error: lookupError } = await supabaseAdmin
    .from("cappers")
    .select("id, display_name")
    .eq("display_name", judge.displayName)
    .maybeSingle();

  if (lookupError) throw lookupError;
  if (existing?.id) return existing;

  const { data, error } = await supabaseAdmin
    .from("cappers")
    .insert({
      display_name: judge.displayName,
      tagline: judge.tagline,
      persona: judge.persona,
      is_demo: true,
      is_active: true,
    })
    .select("id, display_name")
    .single();

  if (error) throw error;

  await supabaseAdmin.from("trust_scores").upsert({
    subject_type: "capper",
    subject_id: data.id,
    scope: "MLB",
    score: 50,
    total_picks: 0,
    won_picks: 0,
    lost_picks: 0,
    pushed_picks: 0,
    net_units: 0,
  });

  return data;
}

async function pickAlreadyExists(opts: {
  capperId: string;
  gameDate: string;
  selection: string;
  source: string;
}) {
  let query = supabaseAdmin
    .from("picks")
    .select("id")
    .eq("capper_id", opts.capperId)
    .eq("selection", opts.selection)
    .eq("source", opts.source)
    .eq("leg_type", "single")
    .limit(1);

  query = query.eq("game_date", opts.gameDate);

  const { data, error } = await query;
  if (error && ["42703", "PGRST204"].includes(error.code)) {
    const fallback = await supabaseAdmin
      .from("picks")
      .select("id")
      .eq("capper_id", opts.capperId)
      .eq("selection", opts.selection)
      .eq("source", opts.source)
      .eq("leg_type", "single")
      .limit(1);
    if (fallback.error) throw fallback.error;
    return Array.isArray(fallback.data) && fallback.data.length > 0;
  }

  if (error) throw error;
  return Array.isArray(data) && data.length > 0;
}

export async function saveCurrentAiJudgePicksToLedger() {
  const board = await buildAiJudgeLeaderboard();
  const gameDate = board.date ?? new Date().toISOString().slice(0, 10);
  const results: SaveResult[] = [];

  for (const agent of listAgents()) {
    const judge = board.leaderboard.find((j: any) => j.id === agent.id);
    if (!judge) continue;

    const capper = await ensureAiJudgeCapper({
      displayName: agent.displayName,
      tagline: agent.tagline,
      persona: agent.persona,
    });
    const topPick = judge.topPick ?? (Array.isArray(judge.topPicks) ? judge.topPicks[0] : null);
    const meta = judgePickMeta(agent.id as any);
    const source = `ai_judge:${agent.id}`;
    const isAvoidAgent = agent.gradeStrategy?.isAvoidPick === true;

    const result: SaveResult = {
      judgeId: agent.id,
      judgeName: agent.displayName,
      capperId: capper?.id ?? null,
      created: 0,
      skipped: 0,
      picks: [],
    };

    if (!topPick) {
      result.skipped = 1;
      result.picks.push({
        playerName: "No pick",
        selection: "Unavailable",
        status: "skipped",
        reason: "No specialty single available for this judge today.",
      });
      results.push(result);
      continue;
    }

    if (!topPick.gradeable) {
      result.skipped = 1;
      result.picks.push({
        playerName: topPick.playerName ?? "Unknown player",
        selection: topPick.singlePickLabel ?? topPick.market ?? "Preview",
        status: "skipped",
        reason: "Today's single is not gradeable yet (lineup/availability gate).",
      });
      results.push(result);
      continue;
    }

    const playerName = topPick.playerName ?? "Unknown player";
    const isAvoid = topPick.isAvoidPick === true || isAvoidAgent;
    const selection = isAvoid
      ? `Avoid ${playerName} HR`
      : `${playerName} HR (${topPick.singlePickLabel ?? meta.singlePickLabel})`;

    const exists = await pickAlreadyExists({
      capperId: capper.id,
      gameDate,
      selection,
      source,
    });

    if (exists) {
      result.skipped += 1;
      result.picks.push({
        playerName,
        selection,
        status: "skipped",
        reason: "Already saved for this judge/date/player.",
      });
      results.push(result);
      continue;
    }

    await createPick({
      user_id: null,
      capper_id: capper.id,
      leg_type: "single",
      sport: "MLB",
      market: isAvoid ? "hr_avoid" : "hr",
      selection,
      game_date: gameDate,
      odds_decimal: null,
      stake_units: 1,
      confidence: null,
      judge_verdict: isAvoid ? "avoid" : "back",
      explanation:
        `${agent.displayName} AI Judge daily single. ` +
        `Type: ${topPick.singlePickLabel ?? meta.singlePickLabel}. ` +
        `Agent Score: ${topPick.agentScore ?? "N/A"}. ` +
        `HR Edge: ${topPick.hrScore ?? "N/A"}. ` +
        `Availability: ${topPick.availability?.label ?? "Unknown"}.`,
      source,
      is_demo: true,
    } as any);

    result.created += 1;
    result.picks.push({
      playerName,
      selection,
      status: "created",
    });

    results.push(result);
  }

  return {
    status: "ready",
    date: gameDate,
    message: "AI Judge single picks saved into picks ledger for per-judge grading.",
    results,
  };
}
