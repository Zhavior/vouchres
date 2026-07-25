import type { VerdictResult } from "../scoring/verdictEngine";

import EvidenceCard from "./EvidenceCard";
import JudgeMeter from "./JudgeMeter";
import JudgeStack from "./JudgeStack";
import RiskSummary from "./RiskSummary";

interface VerdictPanelProps {
  verdict: VerdictResult | null;
}

const COLORS = {
  elite: "text-emerald-400",
  strong: "text-green-400",
  good: "text-blue-400",
  neutral: "text-yellow-400",
  avoid: "text-red-400",
} as const;

export default function VerdictPanel({
  verdict,
}: VerdictPanelProps) {
  if (!verdict) {
    return (
      <div className="rounded-xl border border-white/10 bg-black/30 p-6">
        <h2 className="text-lg font-semibold text-white">
          Verdict Engine
        </h2>

        <p className="mt-2 text-sm text-white/60">
          Select a player to generate a verdict.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-6 backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">
            Verdict Engine
          </h2>

          <p className="text-xs uppercase tracking-wide text-white/50">
            Decision Summary
          </p>
        </div>

        <span className={`font-bold uppercase ${COLORS[verdict.verdict]}`}>
          {verdict.verdict}
        </span>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <Metric label="Score" value={verdict.score} />
        <Metric label="Confidence" value={`${verdict.confidence}%`} />
        <Metric label="Edge" value={`${verdict.edge}%`} />
      </div>

      <div className="mt-6">
        <JudgeMeter score={verdict.score} />
      </div>

      <div className="mt-6">
        <JudgeStack judges={verdict.judges} />
      </div>


      <div className="mt-6">
        <EvidenceCard
          title="Positive Signals"
          items={verdict.positives}
        />
      </div>

      <div className="mt-6">
        <RiskSummary risks={verdict.negatives} />
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg bg-white/5 p-4 text-center">
      <div className="text-2xl font-bold text-white">
        {value}
      </div>

      <div className="mt-1 text-xs uppercase tracking-wide text-white/50">
        {label}
      </div>
    </div>
  );
}
