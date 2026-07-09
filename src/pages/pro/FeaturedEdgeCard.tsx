import { Flame, Sparkles } from "lucide-react";

interface FeaturedEdgeCardProps {
  playerName: string;
  score: number;
  confidence?: string;
  hrProbability?: number;
  reasons?: string[];
}

export function FeaturedEdgeCard({
  playerName,
  score,
  confidence,
  hrProbability,
  reasons = [],
}: FeaturedEdgeCardProps) {
  return (
    <section className="ve-premium-panel rounded-3xl border border-vouch-cyan/20 bg-black/30 p-6 backdrop-blur-xl shadow-xl">
      <div className="flex items-center gap-2 text-vouch-cyan">
        <Flame className="h-6 w-6" />
        <span className="text-xs font-black uppercase">
          Featured Edge
        </span>
      </div>

      <h2 className="mt-4 text-3xl font-black text-white">
        {playerName}
      </h2>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-white/5 p-3">
          <p className="text-xs text-white/50">
            VE Score
          </p>
          <p className="text-2xl font-black text-vouch-cyan">
            {score}
          </p>
        </div>

        <div className="rounded-xl bg-white/5 p-3">
          <p className="text-xs text-white/50">
            HR %
          </p>
          <p className="text-2xl font-black text-white">
            {hrProbability ?? "N/A"}%
          </p>
        </div>

        <div className="rounded-xl bg-white/5 p-3">
          <p className="text-xs text-white/50">
            Confidence
          </p>
          <p className="text-lg font-black text-white">
            {confidence ?? "Unknown"}
          </p>
        </div>
      </div>

      <div className="mt-5 text-sm text-white/70">
        <div className="mb-2 flex items-center gap-2 text-white">
          <Sparkles className="h-4 w-4 text-vouch-cyan" />
          Vouch AI Summary
        </div>

        {reasons.slice(0, 3).map((reason) => (
          <p key={reason}>
            ✓ {reason}
          </p>
        ))}
      </div>
    </section>
  );
}
