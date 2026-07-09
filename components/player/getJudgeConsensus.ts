import type { JudgeId } from "@/types/aiAgent";

export interface JudgeConsensusItem {
  id: JudgeId;
  name: string;
  score: number;
  label: string;
  tone: "positive" | "neutral" | "warning";
}

const JUDGE_NAMES: Record<JudgeId, string> = {
  data_scout: "Data Scout",
  power_hunter: "Power Hunter",
  momentum_reader: "Momentum Reader",
  risk_auditor: "Risk Auditor",
};

function getLabel(score: number, id: JudgeId): string {
  if (id === "risk_auditor") {
    if (score >= 70) return "Risk Alert";
    if (score >= 40) return "Watch";
    return "Safe";
  }

  if (score >= 85) return "Elite";
  if (score >= 70) return "Strong";
  if (score >= 55) return "Positive";

  return "Neutral";
}

function getTone(
  score: number,
  id: JudgeId,
): JudgeConsensusItem["tone"] {
  if (id === "risk_auditor") {
    return score >= 70 ? "warning" : "neutral";
  }

  return score >= 70 ? "positive" : "neutral";
}

export function buildJudgeConsensus(
  scores: Partial<Record<JudgeId, number>>,
): JudgeConsensusItem[] {
  return (Object.keys(JUDGE_NAMES) as JudgeId[]).map((id) => {
    const score = Math.round(scores[id] ?? 0);

    return {
      id,
      name: JUDGE_NAMES[id],
      score,
      label: getLabel(score, id),
      tone: getTone(score, id),
    };
  });
}
