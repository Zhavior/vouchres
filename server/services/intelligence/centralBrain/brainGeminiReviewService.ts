import { createHash } from "node:crypto";
import { z } from "zod";
import { getSupabaseAdmin } from "../../../middleware/auth";
import { generateStructured } from "../../ai/geminiClient";

const PickReviewSchema = z.object({
  subjectId: z.string().min(1),
  verdict: z.enum(["support", "support_with_caution", "insufficient_evidence", "contradiction_detected"]),
  summary: z.string().min(1).max(500),
  supportingSignals: z.array(z.string().max(140)).max(4),
  riskSignals: z.array(z.string().max(140)).max(4),
  missingEvidence: z.array(z.string().max(100)).max(4),
  tags: z.array(z.string().max(40)).max(4),
  withdrawalCondition: z.string().min(1).max(250),
});
const MarketReviewSchema = z.object({ reviews: z.array(PickReviewSchema).max(3) });

export async function generateBrainGeminiReviews(date: string): Promise<number> {
  const supabase = await getSupabaseAdmin();
  const { data, error } = await supabase.from("brain_decisions")
    .select("decision_key,market,player_id,player_name,team,opponent,score,confidence,reasons,risks,feature_snapshot")
    .eq("decision_date", date).eq("sport", "mlb").in("market", ["home_run", "stolen_base", "pitcher_strikeouts"])
    .lte("rank", 3).order("market").order("rank");
  if (error) throw error;

  let written = 0;
  for (const market of ["home_run", "stolen_base", "pitcher_strikeouts"] as const) {
    const decisions = (data ?? []).filter((row) => row.market === market);
    if (!decisions.length) continue;
    const reviewKey = createHash("sha256").update(decisions.map((row) => row.decision_key).join("|")).digest("hex");
    const { data: existing } = await supabase.from("brain_ai_reviews").select("review_key").eq("review_key", reviewKey).maybeSingle();
    if (existing) continue;

    const allowedIds = new Set(decisions.map((row) => String(row.player_id)));
    const fallback = { reviews: decisions.map((row) => ({
      subjectId: String(row.player_id), verdict: "support_with_caution" as const,
      summary: `${row.player_name} survived the deterministic ${market.replace("_", " ")} policy. AI review is unavailable; use the recorded evidence and risks.`,
      supportingSignals: (row.reasons as string[]).slice(0, 4), riskSignals: (row.risks as string[]).slice(0, 4),
      missingEvidence: [], tags: ["Deterministic review"], withdrawalCondition: "Withdraw if identity, lineup, opponent, or event status changes.",
    })) };
    const result = await generateStructured({
      cacheKey: `brain-review:${reviewKey}`,
      schema: MarketReviewSchema,
      fallback,
      prompt: JSON.stringify({ market, decisions }),
      systemInstruction: "You are ProjectVABrAIns' explanation-only skeptic. Use only supplied evidence. Do not change scores, rank, probabilities, identities, or outcomes. Never invent facts. Return one review per supplied subjectId.",
    });
    const semanticallyValid = result.data.reviews.length === decisions.length && result.data.reviews.every((review) => allowedIds.has(review.subjectId));
    const payload = semanticallyValid ? result.data : fallback;
    const stored = await supabase.from("brain_ai_reviews").insert({
      review_key: reviewKey, decision_date: date, sport: "mlb", market, model: result.model,
      status: result.status === "no-key" ? "no_key" : result.status === "live" || result.status === "cached" ? "live" : "fallback",
      payload,
    });
    if (stored.error) throw stored.error;
    written += 1;
  }
  return written;
}

export async function getBrainGeminiReviews(date: string) {
  const supabase = await getSupabaseAdmin();
  const { data, error } = await supabase.from("brain_ai_reviews")
    .select("market,model,status,payload,created_at")
    .eq("decision_date", date).eq("sport", "mlb").order("created_at", { ascending: false });
  if (error) throw error;

  const byMarket = new Map<string, { market: string; model: string; status: string; reviews: z.infer<typeof PickReviewSchema>[]; createdAt: string }>();
  for (const row of data ?? []) {
    if (byMarket.has(row.market)) continue;
    const parsed = MarketReviewSchema.safeParse(row.payload);
    if (!parsed.success) continue;
    byMarket.set(row.market, {
      market: row.market,
      model: row.model,
      status: row.status,
      reviews: parsed.data.reviews,
      createdAt: row.created_at,
    });
  }
  return Object.fromEntries(byMarket);
}
