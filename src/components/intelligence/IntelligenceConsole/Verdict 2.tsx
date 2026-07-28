import type { IntelligenceAnalysis } from "./types";

interface VerdictProps {
  analysis: IntelligenceAnalysis;
}

function verdict(score: number) {
  if (score >= 90) {
    return {
      title: "Elite Home Run Opportunity",
      description:
        "Everything is lining up. This is one of today's strongest power spots.",
      color: "emerald",
    };
  }

  if (score >= 80) {
    return {
      title: "Strong Opportunity",
      description:
        "Multiple indicators agree. Worth serious consideration.",
      color: "cyan",
    };
  }

  if (score >= 70) {
    return {
      title: "Playable Spot",
      description:
        "Positive indicators exist, but monitor lineup and game conditions.",
      color: "amber",
    };
  }

  return {
    title: "High Risk",
    description:
      "Current evidence is mixed. Additional confirmation is recommended.",
    color: "red",
  };
}

export default function Verdict({ analysis }: VerdictProps) {
  const result = verdict(analysis.score);

  const accent =
    result.color === "emerald"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
      : result.color === "cyan"
      ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
      : result.color === "amber"
      ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
      : "border-red-500/30 bg-red-500/10 text-red-300";

  return (
    <section className="rounded-3xl border border-white/10 bg-zinc-950 p-6">
      <div className="text-xs font-semibold uppercase tracking-[0.30em] text-white/50">
        AI Verdict
      </div>

      <div className={`mt-5 rounded-2xl border p-5 ${accent}`}>
        <h2 className="text-2xl font-black">
          {result.title}
        </h2>

        <p className="mt-3 text-sm leading-6 text-white/75">
          {result.description}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <div className="rounded-full border border-white/10 px-3 py-1 text-sm">
            Edge {analysis.edge}%
          </div>

          <div className="rounded-full border border-white/10 px-3 py-1 text-sm">
            Confidence {analysis.confidence}%
          </div>

          <div className="rounded-full border border-white/10 px-3 py-1 text-sm">
            Tier {analysis.tier}
          </div>
        </div>
      </div>
    </section>
  );
}
