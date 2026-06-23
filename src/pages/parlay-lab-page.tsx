import { useQuery } from "@tanstack/react-query";
import { parlaysApi, type ParlaySuggestion } from "@/services/parlays";
import { ParlayCard } from "@/components/parlay-card";
import { EmptyStateCard, LoadingCard, ErrorCard } from "@/components/ui-states";
import { Layers } from "lucide-react";
import { cn } from "@/lib/utils";

const RISK_TIERS = [
  { key: "safe", label: "Safer 2-Leg", desc: "High confidence" },
  { key: "balanced", label: "Balanced 3-Leg", desc: "Mix of edge + trust" },
  { key: "risky", label: "Aggressive 4-Leg", desc: "High edge, lower trust" },
  { key: "lottery", label: "Lotto Longshot", desc: "Long-shot combos" },
];

export function ParlayLabPage() {
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ["parlays", "suggest", "balanced"], queryFn: () => parlaysApi.suggest({ risk_tier: "balanced", limit: 10 }), staleTime: 60_000 });
  const myParlays = useQuery({ queryKey: ["parlays", "my"], queryFn: () => parlaysApi.my({ limit: 20 }), staleTime: 30_000 });

  const suggestions = data?.data ?? [];
  const saved = myParlays.data?.data ?? [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-extrabold flex items-center gap-2"><Layers className="w-5 h-5" style={{ color: "var(--ve-accent)" }} /> Parlay Lab</h1>
        <p className="text-xs mt-1" style={{ color: "var(--ve-text-muted)" }}>AI-built parlays with connected legs. Save before game start. Auto-graded leg by leg.</p>
      </div>

      {/* Risk tier selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {RISK_TIERS.map(t => (
          <button key={t.key} className={cn("ve-card p-3 text-left transition-all ve-card-hover")}>
            <div className="text-sm font-bold">{t.label}</div>
            <div className="text-[10px] mt-0.5" style={{ color: "var(--ve-text-dim)" }}>{t.desc}</div>
          </button>
        ))}
      </div>

      {/* Suggestions */}
      <section>
        <h2 className="text-sm font-bold mb-3">AI Parlay Suggestions</h2>
        {isLoading ? <div className="grid sm:grid-cols-2 gap-3">{[1,2].map(i => <LoadingCard key={i} lines={4} />)}</div>
        : isError ? <ErrorCard onRetry={() => refetch()} />
        : suggestions.length > 0 ? <div className="grid sm:grid-cols-2 gap-3">{suggestions.map((s: ParlaySuggestion, i: number) => <ParlayCard key={i} legs={s.legs.map((leg, j) => ({ id: `leg-${i}-${j}`, label: `${leg.player_name} (${leg.team_abbr}) — ${leg.market.toUpperCase()}`, market: leg.market, status: "pending" as const }))} combinedConfidence={s.combined_confidence} riskTier={s.risk_tier} estimatedPayout={s.estimated_payout} status="saved" result="pending" />)}</div>
        : <EmptyStateCard title="No parlay suggestions" description="Try a different risk tier or check back when more games are available." icon={Layers} />}
      </section>

      {/* My parlays */}
      <section>
        <h2 className="text-sm font-bold mb-3">My Saved Parlays</h2>
        {saved.length > 0 ? <div className="grid sm:grid-cols-2 gap-3">{saved.map((p: any) => <ParlayCard key={p.id} legs={p.legs.map((l: any) => ({ id: `leg-${l.id}`, label: `Pick #${l.pick_id.slice(0,8)}`, market: "", status: l.leg_status }))} combinedConfidence={p.combined_confidence} riskTier={p.risk_tier} estimatedPayout={p.estimated_payout ?? undefined} status={p.status} result={p.result} />)}</div>
        : <EmptyStateCard title="No saved parlays" description="Save your first parlay from the suggestions above." icon={Layers} />}
      </section>
    </div>
  );
}
