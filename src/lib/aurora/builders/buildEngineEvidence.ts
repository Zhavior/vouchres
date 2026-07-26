import { createEvidence } from "../evidence";
import type { EngineEvidence } from "../contracts/engineEvidence";
import { createRisk } from "../risks";
import type { EngineEvidenceInput } from "../contracts/engineEvidenceInput";

export function buildEngineEvidence(input: EngineEvidenceInput): EngineEvidence {
  const evidence = [];
  const risks = [];

  if (input.barrelRate >= 0.12)
    evidence.push(createEvidence("Elite Barrel Rate", `${(input.barrelRate * 100).toFixed(1)}%`, 30));

  if (input.hardHitRate >= 0.50)
    evidence.push(createEvidence("Elite Hard Hit", `${(input.hardHitRate * 100).toFixed(1)}%`, 20));

  if (input.pitcherHR9 >= 1.3)
    evidence.push(createEvidence("Pitcher HR Prone", input.pitcherHR9.toFixed(2), 15));

  if (input.parkFactor >= 1.05)
    evidence.push(createEvidence("Positive Park", input.parkFactor.toFixed(2), 10));

  if (input.weatherBoost >= 0.05)
    evidence.push(createEvidence("Weather Boost", `+${(input.weatherBoost * 100).toFixed(1)}%`, 10));

  if (input.recentForm >= 0.70)
    evidence.push(createEvidence("Strong Recent Form", input.recentForm.toFixed(2), 10));

  if (input.matchupEdge >= 0.70)
    evidence.push(createEvidence("Matchup Edge", input.matchupEdge.toFixed(2), 5));

  if (input.weatherBoost < 0)
    risks.push(createRisk("Negative Weather", "Weather suppresses HR probability", "medium"));

  return { evidence, risks };
}
