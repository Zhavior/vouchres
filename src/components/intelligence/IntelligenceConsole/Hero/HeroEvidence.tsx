import type { IntelligenceAnalysis } from "../types";

type Props = {
  analysis: IntelligenceAnalysis;
};

export default function HeroEvidence({ analysis }: Props) {
  const evidence = [];

  if (evidence.length === 0) return null;

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
      <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-emerald-400">
        Why This Pick
      </h3>

      <ul className="space-y-3">
        {evidence.map((reason, index) => (
          <li
            key={index}
            className="flex items-start gap-3 text-sm text-zinc-300"
          >
            <span className="mt-1 text-emerald-400">✓</span>
            <span>{reason}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
