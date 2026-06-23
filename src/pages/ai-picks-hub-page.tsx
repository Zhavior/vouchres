import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mlbApi, type PickCard } from "@/services/mlb";
import { picksApi } from "@/services/picks";
import { TrustPickCard } from "@/components/trust-pick-card";
import { EmptyStateCard, LoadingCard, ErrorCard, DebugNote } from "@/components/ui-states";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const MARKETS = [{ key: "all", label: "All" }, { key: "hr", label: "HR" }, { key: "hit", label: "Hits" }, { key: "rbi", label: "RBI" }, { key: "run", label: "Runs" }, { key: "tb", label: "TB" }];
const SORTS = [{ key: "edge", label: "Edge" }, { key: "conf", label: "Trust" }, { key: "prob", label: "Prob" }, { key: "risk", label: "Risk" }];

export function AiPicksHubPage() {
  const [market, setMarket] = useState("all");
  const [sort, setSort] = useState("edge");
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["mlb", "picks", "today", market, sort],
    queryFn: () => mlbApi.picksToday({ market: market !== "all" ? market : undefined, sort, limit: 50 }),
    staleTime: 60_000,
  });

  const savePick = useMutation({
    mutationFn: (pick: PickCard) => picksApi.save({ game_id: pick.game_id, player_id: pick.player_id, market: pick.market, line: pick.line }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["picks", "my"] }),
  });

  const picks = data?.data ?? [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-extrabold flex items-center gap-2"><Sparkles className="w-5 h-5" style={{ color: "var(--ve-accent)" }} /> Trust Picks AI</h1>
        <p className="text-xs mt-1" style={{ color: "var(--ve-text-muted)" }}>AI-generated picks with trust scores. Every pick is graded after the game. No guaranteed wins.</p>
        {data?.meta && <div className="mt-2 flex items-center gap-3 text-[10px] font-mono" style={{ color: "var(--ve-text-dim)" }}>
          <span>Model: {data.meta.model_version ?? "—"}</span><span>·</span>
          <span>Games: {data.meta.games_analyzed ?? 0}</span><span>·</span>
          <span>{data.meta.count} picks</span>
          {data.meta.is_stale && <span style={{ color: "var(--ve-warning)" }}>· stale</span>}
        </div>}
        {data?.meta && data.meta.count <= 50 && data.meta.games_analyzed > 0 && (
          <DebugNote message={`Backend returned ${data.meta.count} picks from ${data.meta.games_analyzed} games. Player registry may be limited — check backend players_per_team setting or /mlb/players/active endpoint.`} className="mt-2" />
        )}
      </div>

      {/* Filters */}
      <div className="ve-card p-3 flex items-center gap-2 overflow-x-auto scrollbar-none">
        {MARKETS.map(m => <button key={m.key} onClick={() => setMarket(m.key)} className={cn("px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all", market === m.key ? "ve-badge" : "")} style={market === m.key ? {} : { color: "var(--ve-text-muted)" }}>{m.label}</button>)}
        <div className="ml-auto flex items-center gap-1">
          {SORTS.map(s => <button key={s.key} onClick={() => setSort(s.key)} className={cn("px-2 py-1 rounded text-[11px] font-semibold", sort === s.key ? "" : "opacity-50")} style={sort === s.key ? { color: "var(--ve-accent)" } : { color: "var(--ve-text-muted)" }}>{s.label}</button>)}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{[1,2,3,4,5,6].map(i => <LoadingCard key={i} lines={4} />)}</div>
      : isError ? <ErrorCard onRetry={() => refetch()} />
      : picks.length > 0 ? <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{picks.map((p, i) => <TrustPickCard key={i} pick={p} onSave={async () => { try { await savePick.mutateAsync(p); } catch (e: any) { alert(e?.response?.data?.detail || "Failed"); } }} />)}</div>
      : <EmptyStateCard title="No AI picks available" description="Model scores will appear once today's games are ingested." icon={Sparkles} action={<button onClick={() => refetch()} className="ve-button-ghost text-xs">Refresh</button>} />}
    </div>
  );
}
