import { ArrowRight, Brain, ShieldCheck } from "lucide-react";

import type { IntelligenceAnalysis } from "./IntelligenceConsole/types";

type DecisionCardProps = {
  analysis: IntelligenceAnalysis;
};

export function DecisionCard({
  analysis,
}: DecisionCardProps) {
  return (
    <div className="group rounded-2xl border border-white/10 bg-ve-surface-panel p-5 transition-all duration-200 hover:-translate-y-1 hover:border-ve-ion/40">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">{analysis.recommendation.title}</h3>
          <p className="mt-1 text-sm text-white/60">{analysis.summary.body}</p>
        </div>

        <div className="rounded-xl bg-ve-ion px-3 py-2 text-xl font-bold">
          {analysis.score}
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium">
          <Brain className="h-4 w-4" />
          🧠 Aurora Verdict
        </div>

        <div className="space-y-2">
          {analysis.confidenceBreakdown.factors.map((factor) => (
            <div
              key={factor.label}
              className="flex items-center gap-2 text-sm text-white/80"
            >
              <ShieldCheck className="h-4 w-4 text-ve-ion" />
              {factor.reason}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-2 flex justify-between text-xs text-white/50">
          <span>Confidence</span>
          <span>{analysis.confidenceBreakdown.score}%</span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-ve-ion transition-all"
            style={{ width: `${analysis.confidenceBreakdown.score}%` }}
          />
        </div>
      </div>

      <button className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-ve-ion py-3 font-semibold transition hover:brightness-110">
        Open Intelligence
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
