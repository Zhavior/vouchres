import type { IntelligenceAnalysis } from "./types";

interface MetricsProps {
  analysis: IntelligenceAnalysis;
}

interface MetricCardProps {
  label: string;
  value: string | number;
  accent?: "cyan" | "emerald" | "gold";
}

function MetricCard({
  label,
  value,
  accent = "cyan",
}: MetricCardProps) {
  const accentClass = {
    cyan: "text-cyan-400",
    emerald: "text-emerald-400",
    gold: "text-amber-400",
  }[accent];

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm">
      <div className="text-xs uppercase tracking-[0.18em] text-white/45">
        {label}
      </div>

      <div className={`mt-2 text-3xl font-black ${accentClass}`}>
        {value}
      </div>
    </div>
  );
}

export default function Metrics({ analysis }: MetricsProps) {
  return (
    <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <MetricCard
        label="EDGE"
        value={analysis.edge}
        accent="cyan"
      />

      <MetricCard
        label="CONFIDENCE"
        value={`${analysis.confidence}%`}
        accent="emerald"
      />

      <MetricCard
        label="SCORE"
        value={analysis.score}
        accent="gold"
      />

      <MetricCard
        label="PITCHER"
        value={analysis.pitcherName}
      />
    </section>
  );
}
