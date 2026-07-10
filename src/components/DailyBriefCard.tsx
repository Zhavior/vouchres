import { Brain, Flame, MapPin, Target } from "lucide-react";

interface DailyBriefCardProps {
  topHr?: {
    playerName?: string;
    name?: string;
  };
  vulnerablePitcher?: {
    playerName?: string;
    name?: string;
  };
  environment?: {
    park?: string;
    name?: string;
  };
}

export function DailyBriefCard({
  topHr,
  vulnerablePitcher,
  environment,
}: DailyBriefCardProps) {
  const hitter = topHr?.playerName ?? topHr?.name ?? "No elite edge detected";
  const pitcher =
    vulnerablePitcher?.playerName ??
    vulnerablePitcher?.name ??
    "No pitcher alert";

  const park =
    environment?.park ??
    environment?.name ??
    "Environment data syncing";

  return (
    <section className="ve-premium-panel rounded-3xl border border-vouch-cyan/20 bg-black/30 p-5 backdrop-blur-xl">
      <div className="flex items-center gap-2">
        <Brain className="h-5 w-5 text-vouch-cyan" />

        <h2 className="font-black uppercase text-white">
          VouchEdge Daily Brief
        </h2>
      </div>

      <div className="mt-5 space-y-3">
        <div className="rounded-xl bg-white/5 p-3">
          <div className="flex items-center gap-2 text-xs text-white/50">
            <Flame className="h-4 w-4 text-orange-400" />
            Top HR Edge
          </div>

          <p className="mt-1 font-black text-white">
            {hitter}
          </p>
        </div>

        <div className="rounded-xl bg-white/5 p-3">
          <div className="flex items-center gap-2 text-xs text-white/50">
            <Target className="h-4 w-4 text-red-400" />
            Pitcher Weakness
          </div>

          <p className="mt-1 font-black text-white">
            {pitcher}
          </p>
        </div>

        <div className="rounded-xl bg-white/5 p-3">
          <div className="flex items-center gap-2 text-xs text-white/50">
            <MapPin className="h-4 w-4 text-vouch-cyan" />
            Environment
          </div>

          <p className="mt-1 font-black text-white">
            {park}
          </p>
        </div>
      </div>
    </section>
  );
}
