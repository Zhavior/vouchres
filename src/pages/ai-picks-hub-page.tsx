import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mlbApi, type PickCard } from "@/services/mlb";
import { picksApi } from "@/services/picks";
import { PlayerPickCard } from "@/components/player-pick-card";
import { EmptyState } from "@/components/empty-state";
import { LoadingSkeleton } from "@/components/loading-skeleton";
import { ErrorState } from "@/components/error-state";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

const MARKETS = [
  { key: "all", label: "All" },
  { key: "hr", label: "HR" },
  { key: "hit", label: "Hits" },
  { key: "rbi", label: "RBI" },
  { key: "run", label: "Runs" },
  { key: "tb", label: "Total Bases" },
];

const SORTS = [
  { key: "edge", label: "Edge" },
  { key: "conf", label: "Confidence" },
  { key: "prob", label: "Probability" },
  { key: "risk", label: "Risk" },
];

export function AiPicksHubPage() {
  const [market, setMarket] = useState("all");
  const [sort, setSort] = useState("edge");
  const me = useAuthStore((s) => s.me);
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["mlb", "picks", "today", market, sort],
    queryFn: () =>
      mlbApi.picksToday({
        market: market !== "all" ? market : undefined,
        sort,
        limit: 50,
      }),
    staleTime: 60_000,
  });

  const savePick = useMutation({
    mutationFn: (pick: PickCard) =>
      picksApi.save({
        game_id: pick.game_id,
        player_id: pick.player_id,
        market: pick.market,
        line: pick.line,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["picks", "my"] });
    },
  });

  const picks = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-electric-400" />
          AI Picks Hub
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl">
          Every pick shows probability, confidence, edge, risk tier, and plain-language reasoning.
          Save before first pitch. Backend grades after the game. Your record updates automatically.
        </p>
        {data?.meta && (
          <div className="mt-2 flex items-center gap-3 text-[10px] text-slate-500 font-mono">
            <span>model: {data.meta.model_version ?? "—"}</span>
            <span>·</span>
            <span>games analyzed: {data.meta.games_analyzed ?? 0}</span>
            <span>·</span>
            <span>{data.meta.count} picks</span>
            {data.meta.is_stale && (
              <span className="text-warning">· stale data</span>
            )}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="glass-card p-3 space-y-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {MARKETS.map((m) => (
            <button
              key={m.key}
              onClick={() => setMarket(m.key)}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all",
                market === m.key
                  ? "bg-electric-500/15 text-electric-300 border border-electric-500/40"
                  : "text-slate-400 hover:text-electric-300 border border-transparent"
              )}
            >
              {m.label}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[10px] text-slate-500 font-mono">SORT</span>
            {SORTS.map((s) => (
              <button
                key={s.key}
                onClick={() => setSort(s.key)}
                className={cn(
                  "px-2 py-1 rounded text-[11px] font-semibold transition-all",
                  sort === s.key
                    ? "text-electric-300 bg-electric-500/10"
                    : "text-slate-500 hover:text-slate-300"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <LoadingSkeleton key={i} lines={5} className="glass-card p-4" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : picks.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {picks.map((pick, i) => (
            <PlayerPickCard
              key={`${pick.player_id}-${pick.market}-${pick.game_id}-${i}`}
              score={pick as any}
              playerName={pick.player_name}
              playerTeam={pick.team_abbr}
              opponent={pick.opponent_abbr ? `vs ${pick.opponent_abbr}` : undefined}
              pitcherMatchup={pick.pitcher_matchup ?? undefined}
              headshotUrl={pick.headshot_url ?? undefined}
              onSave={async () => {
                try {
                  await savePick.mutateAsync(pick);
                } catch (e: any) {
                  if (e?.response?.status === 403) {
                    alert("Age verification required before saving picks.");
                  } else if (e?.response?.status === 409) {
                    alert(e.response.data.detail);
                  } else {
                    alert("Failed to save pick.");
                  }
                }
              }}
              saved={false}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Sparkles}
          title="No AI picks available"
          description="Model scores will populate here once today's games are ingested."
          action={
            <button onClick={() => refetch()} className="ghost-button text-xs">
              Refresh
            </button>
          }
        />
      )}
    </div>
  );
}
