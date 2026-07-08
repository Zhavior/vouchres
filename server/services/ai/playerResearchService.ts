import { GoogleGenAI } from "@google/genai";
import type { PlayerResearchInput } from "../../validators/aiSchemas";

type PlayerResearchData = PlayerResearchInput["playerData"];

export interface PlayerResearchResponse {
  status: "simulated" | "success" | "fallback";
  aiScore: number;
  riskLevel?: "LOW" | "MEDIUM" | "HIGH";
  confidenceBand?: "Strong" | "Moderate" | "Speculative";
  report: string;
  groundingMetadata?: unknown;
}

function cleanModelJson(value: string): string {
  let text = value.trim();
  if (text.startsWith("```json")) text = text.slice(7);
  if (text.endsWith("```")) text = text.slice(0, -3);
  return text.trim();
}

function statNumber(value: unknown, fallback = 0): number {
  const text = typeof value === "string" && value.startsWith(".") ? `0${value}` : value;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function boundedScore(value: unknown, fallback = 50): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(10, Math.min(99, Math.round(numeric)));
}

function localPlayerResearch(player: PlayerResearchData): PlayerResearchResponse {
  const seasonAvg = statNumber(player.seasonStats.avg, 0.25);
  const seasonOps = statNumber(player.seasonStats.ops, 0.72);
  const last10Ops = statNumber(player.splits.last10.ops, seasonOps);
  const hardHitPercent = statNumber(player.advanced.hardHitPercent, 35);
  const chasePercent = statNumber(player.advanced.chasePercent, 25);
  const woba = statNumber(player.advanced.woba, 0);
  const xwoba = statNumber(player.advanced.xwoba, 0);

  const baseScore = Math.round(seasonAvg * 180 + seasonOps * 60 + hardHitPercent * 0.35);
  const trendBonus = last10Ops > seasonOps ? 6 : -3;
  const injuryPenalty = player.injurySeverity === "NONE" ? 0 : player.injurySeverity === "DAY_TO_DAY" ? -14 : -38;
  const finalScore = boundedScore(baseScore + trendBonus - Math.max(0, chasePercent - 30) * 0.25 + injuryPenalty, 50);
  const riskLevel = finalScore >= 78 ? "LOW" : finalScore >= 62 ? "MEDIUM" : "HIGH";
  const confidenceBand = finalScore >= 78 ? "Strong" : finalScore >= 62 ? "Moderate" : "Speculative";
  const healthy = player.injurySeverity === "NONE";
  const trendingUp = last10Ops > seasonOps;

  const downsideFactors: string[] = [];
  if (!healthy) downsideFactors.push(`Health flag: **${player.injuryStatus}** - reduced workload or late scratch is possible.`);
  if (!trendingUp) downsideFactors.push(`Recent form is cooling: last-10 OPS (${player.splits.last10.ops}) sits below the season line (${player.seasonStats.ops}).`);
  if (chasePercent > 30) downsideFactors.push(`Elevated chase rate (${chasePercent}%) can be exploited by sharp sequencing.`);
  if (xwoba && woba && woba > xwoba) downsideFactors.push(`wOBA (${woba}) is running ahead of xwOBA (${xwoba}); recent output may include variance.`);
  if (downsideFactors.length === 0) downsideFactors.push("No major local statistical red flags in the supplied inputs; baseball variance still applies.");

  const report = `### AI Matchup Research - ${player.name}
> Local research mode. Probability-based analysis for research and entertainment only. Not betting advice.

**Matchup Advantage Score:** \`${finalScore}/99\` · **Confidence:** ${confidenceBand} · **Risk Level:** ${riskLevel}

#### What the data says
- **Rolling form:** ${player.splits.last10.ops} OPS over the last 10 vs a ${player.seasonStats.ops} season baseline (${trendingUp ? "trending up" : "trending down"}).
- **Contact quality:** ${player.advanced.exitVelocity} mph average exit velocity, ${player.advanced.hardHitPercent}% hard-hit rate.
- **Plate discipline:** ${player.advanced.chasePercent}% chase rate.
- **Expected vs actual:** wOBA ${woba || "n/a"} / xwOBA ${xwoba || "n/a"}.

#### Availability
Status: **${player.injuryStatus}** · estimated workload **${healthy ? "100%" : "~75%"}**.

#### What could go wrong
${downsideFactors.map((factor) => `- ${factor}`).join("\n")}`;

  return {
    status: "simulated",
    aiScore: finalScore,
    riskLevel,
    confidenceBand,
    report,
  };
}

export async function generatePlayerResearch(input: PlayerResearchInput): Promise<PlayerResearchResponse> {
  const player = input.playerData;
  const local = localPlayerResearch(player);
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) return local;

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "vouchedge-backend",
        },
      },
    });

    const prompt = `Conduct a cautious MLB sabermetric research brief for ${player.name} (#${player.number ?? "N/A"}, ${player.team}, ${player.position}).
Season BA: ${player.seasonStats.avg}; HR: ${player.seasonStats.hr}; OPS: ${player.seasonStats.ops}.
Splits: vs RHP ${player.splits.vRHP.ops} OPS; vs LHP ${player.splits.vLHP.ops} OPS; Home ${player.splits.home.ops} OPS; Last 10 ${player.splits.last10.ops} OPS.
Statcast-style inputs: hard-hit ${player.advanced.hardHitPercent}%, exit velocity ${player.advanced.exitVelocity}, chase ${player.advanced.chasePercent}%, wOBA ${player.advanced.woba ?? "n/a"}, xwOBA ${player.advanced.xwoba ?? "n/a"}.
Health: ${player.injuryStatus} (${player.injurySeverity}).

Return strict JSON: {"aiScore": <integer 10 to 99>, "report": "<markdown research brief; no certainty language; not betting advice>"}.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }],
      },
    });

    const parsed = JSON.parse(cleanModelJson(response.text || "{}"));
    return {
      status: "success",
      aiScore: boundedScore(parsed.aiScore, local.aiScore),
      riskLevel: local.riskLevel,
      confidenceBand: local.confidenceBand,
      report: typeof parsed.report === "string" && parsed.report.trim() ? parsed.report : local.report,
      groundingMetadata: response.candidates?.[0]?.groundingMetadata,
    };
  } catch (error) {
    console.error("[ai:player-research] Gemini research failed", error);
    return {
      ...local,
      status: "fallback",
    };
  }
}
