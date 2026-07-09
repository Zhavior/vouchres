import { supabaseAdmin } from "../../middleware/auth";
import { createPick } from "../persistence/pickService";
import { judgePickMeta } from "./judgeScoring";
import { buildAiJudgeLeaderboard } from "./aiJudgeLeaderboardService";
import type { JudgeId } from "./judgeScoring";

const AI_JUDGE_CAPPERS: Array<{
  judgeId: JudgeId;
  displayName: string;
  tagline: string;
  persona: string;
}> = [
  {
    judgeId: "data_scout",
    displayName: "Data Scout",
    tagline: "Clean math. Low hype. Safer profiles.",
    persona: "AI Judge that prioritizes cleaner data, safer HR profiles, and fewer red flags.",
  },
  {
    judgeId: "power_hunter",
    displayName: "Power Hunter",
    tagline: "Home-run upside hunter.",
    persona: "AI Judge that chases hitter power, pitcher vulnerability, and HR ceiling.",
  },
  {
    judgeId: "momentum_reader",
    displayName: "Momentum Reader",
    tagline: "Recent form and rhythm reader.",
    persona: "AI Judge that reads recent form, lineup rhythm, and momentum signals.",
  },
  {
    judgeId: "risk_auditor",
    displayName: "Risk Auditor",
    tagline: "Finds traps before they cost you.",
    persona: "AI Judge that flags thin data, risky profiles, and low-confidence traps.",
  },
  {
    judgeId: "pro_edge_agent",
    displayName: "Pro Edge Agent",
    tagline: "Premium blended model.",
    persona: "AI Judge that blends power, matchup, form, confidence, and risk into one premium read.",
  },
];

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

async function ensureAiJudgeCapper(judge: (typeof AI_JUDGE_CAPPERS)[number]) {
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

  for (const judgeConfig of AI_JUDGE_CAPPERS) {
    const judge = board.leaderboard.find((j: any) => j.id === judgeConfig.judgeId);
    if (!judge) continue;

    const capper = await ensureAiJudgeCapper(judgeConfig);
    const topPick = judge.topPick ?? (Array.isArray(judge.topPicks) ? judge.topPicks[0] : null);
    const meta = judgePickMeta(judgeConfig.judgeId);
    const source = `ai_judge:${judgeConfig.judgeId}`;

    const result: SaveResult = {
      judgeId: judgeConfig.judgeId,
      judgeName: judgeConfig.displayName,
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
    const isAvoid = topPick.isAvoidPick === true || judgeConfig.judgeId === "risk_auditor";
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
        `${judgeConfig.displayName} AI Judge daily single. ` +
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
