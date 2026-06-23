import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { mlbApi, type Game, type PickCard } from "@/services/mlb";
import { picksApi, type UserRecord } from "@/services/picks";
import { socialApi } from "@/services/social";
import { trustApi } from "@/services/trust";
import { GameCard } from "@/components/game-card";
import { PlayerPickCard } from "@/components/player-pick-card";
import { UserTrustCard } from "@/components/user-trust-card";
import { EmptyState } from "@/components/empty-state";
import { LoadingSkeleton } from "@/components/loading-skeleton";
import { ErrorState } from "@/components/error-state";
import {
  Sparkles, Swords, Flame, TrendingUp, Trophy, Bell, Clock, Zap,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";

export function DashboardPage() {
  const me = useAuthStore((s) => s.me);

  const games = useQuery({
    queryKey: ["mlb", "games", "today"],
    queryFn: () => mlbApi.gamesToday(),
    staleTime: 60_000,
  });

  const picks = useQuery({
    queryKey: ["mlb", "picks", "today", "top6"],
    queryFn: () => mlbApi.picksToday({ sort: "edge", limit: 6 }),
    staleTime: 60_000,
  });

  const record = useQuery({
    queryKey: ["picks", "results", "my"],
    queryFn: () => picksApi.results(),
    staleTime: 30_000,
  });

  const trending = useQuery({
    queryKey: ["trending", "24h", "3"],
    queryFn: () => socialApi.trending({ period: "24h", limit: 3 }),
    staleTime: 60_000,
  });

  const leaderboard = useQuery({
    queryKey: ["leaderboard", "trust", "5"],
    queryFn: () => trustApi.leaderboard({ sort: "trust_score", limit: 5 }),
    staleTime: 60_000,
  });

  const gamesList = games.data?.data ?? [];
  const liveGames = gamesList.filter((g) => g.status === "live" || g.status === "delayed");
  const picksList = picks.data?.data ?? [];
  const recordData = record.data;
  const trendingList = trending.data?.data ?? [];
  const leaderboardList = leaderboard.data?.data ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Dashboard</h1>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            {games.data?.meta?.is_stale ? (
              <span className="text-warning">Data may be stale — showing cached</span>
            ) : (
              <span>Data freshness: <span className="text-electric-300 font-mono">live</span></span>
            )}
          </p>
        </div>
        <Link to="/picks" className="electric-button text-xs">
          <Sparkles className="w-3.5 h-3.5 inline mr-1" />
          Browse AI Picks
        </Link>
      </div>

      {/* User stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Trust Score"
          value={me?.trust_score?.toString() ?? "0"}
          sub={me?.vouch_level ?? "unverified"}
          icon={Trophy}
          accent="electric"
        />
        <StatCard
          label="Verified Record"
          value={recordData ? `${recordData.record.won}-${recordData.record.lost}` : "0-0"}
          sub={`${recordData?.record.decided ?? 0} graded`}
          icon={TrendingUp}
          accent="success"
        />
        <StatCard
          label="Win Rate"
          value={recordData ? `${(recordData.record.win_rate * 100).toFixed(0)}%` : "—"}
          sub={`${recordData?.record.current_streak ?? 0} streak`}
          icon={Zap}
          accent="electric"
        />
        <StatCard
          label="Plan"
          value={me?.plan?.toUpperCase() ?? "FREE"}
          sub={me?.plan === "free" ? "Upgrade for more" : "Active"}
          icon={Bell}
          accent="slate"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's best AI picks */}
          <section>
            <SectionHeader icon={Sparkles} title="Today's Best AI Picks" link="/picks" />
            {picks.isLoading ? (
              <div className="grid sm:grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <LoadingSkeleton key={i} lines={5} className="glass-card p-4" />
                ))}
              </div>
            ) : picks.isError ? (
              <ErrorState onRetry={() => picks.refetch()} />
            ) : picksList.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-3">
                {picksList.slice(0, 4).map((pick, i) => (
                  <PlayerPickCard key={`${pick.player_id}-${pick.market}-${i}`} score={pick as any} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Sparkles}
                title="No AI picks available"
                description="Model scores will appear here once today's games are ingested."
              />
            )}
          </section>

          {/* Live games */}
          <section>
            <SectionHeader icon={Swords} title="Live Games" link="/live" />
            {games.isLoading ? (
              <div className="grid sm:grid-cols-2 gap-3">
                {[1, 2].map((i) => (
                  <LoadingSkeleton key={i} lines={4} className="glass-card p-4" />
                ))}
              </div>
            ) : games.isError ? (
              <ErrorState onRetry={() => games.refetch()} />
            ) : liveGames.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-3">
                {liveGames.slice(0, 4).map((g) => (
                  <GameCard
                    key={g.id}
                    id={g.id}
                    awayAbbr={g.away_abbr}
                    homeAbbr={g.home_abbr}
                    awayScore={g.away_score ?? undefined}
                    homeScore={g.home_score ?? undefined}
                    venue={g.venue ?? undefined}
                    scheduledFirstPitch={g.scheduled_first_pitch}
                    status={g.status}
                    weather={g.weather ?? undefined}
                    lineupConfirmed={g.lineup_confirmed}
                    dataFreshAt={g.data_fresh_at}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Swords}
                title="No live games"
                description="Today's MLB slate will appear here when games go live."
              />
            )}
          </section>

          {/* All today's games */}
          <section>
            <SectionHeader icon={Clock} title="Today's Schedule" link="/live" />
            {gamesList.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-3">
                {gamesList.slice(0, 6).map((g) => (
                  <GameCard
                    key={g.id}
                    id={g.id}
                    awayAbbr={g.away_abbr}
                    homeAbbr={g.home_abbr}
                    awayScore={g.away_score ?? undefined}
                    homeScore={g.home_score ?? undefined}
                    venue={g.venue ?? undefined}
                    scheduledFirstPitch={g.scheduled_first_pitch}
                    status={g.status}
                    weather={g.weather ?? undefined}
                    lineupConfirmed={g.lineup_confirmed}
                    dataFreshAt={g.data_fresh_at}
                  />
                ))}
              </div>
            ) : (
              <EmptyState icon={Clock} title="No games scheduled today" />
            )}
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Trending cappers / leaderboard */}
          <section>
            <SectionHeader icon={TrendingUp} title="Top Cappers" link="/leaderboard" />
            {leaderboard.isLoading ? (
              <LoadingSkeleton lines={4} className="glass-card p-4" />
            ) : leaderboardList.length > 0 ? (
              <div className="space-y-2">
                {leaderboardList.slice(0, 5).map((entry) => (
                  <div key={entry.user_id} className="glass-card p-3 flex items-center gap-3">
                    <div className="text-electric-300 font-mono font-bold text-sm w-6">
                      #{entry.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-100 truncate">
                        @{entry.username}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {entry.won}-{entry.lost} · {(entry.win_rate * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div className="text-electric-300 font-mono font-bold text-sm">
                      {entry.trust_score}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={TrendingUp} title="No cappers yet" className="py-8" />
            )}
          </section>

          {/* Trending picks */}
          <section>
            <SectionHeader icon={Flame} title="Trending Picks" link="/feed" />
            {trending.isLoading ? (
              <LoadingSkeleton lines={3} className="glass-card p-4" />
            ) : trendingList.length > 0 ? (
              <div className="space-y-2">
                {trendingList.map((t) => (
                  <div key={t.post_id} className="glass-card p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-slate-100">
                        @{t.author_username}
                      </span>
                      {t.posted_before_game && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-success/10 text-success">
                          ✓ PRE-GAME
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {t.market.toUpperCase()} · score {t.trending_score.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={Flame} title="No trending picks" className="py-8" />
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  link,
}: {
  icon: any;
  title: string;
  link?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
        <Icon className="w-4 h-4 text-electric-400" />
        {title}
      </h2>
      {link && (
        <Link to={link} className="text-[11px] text-electric-300 hover:underline font-mono">
          view all →
        </Link>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  icon: any;
  accent: "electric" | "success" | "slate";
}) {
  const colors = {
    electric: "text-electric-300",
    success: "text-success",
    slate: "text-slate-300",
  };
  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
          {label}
        </span>
        <Icon className={cn("w-3.5 h-3.5", colors[accent])} />
      </div>
      <div className="mt-2 text-2xl font-bold font-mono text-slate-100">{value}</div>
      <div className="text-[10px] text-slate-500">{sub}</div>
    </div>
  );
}
