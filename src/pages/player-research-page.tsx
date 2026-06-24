/**
 * PlayerResearchPage — Search players, view stats, HR targets and AI breakdown.
 * Uses mlbApi.playersSearch(), mlbApi.player(), mlbApi.hrTargets().
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Target, TrendingUp, ChevronRight, Activity, X } from "lucide-react";
import { mlbApi, type PlayerSearchResult } from "@/services/mlb";

export function PlayerResearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [tab, setTab] = useState<"search" | "hr-targets">("search");

  const searchResults = useQuery({
    queryKey: ["player-search", searchQuery],
    queryFn: () => mlbApi.playersSearch(searchQuery, 10),
    enabled: searchQuery.trim().length >= 2,
    staleTime: 30_000,
  });

  const playerDetail = useQuery({
    queryKey: ["player-detail", selectedPlayerId],
    queryFn: () => mlbApi.player(selectedPlayerId!),
    enabled: selectedPlayerId !== null,
  });

  const hrTargets = useQuery({
    queryKey: ["hr-targets"],
    queryFn: () => mlbApi.hrTargets(10),
    staleTime: 60_000,
  });

  const players: PlayerSearchResult[] = searchResults.data?.data ?? [];
  const detail = playerDetail.data?.data as any;
  const targets = (hrTargets.data?.data ?? []) as any[];

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Search className="w-5 h-5 text-sky-400" />
        <h2 className="text-lg font-bold text-slate-100 uppercase tracking-wider">Player Research Console</h2>
      </div>

      {/* Tab bar */}
      <div className="ve-card p-1 flex gap-1">
        {(["search", "hr-targets"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
              tab === t
                ? "bg-sky-950/60 text-sky-400 border border-sky-800/50"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {t === "search" ? <Search className="w-3.5 h-3.5" /> : <Target className="w-3.5 h-3.5" />}
            {t === "search" ? "Player Search" : "HR Targets"}
          </button>
        ))}
      </div>

      {/* Search tab */}
      {tab === "search" && (
        <div className="space-y-4 animate-slide-up">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setSelectedPlayerId(null); }}
              className="ve-input pl-9 text-sm"
              placeholder="Search players by name..."
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(""); setSelectedPlayerId(null); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Search results */}
          {searchResults.isLoading && (
            <div className="flex justify-center py-6"><div className="ve-spinner" /></div>
          )}

          {!selectedPlayerId && players.length > 0 && (
            <div className="space-y-2">
              {players.map((p) => (
                <button
                  key={p.player_id}
                  onClick={() => setSelectedPlayerId(p.player_id)}
                  className="ve-card ve-card-hover glow-hover w-full p-3 flex items-center justify-between text-left transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
                      style={{ background: "var(--ve-badge-bg)", color: "var(--ve-accent)" }}>
                      {p.full_name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-100 text-sm">{p.full_name}</div>
                      <div className="text-xs text-slate-400">{p.team_abbr} · {p.position}</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>
              ))}
            </div>
          )}

          {searchQuery.length >= 2 && !searchResults.isLoading && players.length === 0 && (
            <div className="ve-card p-6 text-center text-slate-500 text-sm">No players found for "{searchQuery}"</div>
          )}

          {/* Player detail */}
          {selectedPlayerId && (
            <div className="animate-slide-up space-y-4">
              <button onClick={() => setSelectedPlayerId(null)}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors">
                <X className="w-3.5 h-3.5" /> Back to results
              </button>

              {playerDetail.isLoading ? (
                <div className="flex justify-center py-8"><div className="ve-spinner" /></div>
              ) : detail ? (
                <div className="ve-card p-5 space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black flex-shrink-0 overflow-hidden"
                      style={{ background: "var(--ve-badge-bg)", color: "var(--ve-accent)" }}>
                      {detail.headshot_url ? (
                        <img src={detail.headshot_url} alt={detail.name} className="w-full h-full object-cover" />
                      ) : (
                        (detail.name ?? "?").charAt(0)
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-black text-slate-100">{detail.name}</h3>
                      <p className="text-sm text-slate-400">{detail.team_name ?? ""} · {detail.position ?? ""}</p>
                      <p className="text-xs text-slate-500">B/T: {detail.bats ?? "?"}/{detail.throws ?? "?"}</p>
                    </div>
                  </div>

                  {/* Recent form stats */}
                  {detail.recent_form?.length > 0 && (
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-2">Recent Form</div>
                      <div className="space-y-2">
                        {detail.recent_form.slice(0, 3).map((form: any, i: number) => (
                          <div key={i} className="grid grid-cols-5 gap-2">
                            {["avg", "hr", "rbi", "ops", "games"].map((stat) => (
                              <div key={stat} className="p-2 rounded-lg text-center" style={{ background: "var(--ve-badge-bg)" }}>
                                <div className="text-xs font-mono font-bold" style={{ color: "var(--ve-accent)" }}>{form[stat] ?? "—"}</div>
                                <div className="text-[9px] text-slate-500 uppercase">{stat}</div>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="ve-card p-6 text-center text-slate-500">Player details unavailable.</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* HR Targets tab */}
      {tab === "hr-targets" && (
        <div className="space-y-3 animate-slide-up">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
            <Target className="w-4 h-4 text-sky-400" />
            <span>AI-identified HR targets for today's slate</span>
          </div>

          {hrTargets.isLoading ? (
            <div className="flex justify-center py-8"><div className="ve-spinner" /></div>
          ) : targets.length === 0 ? (
            <div className="ve-card p-8 text-center text-slate-500">No HR targets available right now.</div>
          ) : (
            targets.map((pick, i) => (
              <div key={pick.player_id ?? i} className="ve-card ve-card-hover glow-hover p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] bg-amber-950/60 text-amber-400 font-bold px-2 py-0.5 rounded uppercase border border-amber-800/40">
                        HR Target
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{pick.market}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        pick.risk_tier === "low" ? "text-emerald-400 bg-emerald-950/40" :
                        pick.risk_tier === "high" ? "text-rose-400 bg-rose-950/40" :
                        "text-amber-400 bg-amber-950/40"
                      }`}>{pick.risk_tier}</span>
                    </div>
                    <p className="font-semibold text-slate-200 text-sm">{pick.player_name}</p>
                    <p className="text-xs text-slate-400">{pick.team_abbr} vs {pick.opponent_abbr}</p>
                    <div className="mt-2 flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-1">
                        <Activity className="w-3 h-3 text-sky-400" />
                        <span className="text-slate-300 font-mono">Conf: {Math.round((pick.confidence ?? 0) * 100)}%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-emerald-400" />
                        <span className="text-slate-300 font-mono">Edge: {(pick.edge ?? 0) > 0 ? "+" : ""}{(pick.edge ?? 0).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-[10px] text-slate-500">Line: {pick.line}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
