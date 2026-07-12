import { Brain } from "lucide-react";

interface AiMarketPulseCardProps {
  message?: string;
  signals?: string[];
}

export function AiMarketPulseCard({
  message = "Today's board is showing elevated power opportunities.",
  signals = [
    "Pitcher vulnerability rising",
    "Park environments favorable",
    "Elite hitters separating",
  ],
}: AiMarketPulseCardProps) {
  return (
    <section className="ve-premium-panel rounded-3xl border border-vouch-cyan/20 bg-black/30 p-5 backdrop-blur-xl shadow-xl shadow-black/20">
      <div className="flex items-center gap-2 text-white">
        <Brain className="h-5 w-5 text-vouch-cyan" />

        <h2 className="font-black uppercase">
          AI Market Pulse
        </h2>
      </div>

      <p className="mt-4 text-sm text-white/70">
        {message}
      </p>

      <div className="mt-4 space-y-2 text-xs text-white/60">
        {signals.map((signal) => (
          <div key={signal}>
            ✓ {signal}
          </div>
        ))}
      </div>
    </section>
  );
}
