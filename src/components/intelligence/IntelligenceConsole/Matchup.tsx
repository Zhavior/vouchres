import type { IntelligenceAnalysis } from "./types";

interface MatchupProps {
  analysis: IntelligenceAnalysis;
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="text-[11px] uppercase tracking-[0.20em] text-white/45">
        {label}
      </div>

      <div className="mt-2 text-xl font-bold text-white">
        {value}
      </div>
    </div>
  );
}

export default function Matchup({
  analysis,
}: MatchupProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-zinc-950 p-6">

      <div className="flex items-center justify-between">

        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.30em] text-white/45">
            Matchup
          </div>

          <h3 className="mt-2 text-2xl font-black text-white">
            vs {analysis.pitcherName}
          </h3>

          <p className="mt-1 text-sm text-white/55">
            {analysis.opponent}
          </p>
        </div>

      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">

        <Stat
          label="Throws"
          value="RHP"
        />

        <Stat
          label="HR/9"
          value="1.42"
        />

        <Stat
          label="Fly Ball %"
          value="41%"
        />

        <Stat
          label="Hard Hit"
          value="47%"
        />

      </div>

    </section>
  );
}
