import { Brain, Sparkles } from "lucide-react";

interface AskVouchPanelProps {
  playerName: string;
  score: number;
  hrProbability?: number;
  confidence?: string;
  reasons?: string[];
}

export function AskVouchPanel({
  playerName,
  score,
  hrProbability,
  confidence,
  reasons = [],
}: AskVouchPanelProps) {
  return (
    <div className="mt-4 rounded-2xl border border-vouch-cyan/20 bg-black/20 p-4 backdrop-blur-xl">
      <div className="flex items-center gap-2 text-white">
        <Brain className="h-5 w-5 text-vouch-cyan" />
        <h3 className="font-black uppercase">
          Vouch AI Analysis
        </h3>
      </div>

      <p className="mt-3 text-sm text-white/80">
        {playerName} currently grades as a{" "}
        <span className="font-bold text-vouch-cyan">
          VE {score}
        </span>{" "}
        edge candidate.
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-white/5 p-2">
          <span className="text-white/50">
            HR Probability
          </span>
          <p className="font-bold text-white">
            {hrProbability ?? "N/A"}%
          </p>
        </div>

        <div className="rounded-lg bg-white/5 p-2">
          <span className="text-white/50">
            Confidence
          </span>
          <p className="font-bold text-white">
            {confidence ?? "Unknown"}
          </p>
        </div>
      </div>

      {reasons.length > 0 && (
        <div className="mt-3 space-y-1 text-xs text-white/70">
          {reasons.slice(0, 3).map((reason) => (
            <div key={reason}>
              <Sparkles className="mr-1 inline h-3 w-3 text-vouch-cyan" />
              {reason}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
