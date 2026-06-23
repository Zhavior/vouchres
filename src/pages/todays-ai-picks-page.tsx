/**
 * Today's AI Picks Page — daily MLB HR research hub.
 * Fetches from /mlb/ai-picks/today via mlbApi.todaysAIPicks().
 * If backend endpoint is not ready, shows a clean BackendNotReady state.
 * Player cards are clickable → opens PlayerAIBreakdown.
 * Add to Parlay / Vouch/Tail wired to existing picksApi + socialApi.
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mlbApi, type AIPickData } from "@/services/mlb";
import { picksApi } from "@/services/picks";
import { socialApi } from "@/services/social";
import { AIPickCard } from "@/components/ai-picks/ai-pick-card";
import { PlayerAIBreakdown } from "@/components/ai-picks/player-ai-breakdown";
import { EmptyStateCard, LoadingCard, ErrorCard, BackendNotReady, DebugNote } from "@/components/ui-states";
import { Sparkles, Flame, TrendingUp, AlertTriangle, Clock, Target, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const FILTERS = [
  { key: "all", label: "All" }, { key: "top", label: "Top HR" },
  { key: "undervalued", label: "Undervalued" }, { key: "watchlist", label: "Watchlist" },
  { key: "pitcher", label: "Pitcher Danger" }, { key: "results", label: "Results" },
];

export function TodaysAIPicksPage() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedPlayer, setSelectedPlayer] = useState<AIPickData | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["mlb", "ai-picks", "today"],
    queryFn: () => mlbApi.todaysAIPicks({ limit: 100 }),
    retry: 1,
    staleTime: 60_000,
  });

  const savePick = useMutation({
    mutationFn: (pick: AIPickData) => picksApi.save({
      game_id: parseInt(pick.playerId) || 0,
      player_id: parseInt(pick.playerId) || 0,
      market: "hr",
      line: 0.5,
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["picks", "my"] }),
  });

  const createPost = useMutation({
    mutationFn: (pick: AIPickData) => socialApi.createPost({
      type: "pick",
      body: `AI HR Watch: ${pick.playerName} (${pick.team}) vs ${pick.opponent}\nAI Confidence: ${pick.scores.hrConfidenceScore}% - ${pick.confidenceLabel}\nRisk Tier: ${pick.riskTier}\n\n${pick.aiReasoning}\n\nProbability-based. No guarantees.`,
    }),
  });

  const handleAddToParlay = (pick: AIPickData) => {
    savePick.mutate(pick);
  };

  const handleVouchTail = (pick: AIPickData) => {
    createPost.mutate(pick);
  };

  // Player breakdown view
  if (selectedPlayer) {
    return (
      <PlayerAIBreakdown
        pick={selectedPlayer}
        onBack={() => setSelectedPlayer(null)}
        onAddToParlay={() => handleAddToParlay(selectedPlayer)}
        onVouchTail={() => handleVouchTail(selectedPlayer)}
      />
    );
  }

  const aiData = data?.data;
  const showSection = (s: string) => activeFilter === "all" || activeFilter === s;

  // Check if backend returned 404 (endpoint not ready)
  const isNotReady = isError && (error as any)?.response?.status === 404;

  return (
    <div className="space-y-5">
      {/* Hero */}
      <div>
        <h1 className="text-xl font-extrabold flex items-center gap-2">
          <Sparkles className="w-5 h-5" style={{ color: "var(--ve-accent)" }} /> Today's MLB AI Picks
        </h1>
        {aiData && (
          <div className="flex items-center gap-3 mt-2 text-[10px] font-mono" style={{ color: "var(--ve-text-dim)" }}>
            <span>{aiData.date || new Date().toISOString().split("T")[0]}</span>
            <span>-</span>
            <span>Updated {aiData.lastUpdated ? new Date(aiData.lastUpdated).toLocaleTimeString() : "—"}</span>
            {aiData.dataQuality && (
              <span className="ve-badge" style={{ color: aiData.dataQuality === "real_api_plus_model" ? "var(--ve-success)" : "var(--ve-warning)" }}>
                {aiData.dataQuality === "real_api_plus_model" ? "LIVE DATA" : "DEMO FALLBACK"}
              </span>
            )}
          </div>
        )}
        <p className="text-xs mt-2 max-w-2xl" style={{ color: "var(--ve-text-muted)" }}>
          Daily HR and matchup research built from live games, player form, pitcher notes, and VouchEdge scoring. Probability-based. No guarantees.
        </p>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map(i => <LoadingCard key={i} lines={4} />)}
        </div>
      )}

      {/* Backend not ready */}
      {isNotReady && (
        <BackendNotReady endpoint="/mlb/ai-picks/today" />
      )}

      {/* Other errors */}
      {isError && !isNotReady && (
        <ErrorCard message="Failed to load AI picks. Check backend connection." onRetry={() => queryClient.invalidateQueries({ queryKey: ["mlb", "ai-picks", "today"] })} />
      )}

      {/* Data loaded */}
      {aiData && (
        <>
          {/* Filter tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {FILTERS.map(f => (
              <button key={f.key} onClick={() => setActiveFilter(f.key)}
                className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all",
                  activeFilter === f.key ? "ve-badge" : "")}
                style={activeFilter === f.key ? {} : { color: "var(--ve-text-muted)" }}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Section 1: Top 3 HR Picks */}
          {showSection("top") && aiData.topHomeRunPicks?.length > 0 && (
            <Section title="Top 3 Home Run Picks" icon={<Flame className="w-4 h-4" style={{ color: "var(--ve-danger)" }} />}>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {aiData.topHomeRunPicks.map((pick: AIPickData, i: number) => (
                  <AIPickCard key={i} pick={pick} variant="top" onViewBreakdown={() => setSelectedPlayer(pick)}
                    onAddToParlay={() => handleAddToParlay(pick)} onVouchTail={() => handleVouchTail(pick)} />
                ))}
              </div>
            </Section>
          )}

          {/* Section 2: Undervalued HR Picks */}
          {showSection("undervalued") && aiData.undervaluedHomeRunPicks?.length > 0 && (
            <Section title="Undervalued HR Picks" icon={<TrendingUp className="w-4 h-4" style={{ color: "var(--ve-purple)" }} />}>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {aiData.undervaluedHomeRunPicks.map((pick: AIPickData, i: number) => (
                  <AIPickCard key={i} pick={pick} variant="undervalued" onViewBreakdown={() => setSelectedPlayer(pick)}
                    onAddToParlay={() => handleAddToParlay(pick)} onVouchTail={() => handleVouchTail(pick)} />
                ))}
              </div>
            </Section>
          )}

          {/* Section 3: New HR Watchlist */}
          {showSection("watchlist") && aiData.newHRWatchlist?.length > 0 && (
            <Section title="New HR Watchlist" icon={<Zap className="w-4 h-4" style={{ color: "var(--ve-warning)" }} />}>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {aiData.newHRWatchlist.map((pick: AIPickData, i: number) => (
                  <AIPickCard key={i} pick={pick} variant="watchlist" onViewBreakdown={() => setSelectedPlayer(pick)}
                    onAddToParlay={() => handleAddToParlay(pick)} onVouchTail={() => handleVouchTail(pick)} />
                ))}
              </div>
            </Section>
          )}

          {/* Section 4: Pitcher Danger List */}
          {showSection("pitcher") && aiData.pitcherDangerList?.length > 0 && (
            <Section title="Pitcher Danger List" icon={<AlertTriangle className="w-4 h-4" style={{ color: "var(--ve-danger)" }} />}>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {aiData.pitcherDangerList.map((pitcher: any, i: number) => (
                  <div key={i} className="ve-card p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold">{pitcher.pitcherName}</span>
                      <span className="ve-badge" style={{ color: "var(--ve-danger)" }}>{pitcher.dangerRating}</span>
                    </div>
                    <div className="text-[11px] mb-2" style={{ color: "var(--ve-text-muted)" }}>{pitcher.team} vs {pitcher.opponent}</div>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div className="rounded-lg px-2 py-1.5 text-center" style={{ background: "rgba(5,11,24,0.4)", border: "1px solid var(--ve-card-border)" }}>
                        <div className="text-[9px] font-mono uppercase" style={{ color: "var(--ve-text-dim)" }}>HR Risk</div>
                        <div className="text-sm font-bold font-mono" style={{ color: "var(--ve-danger)" }}>{pitcher.hrRisk}/100</div>
                      </div>
                      <div className="rounded-lg px-2 py-1.5 text-center" style={{ background: "rgba(5,11,24,0.4)", border: "1px solid var(--ve-card-border)" }}>
                        <div className="text-[9px] font-mono uppercase" style={{ color: "var(--ve-text-dim)" }}>Fly Ball</div>
                        <div className="text-xs font-semibold" style={{ color: "var(--ve-text-muted)" }}>{pitcher.flyBallRisk}</div>
                      </div>
                    </div>
                    {pitcher.likelyBatters?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {pitcher.likelyBatters.map((b: string) => <span key={b} className="ve-badge">{b}</span>)}
                      </div>
                    )}
                    <div className="flex items-start gap-1.5 text-[10px]" style={{ color: "var(--ve-warning)" }}>
                      <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" /><span>{pitcher.matchupWarning}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Section 5: Boost Games */}
          {showSection("all") && aiData.boostGames?.length > 0 && (
            <Section title="Park / Weather Boost Games" icon={<Target className="w-4 h-4" style={{ color: "var(--ve-accent)" }} />}>
              <div className="space-y-2">
                {aiData.boostGames.map((game: any, i: number) => (
                  <div key={i} className="ve-card p-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold">{game.game}</div>
                      <div className="text-[11px]" style={{ color: "var(--ve-text-muted)" }}>{game.weatherNote} - {game.windNote}</div>
                    </div>
                    <span className="ve-badge">{game.boostType}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Section 6: Yesterday's Results */}
          {showSection("results") && (
            <Section title="Yesterday's AI Results" icon={<Clock className="w-4 h-4" style={{ color: "var(--ve-text-dim)" }} />}>
              {aiData.yesterdayResults?.length > 0 ? (
                <div className="space-y-2">
                  {aiData.yesterdayResults.map((r: any, i: number) => (
                    <div key={i} className="ve-card p-3 flex items-center justify-between">
                      <div className="text-sm">{r.playerName} <span className="text-xs" style={{ color: "var(--ve-text-dim)" }}>{r.market}</span></div>
                      <span className="text-xs font-bold" style={{ color: r.result === "WON" ? "var(--ve-success)" : r.result === "LOST" ? "var(--ve-danger)" : "var(--ve-text-dim)" }}>{r.result}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyStateCard title="No graded results yet" description="Yesterday's graded AI results will appear here after games are final." icon={Clock} />
              )}
            </Section>
          )}

          {/* All sections empty */}
          {aiData && !aiData.topHomeRunPicks?.length && !aiData.undervaluedHomeRunPicks?.length && !aiData.newHRWatchlist?.length && (
            <EmptyStateCard title="No AI picks returned yet" description="The backend /mlb/ai-picks/today endpoint returned empty data. Check backend MLB data ingestion and model service." icon={Sparkles} />
          )}

          {/* Debug note for limited data */}
          {aiData?.topHomeRunPicks?.length <= 3 && aiData?.dataQuality === "demo_fallback" && (
            <DebugNote message="Backend returned demo fallback data. Real MLB API + model integration needed on backend." />
          )}
        </>
      )}
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-sm font-bold mb-3 flex items-center gap-2">{icon} {title}</h2>
      {children}
    </section>
  );
}
