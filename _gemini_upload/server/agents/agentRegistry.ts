/**
 * Agent registry. Collects capper + judge agents and turns the daily MLB report
 * into agent-styled picks, each run through the judge panel before it is returned.
 */
import { CapperAgent, JudgeAgent, AgentPick } from "./baseAgent";
import { professorAgent } from "./cappers/professorAgent";
import { hrHunterAgent } from "./cappers/hrHunterAgent";
import { sharpSyndicateAgent } from "./cappers/sharpSyndicateAgent";
import { sneakyDogAgent } from "./cappers/sneakyDogAgent";
import { parlayDemonAgent } from "./cappers/parlayDemonAgent";
import { pickJudgeAgent } from "./judges/pickJudgeAgent";
import { riskJudgeAgent } from "./judges/riskJudgeAgent";
import { biasJudgeAgent } from "./judges/biasJudgeAgent";
import { trustJudgeAgent } from "./judges/trustJudgeAgent";
import { DailyMlbReport } from "../services/intelligence/mlbIntelligenceEngine";
import { buildParlay } from "../services/intelligence/parlayEngine";
import { runJudgePanel } from "../services/judging/trustJudgeService";
import { JudgeVerdict } from "../services/judging/judgeTypes";

export const CAPPER_AGENTS: CapperAgent[] = [
  professorAgent,
  hrHunterAgent,
  sharpSyndicateAgent,
  sneakyDogAgent,
  parlayDemonAgent,
];

export const JUDGE_AGENTS: JudgeAgent[] = [pickJudgeAgent, riskJudgeAgent, biasJudgeAgent, trustJudgeAgent];

export function listAgents(): CapperAgent[] {
  return CAPPER_AGENTS;
}
export function getAgent(id: string): CapperAgent | undefined {
  return CAPPER_AGENTS.find((a) => a.id === id);
}

export interface JudgedPick {
  pick: AgentPick;
  verdict: JudgeVerdict;
}

function judged(pick: AgentPick): JudgedPick {
  return { pick, verdict: runJudgePanel(pick) };
}

/** Produce an agent's picks for the slate, judged and ready for the frontend. */
export async function generatePicks(agentId: string, report: DailyMlbReport): Promise<JudgedPick[]> {
  const agent = getAgent(agentId);
  if (!agent) return [];

  switch (agent.id) {
    case "professor": {
      // Conservative: reframe the strongest HR matchups as lower-variance total-bases plays.
      return report.hrTargets
        .filter((t) => t.label === "Strong" || t.label === "Playable")
        .slice(0, 3)
        .map((t) =>
          judged({
            agentId: agent.id,
            agentName: agent.name,
            team: t.team,
            opponent: t.opponent,
            market: "Total bases",
            selection: `${t.team} total bases lean vs ${t.opposingPitcher}`,
            score: Math.min(t.hrScore + 4, 95),
            reasons: t.reasons,
            riskWarnings: ["Lower-variance angle off a strong HR matchup; still matchup-level only."],
            dataQuality: "partial",
          })
        );
    }
    case "hr-hunter": {
      return report.hrTargets.slice(0, 4).map((t) =>
        judged({
          agentId: agent.id,
          agentName: agent.name,
          team: t.team,
          opponent: t.opponent,
          market: "Anytime HR",
          selection: `${t.team} anytime HR vs ${t.opposingPitcher}`,
          score: t.hrScore,
          reasons: t.reasons,
          riskWarnings: t.riskWarnings,
          dataQuality: t.dataQuality,
        })
      );
    }
    case "sharp-syndicate": {
      return report.hrTargets
        .filter((t) => t.hrScore >= 55 && t.hrScore < 80)
        .slice(0, 3)
        .map((t) =>
          judged({
            agentId: agent.id,
            agentName: agent.name,
            team: t.team,
            opponent: t.opponent,
            market: "Total bases (value)",
            selection: `${t.team} total bases — market under-pricing vs ${t.opposingPitcher}`,
            score: t.hrScore,
            reasons: ["Value spot the public is overlooking", ...t.reasons.slice(0, 1)],
            riskWarnings: ["Contrarian value can take time to pay."],
            dataQuality: "partial",
          })
        );
    }
    case "sneaky-dog": {
      return report.sneakyHr.map((s) =>
        judged({
          agentId: agent.id,
          agentName: agent.name,
          team: s.team,
          opponent: s.opponent,
          market: "Anytime HR (sneaky)",
          selection: `${s.team} sneaky HR vs ${s.opposingPitcher}`,
          score: s.risk === "HIGH" ? 56 : 44,
          reasons: [s.reason],
          riskWarnings: s.whatCouldGoWrong,
          dataQuality: "limited",
        })
      );
    }
    case "parlay-demon": {
      const parlay = await buildParlay(report.games, 3);
      return [
        judged({
          agentId: agent.id,
          agentName: agent.name,
          team: parlay.legs.map((l) => l.team).join(" + "),
          opponent: "Multiple",
          market: `${parlay.size}-leg parlay`,
          selection: parlay.legs.map((l) => l.selection).join(" | "),
          score: parlay.combinedScore,
          reasons: [parlay.correlationWarning],
          riskWarnings: parlay.whatCouldGoWrong,
          isParlay: true,
          legs: parlay.size,
          dataQuality: "limited",
        }),
      ];
    }
    default:
      return [];
  }
}
