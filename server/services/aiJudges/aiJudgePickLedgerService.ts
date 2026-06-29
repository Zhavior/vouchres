import { supabaseAdmin } from "../../middleware/auth";
import { createPick } from "../persistence/pickService";
import { buildAiJudgeLeaderboard } from "./aiJudgeLeaderboardService";

const AI_JUDGE_CAPPERS = [
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
  eventDate: string;
  selection: string;
}) {
  const { data, error } = await supabaseAdmin
    .from("picks")
    .select("id")
    .eq("capper_id", opts.capperId)
    .eq("event_date", opts.eventDate)
    .eq("selection", opts.selection)
    .limit(1);

  if (error) throw error;
  return Array.isArray(data) && data.length > 0;
}

export async function saveCurrentAiJudgePicksToLedger() {
  const board = await buildAiJudgeLeaderboard();
  const eventDate = board.date ?? new Date().toISOString().slice(0, 10);
  const results: SaveResult[] = [];

  for (const judgeConfig of AI_JUDGE_CAPPERS) {
    const judge = board.leaderboard.find((j: any) => j.id === judgeConfig.judgeId);
    if (!judge) continue;

    const capper = await ensureAiJudgeCapper(judgeConfig);
    const topPicks = Array.isArray(judge.topPicks) ? judge.topPicks : [];

    const result: SaveResult = {
      judgeId: judgeConfig.judgeId,
      judgeName: judgeConfig.displayName,
      capperId: capper?.id ?? null,
      created: 0,
      skipped: 0,
      picks: [],
    };

    const eligiblePicks = topPicks
      .filter((pick: any) => pick.parlayEligible)
      .slice(0, 5);

    for (const pick of eligiblePicks) {
      const playerName = pick.playerName ?? "Unknown player";
      const selection = `${playerName} HR`;

      const exists = await pickAlreadyExists({
        capperId: capper.id,
        eventDate,
        selection,
      });

      if (exists) {
        result.skipped += 1;
        result.picks.push({
          playerName,
          selection,
          status: "skipped",
          reason: "Already saved for this judge/date/player.",
        });
        continue;
      }

      await createPick({
        user_id: null,
        capper_id: capper.id,
        leg_type: "single",
        sport: "MLB",
        league: "MLB",
        market: "Home Run",
        selection,
        event_name: `${pick.team ?? "TBD"} vs ${pick.opponent ?? "TBD"}`,
        event_date: eventDate,
        odds: null,
        stake_units: 1,
        potential_units: null,
        model_edge: pick.agentScore ?? pick.hrScore ?? null,
        confidence: pick.confidenceTier ?? null,
        rationale:
          `${judgeConfig.displayName} AI Judge pick. ` +
          `Agent Score: ${pick.agentScore ?? "N/A"}. ` +
          `HR Edge: ${pick.hrScore ?? "N/A"}. ` +
          `Availability: ${pick.availability?.label ?? "Unknown"}.`,
        source: "ai_judge_leaderboard",
        is_demo: true,
      } as any);

      result.created += 1;
      result.picks.push({
        playerName,
        selection,
        status: "created",
      });
    }

    results.push(result);
  }

  return {
    status: "ready",
    date: eventDate,
    message: "AI Judge picks saved into existing picks ledger.",
    results,
  };
}
