import { GoogleGenAI } from "@google/genai";
import { AppError } from "../../errors/AppError";
import type { ParlayEdgeInput } from "../../validators/aiSchemas";

export interface ParlayEdgeReport {
  status: "simulated" | "success" | "fallback";
  edgeScore: number;
  riskLevel: "MODERATE" | "ELEVATED" | "HIGH";
  report: string;
}

function cleanModelJson(value: string): string {
  let text = value.trim();
  if (text.startsWith("```json")) text = text.slice(7);
  if (text.endsWith("```")) text = text.slice(0, -3);
  return text.trim();
}

function boundedScore(value: unknown, fallback: number): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(40, Math.min(95, Math.round(numeric)));
}

function riskLevelForLegCount(legsCount: number): ParlayEdgeReport["riskLevel"] {
  if (legsCount <= 2) return "MODERATE";
  if (legsCount <= 4) return "ELEVATED";
  return "HIGH";
}

function localParlayEdge(input: ParlayEdgeInput): ParlayEdgeReport {
  const legs = input.legs;
  const legsCount = legs.length;
  const riskLevel = riskLevelForLegCount(legsCount);
  const calculatedEdgeScore = boundedScore(84 - legsCount * 5 + ((legs[0]?.selection?.length || 0) % 6), 70);

  const teamOrGameKeys = new Set(
    legs
      .map((leg) => String(leg.gamePk ?? leg.event_id ?? leg.team ?? "").trim())
      .filter(Boolean)
  );
  const correlationNote =
    teamOrGameKeys.size > 0 && teamOrGameKeys.size < legsCount
      ? "Two or more legs appear to share a team or game context. Treat those outcomes as correlated, not independent."
      : "No obvious same-game or same-team stack was detected from the supplied fields.";

  const report = `### Parlay Edge Research - ${legsCount} Leg${legsCount > 1 ? "s" : ""}
> Local research mode. Probability-based analysis for research and entertainment only. Not betting advice.

**Edge Score:** \`${calculatedEdgeScore}/99\` · **Combined Risk:** ${riskLevel}

#### Leg read
${legs.map((leg, index) => `- **Leg ${index + 1} - \`${leg.selection}\` (${leg.market})**: research signal only; baseball outcomes remain uncertain.`).join("\n")}

#### Correlation warning
- ${correlationNote}

#### Reality check
- Every additional leg lowers the hit rate of the combined slip.
- Late scratches, lineup changes, weather, or bullpen usage can change the setup after this report is generated.
- Treat every score as a research estimate, not a certainty.`;

  return {
    status: "simulated",
    edgeScore: calculatedEdgeScore,
    riskLevel,
    report,
  };
}

export async function generateParlayEdgeReport(input: ParlayEdgeInput): Promise<ParlayEdgeReport> {
  const apiKey = process.env.GEMINI_API_KEY;
  const local = localParlayEdge(input);

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

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Analyze this MLB parlay for research purposes only. Return strict JSON.\n${JSON.stringify(input.legs, null, 2)}`,
      config: {
        responseMimeType: "application/json",
        systemInstruction: `You are a cautious MLB research analyst. Never use lock, guaranteed, free money, sure thing, or certainty language. Return only JSON:
{
  "edgeScore": <integer 40 to 95>,
  "report": "<markdown report with correlation warnings and no betting-advice language>"
}`,
      },
    });

    const parsed = JSON.parse(cleanModelJson(response.text || "{}"));
    return {
      status: "success",
      edgeScore: boundedScore(parsed.edgeScore, local.edgeScore),
      riskLevel: local.riskLevel,
      report: typeof parsed.report === "string" && parsed.report.trim() ? parsed.report : local.report,
    };
  } catch (error) {
    console.error("[ai:parlay-edge] Gemini report failed", error);
    return {
      ...local,
      status: "fallback",
    };
  }
}

export function assertParlayEdgeReportIsSafe(report: string): void {
  const lower = report.toLowerCase();
  const forbidden = ["lock", "guaranteed", "free money", "sure thing"];
  const hit = forbidden.find((term) => lower.includes(term));
  if (hit) {
    throw new AppError({
      status: 502,
      code: "external_service_error",
      message: `AI report contained unsafe certainty language: ${hit}`,
    });
  }
}
