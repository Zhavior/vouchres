import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { trustApi } from "@/services/trust";
import { TrustBadge } from "@/components/trust-badge";
import { EmptyState } from "@/components/empty-state";
import { LoadingSkeleton } from "@/components/loading-skeleton";
import { ErrorState } from "@/components/error-state";
import { Trophy, ShieldCheck, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

const MARKETS = [
  { key: "all", label: "All Markets" },
  { key: "hr", label: "HR" },
  { key: "hit", label: "Hits" },
  { key: "rbi", label: "RBI" },
  { key: "run", label: "Runs" },
  { key: "tb", label: "TB" },
];

const PERIODS = [
  { key: "7d", label: "7 Days" },
  { key: "30d", label: "30 Days" },
  { key: "all", label: "All Time" },
];

const SORTS = [
  { key: "trust_score", label: "Trust Score" },
  { key: "win_rate", label: "Win Rate" },
  { key: "verified_picks", label: "Volume" },
  { key: "streak", label: "Streak" },
];

export function LeaderboardPage() {
  const [market, setMarket] = useState("all");
  const [period, setPeriod] = useState("all");
  const [sort, setSort] = useState("trust_score");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["leaderboard", market, period, sort],
    queryFn: () => trustApi.leaderboard({
      market: market !== "all" ? market : undefined,
      period,
      sort,
      limit: 50,
    }),
    staleTime: 60_000,
  });

  const entries = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
          <Trophy className="w-5 h-5 text-electric-400" />
          Leaderboard
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl">
          Ranked by trust score, win rate, volume, or streak. Filter by market and time period.
          Every entry has a server-verified record — no self-reported wins.
        </p>
      </div>

      {/* Filters */}
      <div className="glass-card p-3 space-y-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-[10px] text-slate-500 font-mono shrink-0">MARKET</span>
          {MARKETS.map((m) => (
            <button
              key={m.key}
              onClick={() => setMarket(m.key)}
              className={cn(
                "px-2 py-1 rounded text-[11px] font-semibold whitespace-nowrap transition-all",
                market === m.key
                  ? "text-electric-300 bg-electric-500/10"
                  : "text-slate-500 hover:text-slate-300"
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 font-mono">PERIOD</span>
            {PERIODS.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={cn(
                  "px-2 py-1 rounded text-[11px] font-semibold transition-all",
                  period === p.key
                    ? "text-electric-300 bg-electric-500/10"
                    : "text-slate-500 hover:text-slate-300"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 ml-auto">
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

      {/* Leaderboard */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <LoadingSkeleton key={i} lines={2} className="glass-card p-4" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : entries.length > 0 ? (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div
              key={entry.user_id}
              className={cn(
                "glass-card p-4 flex items-center gap-4",
                entry.rank <= 3 && "border-electric-500/40"
              )}
            >
              {/* Rank */}
              <div className={cn(
                "w-10 text-center font-extrabold font-mono",
                entry.rank === 1 ? "text-yellow-400 text-xl" :
                entry.rank === 2 ? "text-slate-300 text-lg" :
                entry.rank === 3 ? "text-amber-600 text-lg" :
                "text-slate-500 text-sm"
              )}>
                {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : `#${entry.rank}`}
              </div>

              {/* User info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-100 truncate">
                    @{entry.username}
                  </span>
                  {(entry.vouch_level === "gold" || entry.vouch_level === "platinum") && (
                    <span className="verified-badge">
                      <ShieldCheck className="w-2.5 h-2.5" />
                      VERIFIED
                    </span>
                  )}
                  <TrustBadge level={entry.vouch_level as any} score={entry.trust_score} />
                </div>
                <div className="mt-1 flex items-center gap-3 text-[10px] text-slate-400 font-mono">
                  <span className="text-success font-bold">{entry.won}W</span>
                  <span className="text-danger">{entry.lost}L</span>
                  <span className="text-electric-300">{(entry.win_rate * 100).toFixed(0)}% WR</span>
                  <span>{entry.decided_picks} picks</span>
                  {entry.current_streak >= 3 && (
                    <span className="text-warning flex items-center gap-0.5">
                      <Flame className="w-3 h-3" />
                      {entry.current_streak} streak
                    </span>
                  )}
                </div>
              </div>

              {/* Trust score */}
              <div className="text-right">
                <div className="text-2xl font-bold font-mono text-electric-300">
                  {entry.trust_score}
                </div>
                <div className="text-[9px] text-slate-500 font-mono uppercase">trust</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Trophy}
          title="No entries yet"
          description="Be the first! Save and grade picks to appear on the leaderboard."
        />
      )}
    </div>
  );
}
