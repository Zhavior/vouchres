import { useQuery } from "@tanstack/react-query";
import { trustApi } from "@/services/trust";
import { TrustScoreRing } from "@/components/app-shell";
import { ProfileAvatar, getBorderForUser } from "@/components/profile-avatar";
import { EmptyStateCard, LoadingCard, ErrorCard } from "@/components/ui-states";
import { Trophy, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

const MARKETS = [{ key: "all", label: "All" }, { key: "hr", label: "HR" }, { key: "hit", label: "Hits" }, { key: "rbi", label: "RBI" }];
const PERIODS = [{ key: "7d", label: "7 Days" }, { key: "30d", label: "30 Days" }, { key: "all", label: "All Time" }];
const SORTS = [{ key: "trust_score", label: "Trust" }, { key: "win_rate", label: "Win Rate" }, { key: "verified_picks", label: "Volume" }, { key: "streak", label: "Streak" }];

export function LeaderboardPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["leaderboard", "all", "all", "trust_score"],
    queryFn: () => trustApi.leaderboard({ sort: "trust_score", limit: 50 }),
    staleTime: 60_000,
  });
  const entries = data?.data ?? [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-extrabold flex items-center gap-2"><Trophy className="w-5 h-5" style={{ color: "var(--ve-accent)" }} /> Leaderboard</h1>
        <p className="text-xs mt-1" style={{ color: "var(--ve-text-muted)" }}>Ranked by verified trust. No self-reported wins. No fake gurus.</p>
      </div>

      {/* Filters */}
      <div className="ve-card p-3 space-y-2">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="text-[10px] font-mono" style={{ color: "var(--ve-text-dim)" }}>MARKET</span>
          {MARKETS.map(m => <button key={m.key} className="px-2 py-1 rounded text-[11px] font-semibold" style={{ color: "var(--ve-text-muted)" }}>{m.label}</button>)}
          <div className="ml-auto flex items-center gap-1">
            <span className="text-[10px] font-mono" style={{ color: "var(--ve-text-dim)" }}>PERIOD</span>
            {PERIODS.map(p => <button key={p.key} className="px-2 py-1 rounded text-[11px] font-semibold" style={{ color: "var(--ve-text-muted)" }}>{p.label}</button>)}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-mono" style={{ color: "var(--ve-text-dim)" }}>SORT</span>
          {SORTS.map(s => <button key={s.key} className={cn("px-2 py-1 rounded text-[11px] font-semibold", s.key === "trust_score" ? "" : "opacity-50")} style={s.key === "trust_score" ? { color: "var(--ve-accent)" } : { color: "var(--ve-text-muted)" }}>{s.label}</button>)}
        </div>
      </div>

      {/* Leaderboard */}
      {isLoading ? <div className="space-y-2">{[1,2,3,4,5].map(i => <LoadingCard key={i} lines={2} />)}</div>
      : isError ? <ErrorCard onRetry={() => refetch()} />
      : entries.length > 0 ? <div className="space-y-2">{entries.map((e: any) => {
        const border = getBorderForUser({ trustScore: e.trust_score, vouchLevel: e.vouch_level });
        return (
          <div key={e.user_id} className={cn("ve-card p-4 flex items-center gap-4 ve-card-hover")}>
            <div className={cn("w-8 text-center font-extrabold font-mono", e.rank === 1 ? "text-yellow-400 text-lg" : e.rank === 2 ? "text-slate-300" : e.rank === 3 ? "text-amber-600" : "text-sm")} style={{ color: e.rank > 3 ? "var(--ve-text-dim)" : undefined }}>
              {e.rank === 1 ? "🥇" : e.rank === 2 ? "🥈" : e.rank === 3 ? "🥉" : `#${e.rank}`}
            </div>
            <ProfileAvatar username={e.username} borderType={border} size="md" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold truncate">@{e.username}</span>
                {(e.vouch_level === "gold" || e.vouch_level === "platinum") && <span className="ve-badge" style={{ color: "var(--ve-success)", borderColor: "var(--ve-success)" }}>VERIFIED</span>}
              </div>
              <div className="mt-0.5 flex items-center gap-3 text-[10px] font-mono" style={{ color: "var(--ve-text-muted)" }}>
                <span style={{ color: "var(--ve-success)" }}>{e.won}W</span>
                <span style={{ color: "var(--ve-danger)" }}>{e.lost}L</span>
                <span style={{ color: "var(--ve-accent)" }}>{(e.win_rate * 100).toFixed(0)}%</span>
                {e.current_streak >= 3 && <span style={{ color: "var(--ve-warning)" }}><Flame className="w-2.5 h-2.5 inline" /> {e.current_streak}</span>}
              </div>
            </div>
            <TrustScoreRing score={e.trust_score} size={40} />
            <div className="text-right">
              <div className="text-lg font-bold font-mono" style={{ color: "var(--ve-accent)" }}>{e.trust_score}</div>
              <div className="text-[9px] uppercase" style={{ color: "var(--ve-text-dim)" }}>trust</div>
            </div>
          </div>
        );
      })}</div>
      : <EmptyStateCard title="No entries yet" description="Be the first! Save and grade picks to appear on the leaderboard." icon={Trophy} />}
    </div>
  );
}
