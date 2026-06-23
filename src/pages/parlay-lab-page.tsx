import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { parlaysApi, type ParlaySuggestion } from "@/services/parlays";
import { ParlayCard } from "@/components/parlay-card";
import { EmptyState } from "@/components/empty-state";
import { LoadingSkeleton } from "@/components/loading-skeleton";
import { ErrorState } from "@/components/error-state";
import { Layers } from "lucide-react";
import { cn } from "@/lib/utils";

const RISK_TIERS = [
  { key: "safe", label: "Safe", desc: "High-confidence, low edge" },
  { key: "balanced", label: "Balanced", desc: "Mix of edge and confidence" },
  { key: "risky", label: "Risky", desc: "High edge, lower confidence" },
  { key: "lottery", label: "Lottery", desc: "Long-shot combos" },
];

export function ParlayLabPage() {
  const [tier, setTier] = useState("balanced");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["parlays", "suggest", tier],
    queryFn: () => parlaysApi.suggest({ risk_tier: tier, limit: 10 }),
    staleTime: 60_000,
  });

  const myParlays = useQuery({
    queryKey: ["parlays", "my"],
    queryFn: () => parlaysApi.my({ limit: 20 }),
    staleTime: 30_000,
  });

  const suggestions = data?.data ?? [];
  const savedParlays = myParlays.data?.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
          <Layers className="w-5 h-5 text-electric-400" />
          Parlay Lab
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl">
          Build 1-leg, 2-leg, 3-leg, or 4-leg parlays. Save before the earliest leg's game
          starts. Backend grades leg by leg. Parlay wins only if every leg wins.
        </p>
      </div>

      {/* Risk tier selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {RISK_TIERS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTier(t.key)}
            className={cn(
              "glass-card p-3 text-left transition-all",
              tier === t.key ? "border-electric-500/50 shadow-glow" : "hover:border-electric-500/30"
            )}
          >
            <div className="text-sm font-bold text-slate-100">{t.label}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">{t.desc}</div>
          </button>
        ))}
      </div>

      {/* Suggested parlays */}
      <section>
        <h2 className="text-sm font-bold text-slate-100 mb-3">AI-Suggested Parlays</h2>
        {isLoading ? (
          <div className="grid sm:grid-cols-2 gap-3">
            {[1, 2].map((i) => (
              <LoadingSkeleton key={i} lines={4} className="glass-card p-4" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : suggestions.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-3">
            {suggestions.map((sugg: ParlaySuggestion, i) => (
              <ParlayCard
                key={i}
                legs={sugg.legs.map((leg, j) => ({
                  id: `leg-${i}-${j}`,
                  label: `${leg.player_name} (${leg.team_abbr}) — ${leg.market.toUpperCase()}`,
                  market: leg.market,
                  status: "pending" as const,
                }))}
                combinedConfidence={sugg.combined_confidence}
                riskTier={sugg.risk_tier as any}
                estimatedPayout={sugg.estimated_payout}
                status="saved"
                result="pending"
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Layers}
            title="No parlay suggestions for this tier"
            description="Try a different risk tier, or check back when more games are available."
          />
        )}
      </section>

      {/* My saved parlays */}
      <section>
        <h2 className="text-sm font-bold text-slate-100 mb-3">My Saved Parlays</h2>
        {savedParlays.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-3">
            {savedParlays.map((parlay) => (
              <ParlayCard
                key={parlay.id}
                legs={parlay.legs.map((leg) => ({
                  id: `leg-${leg.id}`,
                  label: `Pick #${leg.pick_id.slice(0, 8)}`,
                  market: "",
                  status: leg.leg_status as any,
                }))}
                combinedConfidence={parlay.combined_confidence}
                riskTier={parlay.risk_tier as any}
                estimatedPayout={parlay.estimated_payout ?? undefined}
                status={parlay.status}
                result={parlay.result}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Layers}
            title="No saved parlays"
            description="Save your first parlay from the suggestions above."
          />
        )}
      </section>
    </div>
  );
}
