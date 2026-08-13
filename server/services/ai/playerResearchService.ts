import { generateStructured } from "./aiRouter";
import {
  PlayerResearchResponseSchema,
  type PlayerResearchInput,
} from "../../validators/aiSchemas";

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

function optionalMetric(value: unknown): number | null {
  if (value == null || value === "" || value === "—") return null;
  const text = typeof value === "string" && value.startsWith(".") ? `0${value}` : value;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

function boundedScore(value: unknown, fallback = 50): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(10, Math.min(99, Math.round(numeric)));
}

function metricOrUnknown(value: unknown, suffix = ""): string {
  if (value == null || value === "" || value === "—") return "UNKNOWN";
  const numeric = Number(typeof value === "string" && value.startsWith(".") ? `0${value}` : value);
  if (!Number.isFinite(numeric)) return "UNKNOWN";
  return `${value}${suffix}`;
}

function localPlayerResearch(player: PlayerResearchData): PlayerResearchResponse {
  const seasonAvg = optionalMetric(player.seasonStats.avg);
  const seasonOps = optionalMetric(player.seasonStats.ops);
  const last10Ops = optionalMetric(player.splits.last10?.ops);
  const hardHitPercent = optionalMetric(player.advanced?.hardHitPercent);
  const chasePercent = optionalMetric(player.advanced?.chasePercent);
  const exitVelocity = optionalMetric(player.advanced?.exitVelocity);
  const woba = optionalMetric(player.advanced?.woba);
  const xwoba = optionalMetric(player.advanced?.xwoba);

  const last10OpsLabel = player.splits.last10?.ops ?? "UNKNOWN";
  const last10Missing = last10Ops == null;
  const insufficient = seasonOps == null;
  const trendBonus = last10Missing || seasonOps == null ? 0 : last10Ops > seasonOps ? 6 : last10Ops < seasonOps ? -3 : 0;
  const injuryPenalty = player.injurySeverity === "NONE" ? 0 : player.injurySeverity === "DAY_TO_DAY" ? -14 : -38;
  const chasePenalty = chasePercent != null && chasePercent > 30 ? (chasePercent - 30) * 0.25 : 0;
  const baseScore = insufficient
    ? 50
    : Math.round((seasonAvg ?? 0) * 180 + seasonOps * 60 + (hardHitPercent ?? 0) * 0.35);
  const finalScore = insufficient ? 50 : boundedScore(baseScore + trendBonus - chasePenalty + injuryPenalty, 50);
  const riskLevel = finalScore >= 78 ? "LOW" : finalScore >= 62 ? "MEDIUM" : "HIGH";
  const confidenceBand = insufficient ? "Speculative" : finalScore >= 78 ? "Strong" : finalScore >= 62 ? "Moderate" : "Speculative";
  const healthy = player.injurySeverity === "NONE";
  const trendingUp = !last10Missing && seasonOps != null && last10Ops > seasonOps;

  const downsideFactors: string[] = [];
  if (insufficient) downsideFactors.push("Season OPS is UNKNOWN; this is an insufficient-data score, not a matchup edge.");
  if (!healthy) downsideFactors.push(`Health flag: **${player.injuryStatus}** - reduced workload or late scratch is possible.`);
  if (!last10Missing && last10OpsLabel !== "—" && last10OpsLabel !== "UNKNOWN" && !trendingUp) {
    downsideFactors.push(`Recent form is cooling: last-10 OPS (${last10OpsLabel}) sits below the season line (${player.seasonStats.ops}).`);
  }
  if (chasePercent != null && chasePercent > 30) downsideFactors.push(`Elevated chase rate (${chasePercent}%) can be exploited by sharp sequencing.`);
  if (xwoba != null && woba != null && woba > xwoba) downsideFactors.push(`wOBA (${woba}) is running ahead of xwOBA (${xwoba}); recent output may include variance.`);
  if (downsideFactors.length === 0) downsideFactors.push("No major local statistical red flags in the supplied inputs; baseball variance still applies.");

  const report = `### AI Matchup Research - ${player.name}
> Local research mode. Probability-based analysis for research and entertainment only. Not betting advice.

**Matchup Advantage Score:** \`${finalScore}/99\`${insufficient ? " (insufficient-data)" : ""} · **Confidence:** ${confidenceBand} · **Risk Level:** ${riskLevel}

#### What the data says
- **Rolling form:** ${metricOrUnknown(last10OpsLabel)} last-10 OPS vs a ${metricOrUnknown(player.seasonStats.ops)} season baseline (${last10Missing || last10OpsLabel === "—" || last10OpsLabel === "UNKNOWN" ? "form UNKNOWN" : trendingUp ? "trending up" : "trending down"}).
- **Contact quality:** ${metricOrUnknown(exitVelocity, " mph")} average exit velocity, ${metricOrUnknown(hardHitPercent, "%")} hard-hit rate.
- **Plate discipline:** ${metricOrUnknown(chasePercent, "%")} chase rate.
- **Expected vs actual:** wOBA ${metricOrUnknown(woba)} / xwOBA ${metricOrUnknown(xwoba)}.

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
  try {
    const prompt = `Conduct a cautious MLB sabermetric research brief for ${player.name} (#${player.number ?? "N/A"}, ${player.team}, ${player.position}).
Season BA: ${metricOrUnknown(player.seasonStats.avg)}; HR: ${metricOrUnknown(player.seasonStats.hr)}; OPS: ${metricOrUnknown(player.seasonStats.ops)}.
Splits: vs RHP ${metricOrUnknown(player.splits.vRHP.ops)} OPS; vs LHP ${metricOrUnknown(player.splits.vLHP.ops)} OPS; Home ${metricOrUnknown(player.splits.home.ops)} OPS; Last 10 ${metricOrUnknown(player.splits.last10.ops)} OPS.
Statcast-style inputs: hard-hit ${metricOrUnknown(player.advanced?.hardHitPercent, "%")}, exit velocity ${metricOrUnknown(player.advanced?.exitVelocity, " mph")}, chase ${metricOrUnknown(player.advanced?.chasePercent, "%")}, wOBA ${metricOrUnknown(player.advanced?.woba)}, xwOBA ${metricOrUnknown(player.advanced?.xwoba)}.
Health: ${player.injuryStatus} (${player.injurySeverity}).

Return strict JSON: {"aiScore": <integer 10 to 99>, "report": "<markdown research brief; no certainty language; not betting advice>"}.`;

    const result = await generateStructured({
      cacheKey: `player-research:${player.name}:${player.team}`,
      prompt,
      schema: PlayerResearchResponseSchema,
      fallback: {
        aiScore: local.aiScore,
        report: local.report,
      },
      
    });

    const parsed = result.data;
    return {
      status: result.status === "live" || result.status === "cached" ? "success" : "simulated",
      aiScore: boundedScore(parsed.aiScore, local.aiScore),
      riskLevel: local.riskLevel,
      confidenceBand: local.confidenceBand,
      report: typeof parsed.report === "string" && parsed.report.trim() ? parsed.report : local.report,
      groundingMetadata: undefined,
    };
  } catch (error) {
    console.error("[ai:player-research] AI research failed", error);
    return {
      ...local,
      status: "fallback",
    };
  }
}
