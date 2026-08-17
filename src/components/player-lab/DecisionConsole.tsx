import { TrendingUp } from "lucide-react";

type DecisionConsoleProps = {
  playerName: string;
  edge: number | null;
  confidence?: number | string;
  source: string;
};

export default function DecisionConsole({
  playerName,
  edge,
  confidence = 0,
  source,
}: DecisionConsoleProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#101827] via-[#0B1322] to-black p-6 shadow-2xl">
      <div className="inline-flex items-center rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-[11px] font-black tracking-[0.25em] uppercase text-yellow-400">
        ★★★★★ VERIFIED PLAY
      </div>

      <h1 className="mt-4 text-3xl font-black tracking-tight text-white">
        {playerName}
      </h1>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <Metric title="EDGE" value={edge ?? "--"} color="text-emerald-300" />
        <Metric title="CONFIDENCE" value={confidence} color="text-emerald-300" />
        <Metric title="SOURCE" value={source} color="text-yellow-300" />
      </div>

      <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
        <div className="flex items-center gap-2 text-xs font-black tracking-widest text-emerald-300 uppercase">
          <TrendingUp className="h-4 w-4" />
          Why VouchEdge Likes This
        </div>

        <ul className="mt-3 space-y-2 text-sm text-white/80">
          <li>✓ Elite matchup profile</li>
          <li>✓ Strong barrel opportunity</li>
          <li>✓ Favorable pitch mix</li>
          <li>✓ Positive run environment</li>
          <li>✓ AI model consensus</li>
        </ul>
      </div>
    </section>
  );
}

function Metric({
  title,
  value,
  color,
}: {
  title: string;
  value: React.ReactNode;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-[10px] font-bold tracking-widest uppercase text-white/40">
        {title}
      </div>
      <div className={`mt-2 text-3xl font-black ${color}`}>
        {value}
      </div>
    </div>
  );
}
