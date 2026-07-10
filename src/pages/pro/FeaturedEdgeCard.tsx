import { useEffect } from "react";
import { useOnboardingStore } from "../../stores/onboardingStore";
import { Flame, Sparkles } from "lucide-react";
import { notify } from "../../lib/appNotifications";
import { useTrackedPlayersStore } from "../../stores/trackedPlayersStore";
import { ProAccessGate } from "../../components/pro/ProAccessGate";

interface FeaturedEdgeCardProps {
  playerName: string;
  score: number;
  confidence?: string;
  hrProbability?: number;
  reasons?: string[];
  onSectionChange?: (section: string) => void;
}

export function FeaturedEdgeCard({
  playerName,
  score,
  confidence,
  hrProbability,
  reasons = [],
  onSectionChange,
}: FeaturedEdgeCardProps) {
  const completeOnboarding = useOnboardingStore(
    (state) => state.complete
  );

  useEffect(() => {
    completeOnboarding();
  }, [completeOnboarding]);
  const trackPlayer = useTrackedPlayersStore(
    (state) => state.trackPlayer
  );

  const isTracked = useTrackedPlayersStore(
    (state) => state.isTracked(playerName)
  );
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

        <div className="space-y-1">
          {reasons.slice(0, 3).map((reason) => (
            <p key={reason}>
              ✓ {reason}
            </p>
          ))}
        </div>

        <div className="mt-4">
          <ProAccessGate
            feature="vouch_ai_deep_analysis"
            fallback={
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="font-black text-white">
                  🔒 Deep Vouch Analysis
                </p>

                <p className="mt-2 text-xs text-white/60">
                  Unlock full reasoning, confidence breakdown,
                  matchup intelligence, and AI explanations.
                </p>

                <button
                  onClick={() => onSectionChange?.("premium")}
                  className="mt-3 rounded-xl bg-vouch-cyan px-4 py-2 text-xs font-black text-black"
                >
                  Upgrade to Pro
                </button>
              </div>
            }
          >
            <div className="mt-3 rounded-xl bg-vouch-cyan/10 p-4">
              <p className="font-black text-vouch-cyan">
                🧠 Deep Vouch Analysis Unlocked
              </p>

              <p className="mt-2 text-xs text-white/70">
                Full AI reasoning and edge breakdown available.
              </p>
            </div>
          </ProAccessGate>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-2">
        <button
          onClick={() => {
              onSectionChange?.("ai_engine");

              window.dispatchEvent(
                new CustomEvent("vouch-ai-context", {
                  detail: {
                    prompt: `
Explain this featured edge:

Player: ${playerName}
VE Score: ${score}
HR Probability: ${hrProbability ?? "N/A"}%
Confidence: ${confidence ?? "N/A"}

Reasons:
${reasons.join("\n")}

Why is this a top edge today?
`,
                  },
                })
              );
            }}
          className="rounded-xl bg-vouch-cyan/20 px-3 py-2 text-xs font-black text-vouch-cyan hover:bg-vouch-cyan/30"
        >
          🤖 Ask AI
        </button>

        <button
          onClick={() => onSectionChange?.("player_edge_lab")}
          className="rounded-xl bg-white/10 px-3 py-2 text-xs font-black text-white hover:bg-white/20"
        >
          📊 Player
        </button>

        <button
          onClick={() => onSectionChange?.("team_matchup_lab")}
          className="rounded-xl bg-white/10 px-3 py-2 text-xs font-black text-white hover:bg-white/20"
        >
          ⚾ Matchup
        </button>
        <button
          onClick={() => {
            trackPlayer(playerName);

            notify({
              kind: "success",
              title: `${playerName} tracked`,
              body: "Vouch will watch this edge and alert you when the signal changes.",
              section: "notifications",
            });
          }}
          className="rounded-xl bg-vouch-cyan/20 px-3 py-2 text-xs font-black text-vouch-cyan hover:bg-vouch-cyan/30"
        >
          🔔 {isTracked ? "Tracked" : "Track"}
        </button>

      </div>
    </section>
  );
}
