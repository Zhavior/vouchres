/** Daily MLB report narrative — Gemini-backed with deterministic fallback. */
import { buildDailyReport } from "../intelligence/mlbIntelligenceEngine";
import { generateText } from "./geminiClient";
import { TTL } from "../../lib/cache";
import { SAFE_SYSTEM_INSTRUCTION, buildDailyReportPrompt } from "./aiPromptBuilder";
import { dailyReportFallback } from "./aiFallbacks";

export interface DailyReportNarrative {
  date: string;
  gameCount: number;
  narrative: string;
  source: "live" | "cached" | "fallback" | "no-key";
  data: Awaited<ReturnType<typeof buildDailyReport>>;
}

export async function getDailyReportNarrative(date?: string): Promise<DailyReportNarrative> {
  const data = await buildDailyReport(date);
  const topVulnerable = data.vulnerablePitchers.slice(0, 3).map((p) => `${p.pitcherName} (${p.vulnerabilityScore})`);
  const topHr = data.hrTargets.slice(0, 3).map((t) => `${t.team} vs ${t.opposingPitcher} (${t.hrScore})`);
  const topRunEnv = data.runEnvironments.slice(0, 3).map((r) => `${r.matchup} (${r.runEnvironmentScore})`);

  const fallbackNote =
    topHr.length > 0 ? `Top HR matchup: ${topHr[0]}. Most vulnerable arm: ${topVulnerable[0] ?? "n/a"}.` : "";

  const result = await generateText({
    cacheKey: `dailyReport:${data.date}`,
    prompt: buildDailyReportPrompt({ date: data.date, gameCount: data.gameCount, topVulnerable, topHr, topRunEnv }),
    systemInstruction: SAFE_SYSTEM_INSTRUCTION,
    fallback: dailyReportFallback(data.date, data.gameCount, fallbackNote),
    ttlMs: TTL.dailyReport,
  });

  return { date: data.date, gameCount: data.gameCount, narrative: result.text, source: result.status, data };
}
