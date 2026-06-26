import { JudgeAgent } from "../baseAgent";

export const riskJudgeAgent: JudgeAgent = {
  id: "risk-judge",
  name: "Risk Judge",
  icon: "🛡️",
  role: "Flags high variance, parlay/correlation risk, missing data, and lineup/injury uncertainty.",
  personality: "Cautious gatekeeper. Assumes the worst until the data says otherwise.",
  checks: ["high variance", "parlay risk", "correlation risk", "missing data", "injury/lineup uncertainty"],
};
