import { RefreshCw, Flame } from "lucide-react";

type HrBoardHeroProps = {
  candidateBuckets?: {
    elite?: any[];
    strong?: any[];
    watchlist?: any[];
  };
  confirmedCount: number;
  projectedCount: number;
  blockedCount: number;
  lastUpdated: Date | null;
  loading: boolean;
  onRefresh: () => void;
};




  confirmedCount: number;
  projectedCount: number;
  blockedCount: number;
  lastUpdated: Date | null;
  loading: boolean;
  onRefresh: () => void;
};


  andidateBuckets?: {
    elite?: any[];
    strong?: any[];
    watchlist?: any[];
  };
  truthSummary?: any;

  confirmedCount: number;
  projectedCount: number;
  blockedCount: number;
  lastUpdated: Date | null;
  loading: boolean;
  onRefresh: () => void;
};

export default function HrBoardHero({
  confirmedCount,
  projectedCount,
  blockedCount,
  lastUpdated,
  loading,
  onRefresh,
  }: HrBoardHeroProps) {
  return (
    <section className="ve-premium-panel mb-4 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-[hsl(var(--ve-accent-gold))]" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-[hsl(var(--ve-accent-gold))]">
              Today's HR Edge
            </span>
          </div>

          <h1 className="mt-2 text-3xl font-black">
            Daily HR Board
          </h1>

          <p className="mt-2 text-sm text-[hsl(var(--ve-text-muted))]">
            {lastUpdated
              ? `Updated ${lastUpdated.toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                })}`
              : "Loading latest slate..."}
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="ve-btn-secondary"
        >
          <RefreshCw className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-emerald-500/10 p-3">
          <div className="text-2xl font-black">{confirmedCount}

      {/* EDGE ISLAND */}
      <div className="mt-5 rounded-xl border border-white/10 bg-black/30 p-4">
        
        <div className="mb-3 text-xs uppercase tracking-[0.25em] text-white/50">
          🔥 Today's HR Edge
        </div>

        <div className="grid grid-cols-3 gap-3 text-xs">

          {/* ELITE */}
          <div>
            <div className="text-white/70 mb-1">Elite</div>
            <div className="space-y-1">
              {(                <div key={i} className="flex justify-between">
                  <span className="text-white/90 truncate">{p.playerName || "—"}</span>
                  <span className="text-emerald-400">#{i+1}</span>
                </div>
              ))}
            </div>
          </div>

          {/* STRONG */}
          <div>
            <div className="text-white/70 mb-1">Strong</div>
            <div className="space-y-1">
              {(                <div key={i} className="flex justify-between">
                  <span className="text-white/90 truncate">{p.playerName || "—"}</span>
                  <span className="text-cyan-400">#{i+1}</span>
                </div>
              ))}
            </div>
          </div>

          {/* WATCHLIST */}
          <div>
            <div className="text-white/70 mb-1">Watch</div>
            <div className="space-y-1">
              {(                <div key={i} className="flex justify-between">
                  <span className="text-white/90 truncate">{p.playerName || "—"}</span>
                  <span className="text-yellow-400">#{i+1}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
</div>
          <div className="text-xs uppercase">Confirmed</div>
        </div>

        <div className="rounded-xl bg-cyan-500/10 p-3">
          <div className="text-2xl font-black">{projectedCount}</div>
          <div className="text-xs uppercase">Projected</div>
        </div>

        <div className="rounded-xl bg-yellow-500/10 p-3">
          <div className="text-2xl font-black">{blockedCount}</div>
          <div className="text-xs uppercase">Blocked</div>
        </div>
      </div>
    </section>
  );
}